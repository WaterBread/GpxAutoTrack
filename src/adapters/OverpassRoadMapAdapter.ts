import axios, { AxiosError } from 'axios';
import { RoadMap } from "../domain/RoadMap";
import { TrackPoint } from "../domain/TrackPoint";
import { TrackSegment } from "../domain/TrackSegment";
import { RoadRepo } from "../domain/ports/RoadRepo";

const isAxiosError = (error: any): error is AxiosError => {
    return (error as AxiosError).isAxiosError !== undefined;
}

export class OverpassRoadData implements RoadRepo {
    public async getRoads(upperLeft: [number, number], bottomRight: [number, number]): Promise<RoadMap> {
        const [upperLat, leftLon] = upperLeft;
        const [bottomLat, rightLon] = bottomRight;

        const query = `[out:json][timeout:25];
        (
          way(${bottomLat},${leftLon},${upperLat},${rightLon})[~"^highway$"~"."];
          >;
        );
        out geom;`;

        console.log('Querying Overpass API with:', query);

        const url = `http://overpass-api.de/api/interpreter`;

        try {
            const response = await axios.post(url, `data=${encodeURIComponent(query)}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const elements = response.data.elements;
            let roads: TrackSegment[] = [];
            let currentRoad: TrackPoint[] = [];
            let nodeMap = new Map<number, TrackPoint>();

            // First, map all nodes
            for (const element of elements) {
                if (element.type === 'node') {
                    nodeMap.set(element.id, new TrackPoint(element.lat, element.lon));
                }
            }

            // Then, construct roads using the nodes
            for (const element of elements) {
                if (element.type === 'way') {
                    currentRoad = [];
                    for (const nodeId of element.nodes) {
                        if (nodeMap.has(nodeId)) {
                            currentRoad.push(nodeMap.get(nodeId)!);
                        }
                    }

                    if (currentRoad.length > 0) {
                        roads.push(new TrackSegment(currentRoad));
                    }
                }
            }

            return new RoadMap(roads);
        } catch (error) {
            if (isAxiosError(error)) {
                console.error('Failed to fetch roads from Overpass API:', error.response);
            }
            throw new Error('Failed to fetch roads data');
        }
    }
}

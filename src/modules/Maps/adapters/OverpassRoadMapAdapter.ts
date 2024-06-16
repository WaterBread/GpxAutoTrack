import axios, { AxiosError } from 'axios';
import { RoadMap } from "../domain/RoadMap";
import { TrackPoint } from "../domain/TrackPoint";
import { RoadRepo } from "../domain/ports/RoadRepo";

interface OverpassElement {
    type: 'node' | 'way';
    id: number;
    lat: number;
    lon: number;
    nodes: number[];
}

const isAxiosError = (error: any): error is AxiosError => {
    return (error as AxiosError).isAxiosError !== undefined;
}

const createOverpassQuery = (upperLeft: [number, number], bottomRight: [number, number]): string => {
    const [upperLat, leftLon] = upperLeft;
    const [bottomLat, rightLon] = bottomRight;

    return `[out:json][timeout:25];
        (
            way(around:500,${bottomLat},${leftLon},${upperLat},${rightLon})[~"^highway$"~"."];

          >;
        );
        out geom;`;
}

export class OverpassRoadData implements RoadRepo {
    public async getRoads(upperLeft: [number, number], bottomRight: [number, number]): Promise<RoadMap> {
        const query = createOverpassQuery(upperLeft, bottomRight);
        console.log('Querying Overpass API with:', query);

        const url = 'http://overpass-api.de/api/interpreter';

        try {
            const response = await axios.post(url, `data=${encodeURIComponent(query)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const elements = response.data.elements;
            return new RoadMap(this.constructRoadMap(elements));
        } catch (error) {
            if (isAxiosError(error)) {
                console.error('Failed to fetch roads from Overpass API:', error?.response?.data);
            }
            throw new Error('Failed to fetch roads data');
        }
    }

    private constructRoadMap(elements: OverpassElement[]): Map<TrackPoint, TrackPoint[]> {
        // Map to store nodes by ID for quick lookup
        const nodeMap = new Map<number, TrackPoint>();

        // Populate nodeMap with TrackPoint objects
        elements.forEach(element => {
            if (element.type === 'node') {
                nodeMap.set(element.id, new TrackPoint(element.lat, element.lon));
            }
        });

        // Adjacency list to store the connectivity between TrackPoints
        const adjacencyList: Map<TrackPoint, TrackPoint[]> = new Map<TrackPoint, TrackPoint[]>();

        // Process ways to populate the adjacency list
        elements.forEach(element => {
            if (element.type === 'way' && element.nodes) {
                for (let i = 0; i < element.nodes.length - 1; i++) {
                    const startNode = nodeMap.get(element.nodes[i]);
                    const endNode = nodeMap.get(element.nodes[i + 1]);

                    if (startNode && endNode) {
                        if (!adjacencyList.has(startNode)) {
                            adjacencyList.set(startNode, []);
                        }
                        adjacencyList.get(startNode)!.push(endNode);
                    }
                }
            }
        });

        return adjacencyList;
    }
}

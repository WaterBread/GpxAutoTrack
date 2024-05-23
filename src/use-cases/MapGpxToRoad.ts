import { TrackSegment } from "../domain/TrackSegment";
import { RoadRepo } from "../domain/ports/RoadRepo";

export class MapGpxToRoad {
    constructor(
        private roadData: RoadRepo
    ) { }

    public async execute(gpx: TrackSegment): Promise<TrackSegment> {
        const box = gpx.getBoundingBox();

        const roads = await this.roadData.getRoads(
            [box.maxLat, box.minLon],
            [box.minLat, box.maxLon]
        );

        const connectPointsOnRoads = roads.snapPointsToRoadPoints(gpx)

        const pathfinded = roads.pathfindBetweenPoints(connectPointsOnRoads)

        return pathfinded;
    }
}
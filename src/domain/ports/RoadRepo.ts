import { RoadMap } from "../RoadMap";

export interface RoadRepo {
    getRoads(upperLeft: [number, number], bottomRight: [number, number]): Promise<RoadMap>;
}
import { TrackSegment } from "../domain/TrackSegment";

export class InterpolateGpx {
    constructor(
    ) { }

    public async execute(gpx: TrackSegment, numberOfPoints: number): Promise<TrackSegment> {
        const snappedGpx = gpx.interpolate(numberOfPoints);
        return snappedGpx;
    }
}
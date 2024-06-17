import { TrackSegment } from "../domain/TrackSegment";

export class InterpolateGpx {
    constructor(
    ) { }

    public async execute(gpx: TrackSegment, numberOfPoints: number): Promise<TrackSegment> {
        if (gpx.points.length < 2) {
            return gpx;
        }

        const snappedGpx = gpx.interpolate(numberOfPoints);
        return snappedGpx;
    }
}
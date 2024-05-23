import { TrackSegment } from "../domain/TrackSegment";
import { GpxRepo } from "../domain/ports/GpxRepo";

export class WriteGpx {
    constructor(
        private gpxRepo: GpxRepo
    ) { }

    public async execute(gpx: TrackSegment[]): Promise<void> {
        return await this.gpxRepo.writeGpxFile(gpx);
    }
}
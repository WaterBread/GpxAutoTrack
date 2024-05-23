import { TrackSegment } from "../domain/TrackSegment";
import { GpxRepo } from "../domain/ports/GpxRepo";

export class ReadGpx {
    constructor(
        private gpxRepo: GpxRepo
    ) { }

    public async execute(): Promise<TrackSegment[]> {
        return await this.gpxRepo.readGpxFile();
    }
}
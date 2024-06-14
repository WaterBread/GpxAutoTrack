import { GpxRepo } from "../domain/ports/GpxRepo";
import { RoadRepo } from "../domain/ports/RoadRepo";

import { MapGpxToRoad } from '../use-cases/MapGpxToRoad'
import { InterpolateGpx } from '../use-cases/InterpolateGpx'

interface Args {
    numberOfInterpolationPoints: number;
}

export class ProcessGpx {
    constructor(
        private roadData: RoadRepo,
        private gpxRepo: GpxRepo
    ) { }

    public async execute(args: Args): Promise<void> {
        const gpx = await this.gpxRepo.readGpx();

        const interpolateGpx = new InterpolateGpx();
        const mapGpxToRoad = new MapGpxToRoad(this.roadData);

        const result = await Promise.all(gpx.map(async segment => {
            // Interpolate
            const interpolatedGpx = await interpolateGpx.execute(segment, args.numberOfInterpolationPoints);

            // Map interpolated to road
            const mappedGpx = await mapGpxToRoad.execute(interpolatedGpx);

            // Return the result
            return mappedGpx;
        }))

        await this.gpxRepo.writeGpx(result);
    }
}
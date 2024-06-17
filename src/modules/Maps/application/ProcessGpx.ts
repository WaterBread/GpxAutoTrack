import { GpxRepo } from '../domain/ports/GpxRepo';
import { RoadRepo } from '../domain/ports/RoadRepo';
import { InterpolateGpx } from '../use-cases/InterpolateGpx';
import { MapGpxToRoad } from '../use-cases/MapGpxToRoad';

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

        const mapGpxToRoad = new MapGpxToRoad(this.roadData);
        const interpolate = new InterpolateGpx();

        const result = await Promise.all(gpx.map(async segment => {
            // Interpolate
            const interpolated = await interpolate.execute(segment, args.numberOfInterpolationPoints);

            // Map interpolated to road
            const mappedGpx = await mapGpxToRoad.execute(interpolated);

            // Return the result
            return mappedGpx;
        }))

        await this.gpxRepo.writeGpx(result);
    }
}
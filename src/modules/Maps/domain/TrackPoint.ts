import * as turf from '@turf/turf';

export class TrackPoint {
    constructor(
        public lat: number,
        public lon: number,
        public ele?: number,
        public time?: Date
    ) { }

    distanceTo(point: TrackPoint): number {
        return turf.distance(
            [this.lon, this.lat],
            [point.lon, point.lat],
            { units: 'kilometers' }
        );
    }

    equals(point: TrackPoint): boolean {
        return this.lat === point.lat && this.lon === point.lon;
    }
}
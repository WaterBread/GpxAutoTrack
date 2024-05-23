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

    closestPointOnSegment(pointA: TrackPoint, pointB: TrackPoint): TrackPoint {
        const line = turf.lineString([
            [pointA.lon, pointA.lat],
            [pointB.lon, pointB.lat]
        ]);

        const point = turf.point([this.lon, this.lat]);
        const snapped = turf.nearestPointOnLine(line, point);

        return new TrackPoint(snapped.geometry.coordinates[1], snapped.geometry.coordinates[0]);
    }
}
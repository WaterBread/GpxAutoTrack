import { TrackPoint } from "./TrackPoint";

export class TrackSegment {
    constructor(
        public points: TrackPoint[]
    ) { }

    public getBoundingBox = () => {
        const lats = this.points.map(point => point.lat);
        const lons = this.points.map(point => point.lon);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        return {
            minLat,
            maxLat,
            minLon,
            maxLon
        };
    }

    public interpolate(factor: number): TrackSegment {
        const interpolatedPoints: TrackPoint[] = [];

        for (let i = 0; i < this.points.length - 1; i++) {
            const pointA = this.points[i];
            const pointB = this.points[i + 1];

            for (let j = 0; j < factor; j++) {
                const ratio = j / factor;

                const properties = {
                    lat: pointA.lat + (pointB.lat - pointA.lat) * ratio,
                    lon: pointA.lon + (pointB.lon - pointA.lon) * ratio,

                    // Only interpolate elevation and time if both points have them
                    ...((pointA.ele && pointB.ele) && {
                        ele: pointA.ele + (pointB.ele - pointA.ele) * ratio
                    }),

                    // Same for time
                    ...((pointA.time && pointB.time) && {
                        time: new Date(pointA.time.getTime() + (pointB.time.getTime() - pointA.time.getTime()) * ratio)
                    })
                }

                interpolatedPoints.push(new TrackPoint(
                    properties.lat,
                    properties.lon,
                    properties.ele,
                    properties.time
                ));
            }
        }

        return new TrackSegment(interpolatedPoints);
    }
}
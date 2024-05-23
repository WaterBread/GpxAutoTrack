import { TrackPoint } from "./TrackPoint";

export class TrackSegment {
    constructor(
        public points: TrackPoint[]
    ) { }

    public smooth(): TrackSegment {
        const smoothedPoints = this.points.map((point, index, points) => {
            // Skip the first and last points
            if (index === 0 || index === points.length - 1) {
                return point;
            }

            // Smooth the point by averaging it with its neighbors
            return new TrackPoint(
                (points[index - 1].lat + point.lat + points[index + 1].lat) / 3,
                (points[index - 1].lon + point.lon + points[index + 1].lon) / 3,
                point.ele,
                point.time
            );
        });

        return new TrackSegment(smoothedPoints);
    }

    /**
     * Calculate the bounding box of the track segment
     */
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

    closestPointToTrack(point: TrackPoint, mappingSegments: TrackSegment) {
        let minDistance = Infinity;
        let closestPoint: TrackPoint | undefined;

        for (const mappingPoint of mappingSegments.points) {
            const distance = point.distanceTo(mappingPoint);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = mappingPoint;
            }

        }

        return closestPoint;
    }

    public mapTrackSegmentToTrackSegment(mappingSegment: TrackSegment): TrackSegment {
        const mappedPoints = this.points.map((point) => {
            const closestPoint = this.closestPointToTrack(point, mappingSegment);

            if (!closestPoint) {
                throw new Error("Could not find a closest point");
            }

            return closestPoint;
        });

        return new TrackSegment(mappedPoints);
    }
}
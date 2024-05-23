import { TrackPoint } from "./TrackPoint";
import { TrackSegment } from "./TrackSegment";
import GraphLib from 'graphlib';

export class RoadMap {
    private graph = new GraphLib.Graph({
        directed: false
    });
    private maxDistance: number = 0.1;

    constructor(
        public roads: TrackSegment[]
    ) {
        this.buildGraph();
    }

    pointId = (point: TrackPoint) => `${point.lat},${point.lon}`;

    buildGraph() {
        for (const road of this.roads) {
            for (let i = 0; i < road.points.length - 1; i++) {
                const pointA = road.points[i];
                const pointB = road.points[i + 1];

                this.graph.setNode(this.pointId(pointA), pointA);

                const distance = pointA.distanceTo(pointB);
                if (distance > this.maxDistance) {
                    // Calculate number of extra points needed
                    const numExtraPoints = Math.floor(distance / this.maxDistance);
                    let lastPoint = pointA;

                    // Generate extra points
                    for (let j = 1; j <= numExtraPoints; j++) {
                        const interpolatedPoint = this.interpolatePoint(pointA, pointB, j / (numExtraPoints + 1));
                        this.graph.setNode(this.pointId(interpolatedPoint), interpolatedPoint);
                        this.graph.setEdge(this.pointId(lastPoint), this.pointId(interpolatedPoint), lastPoint.distanceTo(interpolatedPoint));
                        lastPoint = interpolatedPoint;
                    }

                    // Connect the last interpolated point to pointB
                    this.graph.setEdge(this.pointId(lastPoint), this.pointId(pointB), lastPoint.distanceTo(pointB));
                } else {
                    // Connect as usual
                    this.graph.setEdge(this.pointId(pointA), this.pointId(pointB), distance);
                }

                // If last point, add it as a node
                if (i === road.points.length - 2) {
                    this.graph.setNode(this.pointId(pointB), pointB);
                }
            }
        }
    }

    private interpolatePoint(pointA: TrackPoint, pointB: TrackPoint, t: number): TrackPoint {
        const lat = pointA.lat + (pointB.lat - pointA.lat) * t;
        const lon = pointA.lon + (pointB.lon - pointA.lon) * t;
        return new TrackPoint(lat, lon);
    }

    calculateSpeed = (pointA: TrackPoint, pointB: TrackPoint) => {
        if (!pointA.time || !pointB.time) return undefined;

        const distance = pointA.distanceTo(pointB);
        const timeDiff = (pointB.time.getTime() - pointA.time.getTime()) / 3600000;

        return distance / timeDiff;
    }

    // Snaps all points in the given track to the nearest road
    public snapPointsToRoad(gpx: TrackSegment) {
        const snappedPoints = gpx.points.map(point => {
            const closestPoint = this.closestPointToRoad(point);
            return closestPoint || point;
        });

        return new TrackSegment(snappedPoints);
    }

    findClosestGraphNode(point: TrackPoint) {
        let minDistance = Infinity;
        let closestNode: TrackPoint | undefined;

        for (const node of this.graph.nodes()) {
            const graphPoint = this.graph.node(node);
            const distance = point.distanceTo(graphPoint);

            if (distance < minDistance) {
                minDistance = distance;
                closestNode = graphPoint;
            }
        }

        return closestNode;
    }

    public snapPointsToRoadPoints(gpx: TrackSegment) {
        const snappedPoints = gpx.points.map(point => {
            const closestNode = this.findClosestGraphNode(point);
            return closestNode || point;
        });

        return new TrackSegment(snappedPoints);
    }

    public pathfindBetweenPoints(gpx: TrackSegment) {
        const path: TrackPoint[] = [];

        for (let i = 0; i < gpx.points.length - 1; i++) {
            const fromPoint = gpx.points[i];
            const toPoint = gpx.points[i + 1];

            path.push(fromPoint);

            if (toPoint) {
                let nextPoint = this.nextTraversablePoint(fromPoint, toPoint);

                while (nextPoint !== toPoint && nextPoint) {
                    if (nextPoint) {
                        path.push(nextPoint);
                    }

                    nextPoint = this.nextTraversablePoint(nextPoint, toPoint);
                }

                path.push(toPoint);
            }

        }

        return new TrackSegment(path);
    }

    // Snaps given track to the available roads in the RoadMap
    public snapToRoads(gpx: TrackSegment) {
        // New list to store snapped points
        let snappedPoints: TrackPoint[] = [gpx.points[0]]; // Start with the first point

        for (let i = 1; i < gpx.points.length; i++) {
            const fromPoint = snappedPoints[snappedPoints.length - 1]; // Start from the last snapped point
            const toPoint = gpx.points[i];

            // Use the graph to find the next point on the path from 'fromPoint' to 'toPoint'
            const nextPoint = this.nextTraversablePoint(fromPoint, toPoint);



            while (nextPoint && nextPoint.distanceTo(toPoint) > 0.01) {
                // Adjust point location to the next point along the path
                toPoint.lat = nextPoint.lat;
                toPoint.lon = nextPoint.lon;

                // Calculate speed and time if needed
                if (fromPoint.time && toPoint.time) {
                    const speed = this.calculateSpeed(fromPoint, nextPoint);
                    if (speed !== undefined) {
                        const distance = fromPoint.distanceTo(nextPoint);
                        const newTimeDiff = distance / speed;
                        toPoint.time = new Date(fromPoint.time.getTime() + newTimeDiff * 3600000);
                    }
                }
                snappedPoints.push(toPoint); // Add the newly adjusted point
            }
        }

        return new TrackSegment(snappedPoints);
    }

    public traverseTo(point: TrackPoint) {
        const start = this.pointId(point);
        const distances = GraphLib.alg.dijkstra(this.graph, start, (e) => this.graph.edge(e)); // Take into consideration weight

        return distances;
    }

    getPaths(from: TrackPoint) {
        return GraphLib.alg.dijkstra(this.graph, this.pointId(from), (e) => this.graph.edge(e));
    }

    getPath(paths: { [node: string]: GraphLib.Path }, to: TrackPoint): string[] {
        let currentNode = this.pointId(to);

        const path = [];
        while (currentNode) {
            path.unshift(currentNode);
            currentNode = paths[currentNode].predecessor;
        }

        return path;
    }

    pointOnSegment(point: TrackPoint, start: TrackPoint, end: TrackPoint): boolean {
        // Calculate the distances between the point and the segment endpoints
        const d1 = point.distanceTo(start);
        const d2 = point.distanceTo(end);
        const lineLen = this.graph.edge(this.pointId(start), this.pointId(end));

        // Check if the sum of the distances d1 and d2 is approximately equal to the line length
        const buffer = 0.0001; // Small buffer to account for floating-point imprecision
        return Math.abs((d1 + d2) - lineLen) < buffer;
    }

    findEdgeByPoint(point: TrackPoint): TrackPoint[] | undefined {
        // Iterate over all edges in the graph
        const edges = this.graph.edges();

        for (const edge of edges) {
            const v: TrackPoint = this.graph.node(edge.v);
            const w: TrackPoint = this.graph.node(edge.w);

            if (this.pointOnSegment(point, v, w)) {
                return [v, w];
            }
        }

        return undefined;
    }

    public nextTraversablePoint(from: TrackPoint, to: TrackPoint): TrackPoint | undefined {
        const paths = this.getPaths(from);

        // TODO: The "to" point is not an actual node - it's an interpolated one
        const fullPath = this.getPath(paths, to);

        const currentIndex = fullPath.indexOf(this.pointId(from));

        if (currentIndex >= 0 && currentIndex + 1 < fullPath.length) {
            return this.graph.node(fullPath[currentIndex + 1]);
        }

        return undefined; // No next node (either at end of path or path does not exist)
    }

    closestPointToRoad(point: TrackPoint) {
        let minDistance = Infinity;
        let closestPoint: TrackPoint | undefined;

        for (const road of this.roads) {
            for (let i = 0; i < road.points.length - 1; i++) {
                const pointA = road.points[i];
                const pointB = road.points[i + 1];
                const closest = point.closestPointOnSegment(pointA, pointB);
                const distance = point.distanceTo(closest);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = closest;
                }
            }
        }


        return closestPoint;
    }
}
import { TrackPoint } from "./TrackPoint";
import { TrackSegment } from "./TrackSegment";
import GraphLib from 'graphlib';

export class RoadMap {
    private graph = new GraphLib.Graph({ directed: false });
    private maxDistance = 0.1;

    constructor(public roads: TrackSegment[]) {
        this.buildGraph();
    }

    private pointId(point: TrackPoint): string {
        return `${point.lat},${point.lon}`;
    }

    private buildGraph(): void {
        this.roads.forEach(road => {
            road.points.forEach((point, i, points) => {
                if (i < points.length - 1) {
                    this.graph.setNode(this.pointId(point), point);
                    this.addEdge(point, points[i + 1]);
                }
            });

            // Add the last node to the graph
            this.graph.setNode(this.pointId(road.points[road.points.length - 1]), road.points[road.points.length - 1]);
        });
    }

    private addEdge(pointA: TrackPoint, pointB: TrackPoint): void {
        const distance = pointA.distanceTo(pointB);
        if (distance > this.maxDistance) {
            const numExtraPoints = Math.floor(distance / this.maxDistance);
            let lastPoint = pointA;

            Array.from({ length: numExtraPoints }, (_, j) => {
                const t = (j + 1) / (numExtraPoints + 1);
                const interpolatedPoint = new TrackPoint(
                    pointA.lat + (pointB.lat - pointA.lat) * t,
                    pointA.lon + (pointB.lon - pointA.lon) * t
                );

                this.graph.setNode(this.pointId(interpolatedPoint), interpolatedPoint);
                this.graph.setEdge(this.pointId(lastPoint), this.pointId(interpolatedPoint), lastPoint.distanceTo(interpolatedPoint));
                lastPoint = interpolatedPoint;
            });

            this.graph.setEdge(this.pointId(lastPoint), this.pointId(pointB), lastPoint.distanceTo(pointB));
        } else {
            this.graph.setEdge(this.pointId(pointA), this.pointId(pointB), distance);
        }
    }

    public pathfindBetweenPoints(gpx: TrackSegment): TrackSegment {
        const fullPath: TrackPoint[] = [];

        for (let i = 0; i < gpx.points.length - 1; i++) {
            const startPoint = gpx.points[i];
            const endPoint = gpx.points[i + 1];

            fullPath.push(startPoint);

            const startId = this.pointId(startPoint);
            const paths = GraphLib.alg.dijkstra(this.graph, startId, (e) => this.graph.edge(e));

            let currentId = paths[this.pointId(endPoint)].predecessor;

            const currentPath = [];
            while (currentId && currentId !== startId) {
                const currentNode = this.graph.node(currentId);
                if (currentNode) {
                    currentPath.push(currentNode as TrackPoint);
                }
                currentId = paths[currentId].predecessor;
            }

            fullPath.push(...currentPath.reverse());
            fullPath.push(endPoint);
        }

        return new TrackSegment(fullPath);
    }

    public snapPointsToRoad(gpx: TrackSegment): TrackSegment {
        return new TrackSegment(gpx.points.map(point => this.closestPointToRoad(point) || point));
    }

    private closestPointToRoad(point: TrackPoint): TrackPoint | undefined {
        return this.graph.nodes().reduce<{ point: TrackPoint, distance: number } | undefined>((closestPoint, node) => {
            const graphPoint: TrackPoint = this.graph.node(node);
            const distance = point.distanceTo(graphPoint);
            if (!closestPoint || distance < closestPoint.distance) {
                return { point: graphPoint, distance };
            }
            return closestPoint;
        }, undefined)?.point;
    }

    public traverseTo(point: TrackPoint) {
        const start = this.pointId(point);
        return GraphLib.alg.dijkstra(this.graph, start, (e) => this.graph.edge(e));
    }

    public getPath(paths: { [node: string]: GraphLib.Path }, to: TrackPoint): string[] {
        let currentNode = this.pointId(to);
        const path = [];

        while (currentNode) {
            path.unshift(currentNode);
            currentNode = paths[currentNode]?.predecessor;
        }

        return path;
    }
}

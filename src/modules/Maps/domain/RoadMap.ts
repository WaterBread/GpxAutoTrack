import { TrackPoint } from "./TrackPoint";
import { TrackSegment } from "./TrackSegment";

import GraphLib, { Edge } from 'graphlib';

export class RoadMap {
    private graph = new GraphLib.Graph({ directed: false });

    // Adjacency list of TrackPoints representing all the connections
    constructor(public points: Map<TrackPoint, TrackPoint[]>) {
        this.buildGraph();
    }

    private pointId(point: TrackPoint): string {
        return `${point.lat},${point.lon}`;
    }

    private buildGraph(): void {
        this.points.forEach((connections, point) => {
            this.graph.setNode(this.pointId(point), point);

            connections.forEach(connection => {
                this.addEdge(point, connection);
            });
        });
    }

    private addEdge(pointA: TrackPoint, pointB: TrackPoint): void {
        this.graph.setEdge(this.pointId(pointA), this.pointId(pointB),
            { distance: pointA.distanceTo(pointB) });
    }

    public pathfindBetweenPoints(gpx: TrackSegment): TrackSegment {
        const fullPath: TrackPoint[] = [];

        for (let i = 0; i < gpx.points.length - 1; i++) {
            const startPoint = gpx.points[i];
            const endPoint = gpx.points[i + 1];

            fullPath.push(startPoint);

            const startId = this.pointId(startPoint);
            const endId = this.pointId(endPoint);

            const paths = GraphLib.alg.dijkstra(this.graph, startId, (e) => {
                return this.graph.edge(e).distance;
            }, (edge) => {
                return this.graph.nodeEdges(edge) as Edge[]
            });

            console.log(`Pathfinding between ${startId} and ${endId}`)

            if (paths[endId].distance === Infinity) {
                // If there is no direct path, find the nearest reachable node to endPoint

                console.log('No direct path found, trying to find the closest reachable node', endPoint)
                const closestReachable = this.findClosestReachableNode(paths, endPoint);
                if (closestReachable) {
                    const interpretedSegment = this.tracePath(paths, closestReachable);

                    if (startPoint.time && endPoint.time) {
                        console.log('Correcting time for the segment')
                        const correctedSegment = this.correctTime(interpretedSegment, startPoint.time, endPoint.time);
                        fullPath.push(...correctedSegment);
                    } else {
                        fullPath.push(...interpretedSegment);
                    }
                }
            } else {
                // If there is a path, trace it back from the endpoint
                const interpretedSegment = this.tracePath(paths, endId);

                if (startPoint.time && endPoint.time) {
                    console.log('Correcting time for the segment')

                    const correctedSegment = this.correctTime(interpretedSegment, startPoint.time, endPoint.time);
                    fullPath.push(...correctedSegment);
                } else {
                    fullPath.push(...interpretedSegment);
                }
            }
        }

        return new TrackSegment(fullPath);
    }

    private correctTime(segment: TrackPoint[], startTime: Date, endTime: Date): TrackPoint[] {
        const timeDiff = endTime.getTime() - startTime.getTime();
        const timeStep = timeDiff / segment.length;

        let currentTime = startTime.getTime();

        return segment.map(point => {
            const newPoint = new TrackPoint(point.lat, point.lon, point.ele, new Date(currentTime));
            currentTime += timeStep;
            return newPoint;
        });
    }

    private findClosestReachableNode(paths: { [node: string]: GraphLib.Path }, targetPoint: TrackPoint): string | null {
        let minDistance = Infinity;
        let closestNode = null;

        for (const node in paths) {
            if (paths[node].distance !== Infinity) {
                const nodePoint: TrackPoint = this.graph.node(node);

                if (!nodePoint) {
                    continue;
                }

                const distance = this.calculateDistance(nodePoint, targetPoint);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestNode = node;
                }
            }
        }

        return closestNode;
    }

    private calculateDistance(p1: TrackPoint, p2: TrackPoint): number {
        return p1.distanceTo(p2);
    }

    private tracePath(paths: { [node: string]: GraphLib.Path }, nodeId: string) {
        const currentPath: TrackPoint[] = [];

        let currentId = nodeId;
        while (currentId) {
            const currentPoint: TrackPoint = this.graph.node(currentId);

            if (!currentPoint) {
                break;
            }

            currentPath.push(currentPoint);
            currentId = paths[currentId].predecessor;
        }

        // Reverse the path to correct the order from start to end
        currentPath.reverse();

        // Append the current path to the fullPath
        return currentPath;
    }

    public snapPointsToRoad(gpx: TrackSegment): TrackSegment {
        return new TrackSegment(gpx.points.map(point => this.closestPointToRoad(point) || point));
    }

    private closestPointToRoad(point: TrackPoint): TrackPoint | undefined {
        const nodes = this.graph.nodes();

        let minDistance = Infinity;

        let closestPoint: TrackPoint | undefined = undefined;

        for (const nodeId of nodes) {
            const node = this.graph.node(nodeId);

            if (node) {
                const distance = point.distanceTo(node);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = node;
                }
            }
        }

        point.lat = closestPoint ? closestPoint.lat : point.lat;
        point.lon = closestPoint ? closestPoint.lon : point.lon;

        return point;
    }
}

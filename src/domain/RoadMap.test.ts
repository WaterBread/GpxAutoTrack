import { RoadMap } from "./RoadMap";
import { TrackPoint } from "./TrackPoint";
import { TrackSegment } from "./TrackSegment";

describe('RoadMap', () => {
    it('should build a graph from a list of roads', () => {
        const roadMap = new RoadMap([
            new TrackSegment([
                new TrackPoint(50.74723, 7.16682),
                new TrackPoint(50.74718, 7.16776),
                new TrackPoint(50.74709, 7.16977)
            ]),
            new TrackSegment([
                new TrackPoint(50.74723, 7.16682),
                new TrackPoint(50.74718, 7.16776),
                new TrackPoint(50.74709, 7.16977)
            ])
        ]);

        expect(roadMap).toBeDefined();
    });

    it('should be able to traverse to a point on the map', () => {
        const start = new TrackPoint(50.74723, 7.16682);
        const nextNode = new TrackPoint(50.74718, 7.16776);
        const nextNextNode = new TrackPoint(50.74709, 7.16977);
        const end = new TrackPoint(50.74709, 7.16977);

        const roadMap = new RoadMap([
            new TrackSegment([
                start,
                nextNode,
                nextNextNode,
                end
            ]),
        ]);

        const expectedNext = roadMap.nextTraversablePoint(start, end);
        expect(expectedNext).toBe(nextNode);

        const expectedNextNext = roadMap.nextTraversablePoint(nextNode, end);
        expect(expectedNextNext).toBe(nextNextNode);
    });
});

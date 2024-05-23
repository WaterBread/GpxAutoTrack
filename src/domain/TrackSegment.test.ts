import { TrackPoint } from "./TrackPoint";
import { TrackSegment } from "./TrackSegment";

describe("TrackSegment", () => {
    describe("mapTrackSegmentToTrackSegment", () => {
        it("should map the track segment to another track segment", () => {
            const trackSegment = new TrackSegment([
                new TrackPoint(0, 0),
                new TrackPoint(1, 1),
                new TrackPoint(2, 2),
            ]);

            const mappingSegment = new TrackSegment([
                new TrackPoint(0, 0),
                new TrackPoint(0.5, 0.5),
                new TrackPoint(1, 1),
                new TrackPoint(1.5, 1.5),
                new TrackPoint(2, 2),
            ]);

            const mappedSegment = trackSegment.mapTrackSegmentToTrackSegment(mappingSegment);

            expect(mappedSegment.points).toEqual([
                new TrackPoint(0, 0),
                new TrackPoint(1, 1),
                new TrackPoint(2, 2),
            ]);
        });

        it("should map the track segment to another track segment that doesn't fall on the track", () => {
            const trackSegment = new TrackSegment([
                new TrackPoint(0, 0),
                new TrackPoint(1.2, 1.0),
                new TrackPoint(1.4, 1.4),
            ]);

            const mappingSegment = new TrackSegment([
                new TrackPoint(0, 0),
                new TrackPoint(0.5, 0.5),
                new TrackPoint(1, 1),
                new TrackPoint(1.5, 1.5),
                new TrackPoint(2, 2),
            ]);

            const mappedSegment = trackSegment.mapTrackSegmentToTrackSegment(mappingSegment);

            expect(mappedSegment.points).toEqual([
                new TrackPoint(0, 0),
                new TrackPoint(1, 1),
                new TrackPoint(1.5, 1.5),
            ]);
        });
    });
});
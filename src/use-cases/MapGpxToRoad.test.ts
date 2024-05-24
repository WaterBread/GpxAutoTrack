import { TrackPoint } from '../domain/TrackPoint';
import { TrackSegment } from '../domain/TrackSegment';
import { RoadRepo } from '../domain/ports/RoadRepo';
import { MapGpxToRoad } from './MapGpxToRoad';

const MockRoadMap = jest.fn().mockImplementation(() => {
    return {
        pathfindBetweenPoints: jest.fn()
            .mockResolvedValue(new TrackSegment([
                new TrackPoint(50.74723, 7.16682),
                new TrackPoint(50.74718, 7.16776),
                new TrackPoint(50.74718, 7.16776),
            ])),
        snapPointsToRoad: jest.fn()
    }
});

const InMemoryRoadData: RoadRepo = {
    getRoads: jest.fn().mockResolvedValue(new MockRoadMap())
}

describe('MapGpxToRoad', () => {
    it('should map the gpx to the road', async () => {
        const segment: TrackSegment = new TrackSegment([
            new TrackPoint(50.74723, 7.16683),
            new TrackPoint(50.74718, 7.16775),
            new TrackPoint(50.74709, 7.16978)
        ]);

        const mapGpxToRoad = new MapGpxToRoad(InMemoryRoadData);

        const result = await mapGpxToRoad.execute(segment);

        expect(InMemoryRoadData.getRoads).toHaveBeenCalledWith([50.74723, 7.16683], [50.74709, 7.16978]);

        expect(result.points).toMatchInlineSnapshot(`
[
  TrackPoint {
    "ele": undefined,
    "lat": 50.74723,
    "lon": 7.16682,
    "time": undefined,
  },
  TrackPoint {
    "ele": undefined,
    "lat": 50.74718,
    "lon": 7.16776,
    "time": undefined,
  },
  TrackPoint {
    "ele": undefined,
    "lat": 50.74718,
    "lon": 7.16776,
    "time": undefined,
  },
]
`)
    });
});
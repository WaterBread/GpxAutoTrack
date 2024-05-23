import { TrackPoint } from '../domain/TrackPoint';
import { TrackSegment } from '../domain/TrackSegment';
import { MapGpxToRoad } from './MapGpxToRoad';

import { OverpassRoadData } from '../adapters/OverpassRoadMapAdapter';

describe('MapGpxToRoad', () => {
    it('should map the gpx to the road', async () => {
        const segment: TrackSegment = new TrackSegment([
            new TrackPoint(50.74723, 7.16682),
            new TrackPoint(50.74718, 7.16776),
            new TrackPoint(50.74709, 7.16977)
        ]);

        const roadData = new OverpassRoadData()

        const mapGpxToRoad = new MapGpxToRoad(roadData);

        const result = await mapGpxToRoad.execute(segment);

        expect(result).toBeDefined();
    });
});
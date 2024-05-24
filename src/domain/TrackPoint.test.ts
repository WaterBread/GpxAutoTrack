import { TrackPoint } from "./TrackPoint";
describe('TrackPoint', () => {
    it('should calculate the distance between two points', () => {
        const pointA = new TrackPoint(50.74723, 7.16682);
        const pointB = new TrackPoint(50.74718, 7.16776);

        const distance = pointA.distanceTo(pointB); // Roughly 0.07 km

        expect(distance).toBeLessThan(0.07)
    });
});
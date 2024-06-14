import { TrackSegment } from "../TrackSegment";

export interface GPXFile {
    gpx: {
        trk: {
            trkseg: {
                trkpt: {
                    $: {
                        lat: string;
                        lon: string;
                    }
                    ele?: string;
                    time?: string;
                }[];
            }[];
        }[];
    };
}

export interface GpxRepo {
    readGpx(): Promise<TrackSegment[]> | TrackSegment[];
    writeGpx(gpx: TrackSegment[]): Promise<void> | void;
}
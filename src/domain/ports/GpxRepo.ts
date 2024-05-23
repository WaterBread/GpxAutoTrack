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
    readGpxFile(): Promise<TrackSegment[]> | TrackSegment[];
    writeGpxFile(gpx: TrackSegment[]): Promise<void> | void;
}
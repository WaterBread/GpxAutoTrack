import xmlbuilder from "xmlbuilder";
import { TrackPoint } from "../domain/TrackPoint";
import { TrackSegment } from "../domain/TrackSegment";
import { GPXFile, GpxRepo } from "../domain/ports/GpxRepo";

import fs from 'fs';
import xml2js from 'xml2js';

export class FilesystemGpxAdapter implements GpxRepo {
    constructor(
        private inputFilepath: string,
        private outputFilepath: string
    ) {
        if (!fs.existsSync(inputFilepath)) {
            throw new Error(`Input file not found: ${inputFilepath}`);
        }
    }

    private parseTrackSegments(gpxData: GPXFile) {
        const segments: Array<TrackSegment> = [];
        const tracks = gpxData.gpx.trk;
        for (const track of tracks) {
            for (const segment of track.trkseg) {
                const points = segment.trkpt.map(pt => new TrackPoint(parseFloat(pt.$.lat), parseFloat(pt.$.lon), pt.ele ? parseFloat(pt.ele) : undefined, pt.time ? new Date(pt.time) : undefined));
                segments.push(new TrackSegment(points));
            }
        }

        return segments;
    }

    public async readGpxFile(): Promise<TrackSegment[]> {
        return new Promise((resolve, reject) => {
            fs.readFile(this.inputFilepath, (err, data) => {
                if (err) {
                    console.error("Error reading file:", err);
                    reject(err);
                }

                xml2js.parseString(data, (err, result) => {
                    if (err) {
                        console.error("Error parsing XML:", err);
                        reject(err);
                    }

                    const trackSegments = this.parseTrackSegments(result);
                    resolve(trackSegments);
                });
            });
        });
    }

    async writeGpxFile(gpx: TrackSegment[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const root = xmlbuilder.create('gpx', { version: '1.0', encoding: 'UTF-8' })
                .att('version', '1.1')

            const trk = root.ele('trk');

            for (const segment of gpx) {
                const trkseg = trk.ele('trkseg');

                for (const point of segment.points) {
                    const seg = trkseg.ele('trkpt', {
                        lat: point.lat.toFixed(6),
                        lon: point.lon.toFixed(6),
                    });

                    if (point.ele) {
                        seg.ele('ele', {}, point.ele);
                    }

                    if (point.time) {
                        seg.ele('time', {}, point.time.toISOString());
                    }
                }
            }

            const xmlString = root.end({ pretty: true });

            fs.writeFile(this.outputFilepath, xmlString, (err) => {
                if (err) {
                    console.error("Error writing to file:", err);
                    reject(err);
                }
                console.log("GPX file has been created successfully.");
                resolve();
            });
        });

    }
}
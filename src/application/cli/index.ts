import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { MapGpxToRoad } from '../../use-cases/MapGpxToRoad'
import { OverpassRoadData } from '../../adapters/OverpassRoadMapAdapter';
import { InterpolateGpx } from '../../use-cases/InterpolateGpx';
import { FilesystemGpxAdapter } from '../../adapters/FilesystemGpxAdapter';
import { ReadGpx } from '../../use-cases/ReadGpx';
import { WriteGpx } from '../../use-cases/WriteGpx';

const argv = yargs(hideBin(process.argv))
    .option('input', {
        alias: 'i',
        describe: 'Input file path',
        type: 'string',
        demandOption: true,
        nargs: 1
    })
    .option('output', {
        alias: 'o',
        describe: 'Output file path',
        type: 'string',
        demandOption: true,
        nargs: 1
    })
    .option('interpolate', {
        alias: 'p',
        describe: 'Number of points to insert between snapped points',
        type: 'number',
        default: 0,
        nargs: 1
    })
    .help()
    .alias('help', 'h')
    .argv;

async function main() {
    const args = await argv

    const gpxAdapter = new FilesystemGpxAdapter(args.input, args.output)

    const readGpx = new ReadGpx(gpxAdapter);
    const writeGpx = new WriteGpx(gpxAdapter);

    const segments = await readGpx.execute()

    const interpolate = new InterpolateGpx()
    const interpolated = await Promise.all(segments.map(segment => {
        return interpolate.execute(segment, args.interpolate)
    }));

    const roadData = new OverpassRoadData()
    const map = new MapGpxToRoad(roadData)

    console.log("Interpolated segments: ", interpolated)

    const mapped = await Promise.all(interpolated.map(segment => {
        return map.execute(segment)
    }));

    await writeGpx.execute(mapped)
}

main();
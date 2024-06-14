import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { FilesystemGpxAdapter } from '../../modules/Maps/adapters/FilesystemGpxAdapter';
import { OverpassRoadData } from '../../modules/Maps/adapters/OverpassRoadMapAdapter';
import { ProcessGpx } from '../../modules/Maps/application/ProcessGpx';

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

    // Adapters
    const roadData = new OverpassRoadData()
    const gpxAdapter = new FilesystemGpxAdapter(args.input, args.output)

    const processGpx = new ProcessGpx(roadData, gpxAdapter);

    await processGpx.execute({
        numberOfInterpolationPoints: args.interpolate
    })
}

main();
import {getMetadata, toPng} from "./loader/imageprocessing";
import {Command} from "commander";
import {GenerateObjOptions, ObjGenerator} from "./loader/objgenerator";
import {renderJSONAsText} from "./loader/jsonutils";

// toPng("inputs/orthomosaic_front.tif", "outputs/texture.jpg", 0.1).then((result)=>{
//    console.log("Result", result);
//
//     produceFeatureCollection("./inputs/ecken.csv").then(collection=>{
//         decodeFeatureCollection(collection);
//     });
// })

const program = new Command();

program
    .name('ortho2obj')
    .description('CLI to convert an Orthophoto to an Wavefront obj')
    .version('1.0.0');

program.command('image-info')
    .description('Provides info about the image file')
    .argument('<imagefile>', 'The orthophoto to be used as texture, supported formats: tiff, png, jpeg')
    .action((imagefile, options) => {
        console.log("imagefile: ", imagefile)
        getMetadata(imagefile).then(metadata=> {
            console.log(renderJSONAsText(metadata))
        })
    });
program.command('generate')
    .description('Takes a csv file and an image and generates a Wavefront OBJ file, the obj has a cuboid with the image used as texture on the main')
    .argument('<csvfile>', 'The CSV file containing the geographical coordinates of the orthophoto')
    .argument('<imagefile>', 'The orthophoto to be used as texture, supported formats: tiff, png, jpeg')
    .option('-o, --output <outputdir>', 'output directory', 'outputs')
    .option('-p, --projection [projection]', 'Target EPSG projection, default is: ', "EPSG:25832")
    .option('-f, --format [imageformat]', 'Image format for the output texture png, jpg: ', "jpg")
    .option('-s, --scale <scale>', 'Scale the texture reduce size, use 0 < texture <= 1', '1')
    .option('-m, --maxwidth <maxwidth>', 'maxwidth in pixels', '1000000')
    .option('-e, --export [feturecollection]', 'Export vertices to a FeatureCollection file, default name: FeatureCollection.geojson', null)
    .action((csvfile, imagefile, options) => {
        getMetadata(imagefile).then(metadata=> {
            const fullOptions:GenerateObjOptions = {
                csvFile: csvfile,
                imagefile: imagefile,
                scale: Number(options.scale),
                maxwidth: Number(options.maxwidth),
                output: options.output,
                export: options.export,
                projection: options.projection,
                format: options.format
            }
            const objGenerator = new ObjGenerator(fullOptions, metadata);
            if (!objGenerator.validOptions()) return;
            objGenerator.generateObj();
        })
    });

program.parse();



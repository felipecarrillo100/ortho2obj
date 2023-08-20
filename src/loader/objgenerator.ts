import sharp from "sharp";
import {loadLocationFromCSVFile} from "./csvloader";
import {createFolder, saveTextFile} from "./fileutils";
import {saveJSON} from "./jsonutils";
import {reprojectPolygonFeature, shiftPolygonFeatureBackInMeters} from "./geoutils";
import {createMtlObJContent, createObJContent, getVertices, Wall} from "./generatevertices";
import {downloadEPSGToPrj} from "./ogcwktutils";
import {splitSharpImage} from "./imageprocessing";

const wallWidth = 0.5;
const textureBaseName =  "texture";
const limitInputPixels  = 200000 * 10000;

export interface GenerateObjOptions {
    csvFile: string;
    imagefile: string;
    output: string;
    scale: number;
    maxwidth: number;
    export: string;
    projection: string;
    format: string;
}


export class ObjGenerator {
    private options: GenerateObjOptions;
    private texture = "texture.png";
    private name: string = "wall"
    private wallCounter = 0;
    private walls: Wall[] = [];
    private metadata: any;

    constructor(options: GenerateObjOptions, metadata: any) {
        this.options = options;
        this.texture = `${textureBaseName}.${this.options.format}`;
        this.metadata = metadata;
        console.log(this.options);
    }

    public generateObj() {
        const folderExists = createFolder(this.options.output);
        if (folderExists) {
            this.produceFeatureCollection(this.options.csvFile).then(collection=>{
                if (this.options.export) {
                    const exportName =  typeof this.options.export === "string" ? this.options.export : "FeatureCollection.geojson"
                    saveJSON(collection, `${this.options.output}/${exportName}`);
                }
                this.generateObjFile(collection);
            });
        } else {
            console.log("Failed to create output directory: " + this.options.output)
        }
    }

    private produceFeatureCollection(filename: string) {
        return new Promise((resolve, reject)=>{
            loadLocationFromCSVFile(filename).then(rows=>{
                const featureCollection = {
                    "type": "FeatureCollection",
                    "features": [] as any[]
                }
                const feature = {
                    "type": "Feature",
                    "properties": {
                        "texture": this.texture
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[]] as any[][]
                    }
                }
                featureCollection.features.push(feature);

                for (const row of rows) {
                    const coordinate = [Number(row.wgs84_lon), Number(row.wgs84_lat),Number(row.wgs84_elev)];
                    feature.geometry.coordinates[0].push(coordinate);
                }
                const result = this.splitFeatureCollectionWhenNeeded(featureCollection)
                resolve(result);
            }, ()=> {
                reject();
            })
        })
    }

    private generateObjFile(featureCollection: any) {
        const features = featureCollection.features;

        for (let i=0; i<features.length; ++i) {
            const feature = features[i];
            const frontFeatureReprojected = reprojectPolygonFeature(feature, this.options.projection);
            // console.log("CRS:84 :", JSON.stringify(feature));
            // console.log(`${this.options.projection}:`, JSON.stringify(targetFeature1));
            //  saveJSON(frontFeatureReprojected, "polygon25832.geojson")

            const featureShiftedBack= shiftPolygonFeatureBackInMeters(feature, wallWidth);
            const backFeatureReprojected = reprojectPolygonFeature(featureShiftedBack, this.options.projection);
            this.addOneWall(frontFeatureReprojected, backFeatureReprojected, `${textureBaseName}_${i}.${this.options.format}`);
        }
        this.saveAllWalls();
    }

    private addOneWall(frontFeature: any, backFeature: any, texture) {
        const wall: Wall = {
            frontVertices: getVertices(frontFeature),
            backVertices: getVertices(backFeature),
            texture: texture,
            index: this.wallCounter++
        }
        this.walls.push(wall);
    }

    private async saveAllWalls() {
        const objFilename = `${this.name}.obj`;
        const mtlFilename = `${this.name}.mtl`;
        const prjFilename = `${this.name}.prj`;

        console.log(`Generating obj file: ${objFilename}`)
        const content = createObJContent(this.walls, mtlFilename);
        saveTextFile(content, `${this.options.output}/${objFilename}`);

        console.log(`Generating mtl file: ${mtlFilename}`)
        const mtlContent = createMtlObJContent(this.walls, mtlFilename);
        saveTextFile(mtlContent, `${this.options.output}/${mtlFilename}`);

        console.log(`Downloading projection ${this.options.projection} to: ${prjFilename}`)
        downloadEPSGToPrj(this.options.projection, `${this.options.output}/${prjFilename}`)

        this.createAllTextures();
    }

    private async createAllTextures() {
        const estimatedWidth = Math.ceil(this.metadata.width * this.options.scale);
        console.log("Generating textures:");

        if (this.walls.length===1) {
            const filename = `${this.options.output}/${this.walls[0].texture}`;
            console.log(` - Saving texture: ${filename}`);
            await sharp(this.options.imagefile, {limitInputPixels}).resize({width: estimatedWidth}).toFile(filename);
        } else {
            const pieces = this.walls.length;
            const maxWidth = this.options.maxwidth;
            const newSharpImage = await sharp(this.options.imagefile, {limitInputPixels}).resize({width: estimatedWidth});
            const metadata = await newSharpImage.metadata();

            for (let i=0; i<pieces; ++i) {
                const width = metadata.width;
                const wall = this.walls[i];
                const filename = `${this.options.output}/${wall.texture}`;

                const tileWidth = (i===pieces-1) ? width - i*maxWidth : maxWidth;
                const values = {
                    tile: i,
                    left: i*maxWidth,
                    top: 0,
                    width: tileWidth,
                    height: metadata.height
                }
                await splitSharpImage(newSharpImage, values, `${this.options.output}/${filename}`);
            }
        }
        console.log("All textures completed");
    }

    private splitFeatureCollectionWhenNeeded(featureCollection: { features: any[]; type: string }) {
        return featureCollection;
    }

    validOptions() {
        const valid = true;
        if (!(0<this.options.scale && this.options.scale<=1)) {
            console.log("Option scale out of range, must be between 0 < scale <= 1, got: " + this.options.scale);
            return false;
        }
        if (!(this.options.projection.toLowerCase().startsWith("epsg:") || this.options.projection.toLowerCase()==="crs:84")) {
            console.log("Option projection must use EPSG:<code>, got: " + this.options.projection);
            return false;
        }
        return valid;
    }
}


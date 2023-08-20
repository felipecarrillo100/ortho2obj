import sharp from "sharp";

const limitInputPixels  = 200000 * 10000;

async function getMetadata(image:string) {
    const metadata = await sharp(image, {limitInputPixels}).metadata();
    return metadata;
}

async function toPng(image:string, imageOut:string, aScale?: number) {
    const scale = aScale ? aScale : 1;
    const metadata = await getMetadata(image);
    const width = Math.ceil(metadata.width * scale);
    const result = await sharp(image, {limitInputPixels}).resize({ width: width }).toFile(imageOut);

    return result;
}

async function splitImage(image:string, bounds:string, newImage: string) {
    const metadata = await sharp(image, {limitInputPixels}).extract(bounds).toFile(newImage);
    console.log(metadata);
}

export {
    getMetadata,
    toPng,
    splitImage
}

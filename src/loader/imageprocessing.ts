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

async function cropImage(image:string, bounds:any, newImage: string) {
    const info = await sharp(image, {limitInputPixels}).extract(bounds).toFile(newImage);
    return info;
}


async function cropSharpImage(image:sharp.Sharp, bounds:any, newImage: string) {
    const info = await image.extract(bounds).toFile(newImage);
    return info;
}

export {
    getMetadata,
    toPng,
    cropImage,
    cropSharpImage
}

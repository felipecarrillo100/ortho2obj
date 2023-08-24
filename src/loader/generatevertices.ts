import fs from "fs";

const version = "1.0.0";
const author = "Felipe Carrillo";
const shapeName = "Cuboid";
const defaultTexture = "Base";
const orthoTexture = "Orthophoto";

export interface Wall {
    frontVertices: number[][];
    backVertices: number[][];
    texture: string;
    index: number;
}


export function getVertices(feature: any) {
    const verrtices =  [...feature.geometry.coordinates[0]];
    verrtices.pop();
    return verrtices;
}

function createObJHeader(mtlfile: string, shapeName: string) {
    const content =
        `# ortho2obj v${version} OBJ File: \n` +
        `# by ${author} \n` +
        `mtllib ${mtlfile} \n` +
        `o ${shapeName} \n`;
    return content;
}

function getVTs() {
    const vts = [
        [0.000000, 1.000000],
        [ 0.000000, 0.000000],
        [ 1.000000, 0.000000],
        [1.000000, 1.000000],
        ]
    return vts;
}

function createVertices(walls: Wall[]) {
    let content = ""
    for (let i =0 ; i<walls.length; ++i) {
        const wall = walls[i]
        if (i===0) {
            for (const vertice  of wall.frontVertices) {
                const [x,y,z] = vertice;
                content += `v ${x} ${y} ${z} \n`
            }
            for (const vertice  of [...wall.backVertices].reverse()) {
                const [x,y,z] = vertice;
                content += `v ${x} ${y} ${z} \n`
            }
        } else {
            let j = 0
            for (const vertice  of wall.frontVertices) {
                if (j===2 || j === 3) {
                    const [x,y,z] = vertice;
                    content += `v ${x} ${y} ${z} \n`
                }
                j++;
            }
            j = 0
            for (const vertice  of [...wall.backVertices].reverse()) {
                if (j===0 || j === 1) {
                    const [x,y,z] = vertice;
                    content += `v ${x} ${y} ${z} \n`
                }
                j++;
            }
        }
    }
    return content;
}

function createVts(walls: Wall[]) {
    let content = "";
    const vts = getVTs();
    for (const vt  of vts) {
        const [x,y,z] = vt;
        content += `vt ${x} ${y} \n`
    }
    return content;
}

function getWallVertices(i: number) {
    if (i==0) return [1,2,3,4,5,6,7,8];
    if (i==1) return [4,3,9,10,11,12,6,5];

    //  [10, 9, 13, 14, 15, 16, 12, 11]
    //  [14, 13, 17, 18, 19, 20, 16, 15]
    const current = (i-2) * 4 + 8;
    return [current+2, current+1, current+5, current+6, current+7, current+8, current+4, current+3];
}

function createTexturedFaces(walls: Wall[]) {
    let content = "";
    for (let i = 0; i<walls.length; ++i) {
        const textureName = `${orthoTexture}.${i}`;
        content += `usemtl ${textureName} \n`;
        const [v1,v2,v3,v4] = getWallVertices(i);
        content += `f ${v1}/1 ${v2}/2 ${v3}/3 ${v4}/4\n`;   // Front wall with texture
    }
    return content;
}

function createNonTexturedFaces(walls: Wall[]) {
    let content = "";
    content += `usemtl ${defaultTexture}\n`;
    for (let i = 0; i<walls.length; ++i) {
        const [v1,v2,v3,v4, v5, v6,v7,v8] = getWallVertices(i);

        content +=
        `f ${v5}/1 ${v6}/2 ${v7}/3 ${v8}/4\n`+  // Back wall
        (i===walls.length-1 ?`f ${v3}/1 ${v4}/2 ${v5}/3 ${v6}/4\n` : "")+  // Side wall right
        `f ${v1}/1 ${v4}/2 ${v5}/3 ${v8}/4\n`+  // Side wall top
        (i===0 ? `f ${v1}/1 ${v2}/2 ${v7}/3 ${v8}/4\n` : "")+  // Side wall left
        `f ${v2}/1 ${v3}/2 ${v6}/3 ${v7}/4\n`;  // Side wall bottom
    }
    return content;
}

export function createObJContent(walls: Wall[], mltFile: string) {
    let content = createObJHeader(mltFile, shapeName);
    content += createVertices(walls);
    content += createVts(walls);
    content += createTexturedFaces(walls);
    content += createNonTexturedFaces(walls);
    return content
}

function createMtlHeader(mtlfile: string, counter: number) {
    const content =
        `# Blender MTL File: '${mtlfile}' \n` +
        `# Material Count: ${counter} \n`;
    return content;
}

function createDefaultTexture() {
    const content = "newmtl Base \n" +
        "Ns 323.999994 \n" +
    "Ka 1.000000 1.000000 1.000000 \n" +
    "Kd 0.34117648 0.3882353 0.42352942 \n" +
    "Ks 0.500000 0.500000 0.500000 \n" +
    "Ke 0.000000 0.000000 0.000000 \n" +
    "Ni 1.450000 \n" +
    "d 1.000000 \n" +
    "illum 2 \n";
    return content;
}
function createImageTextures(walls: Wall[]) {
    let content = "";

    for (let i=0; i<walls.length; ++i) {
        const textureName = `${orthoTexture}.${i}`;
        const textureFile = walls[i].texture;
        const texture = `newmtl ${textureName}\n`+
        "Ns 225.000000\n" +
        "Ka 1.000000 1.000000 1.000000\n" +
        "Kd 0.800000 0.800000 0.800000\n" +
        "Ks 0.500000 0.500000 0.500000\n" +
        "Ke 0.000000 0.000000 0.000000\n" +
        "Ni 1.450000\n" +
        "d 1.000000\n" +
        "illum 2\n" +
        `map_Kd ${textureFile}\n`;
        content += texture;
    }
    return content;
}
export function createMtlObJContent(walls: Wall[], mtlFile: string) {
    let content = createMtlHeader(mtlFile, walls.length + 1);
    content += createDefaultTexture();
    content += createImageTextures(walls);

    return content
}

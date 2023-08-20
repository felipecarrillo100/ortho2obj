import fs from "fs";

export function createFolder(dir: string) {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, {recursive: true});
    }
    return fs.existsSync(dir);
}

export function saveTextFile(content: string, filename: string ) {
    fs.writeFileSync(filename, content);
}


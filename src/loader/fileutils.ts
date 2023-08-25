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

export function validExtension(filename, allowedFiles: string[]) {
    var regex = new RegExp("([a-zA-Z0-9\s_\\.\-:])+(" + allowedFiles.join('|') + ")$");
    if (!regex.test(filename.toLowerCase())) {
        return false;
    }
    return true;
}

export function getFileExtension(filename: string) {
    return filename.split('.').pop();

}

import fs from "fs";

export function saveJSON(featureCollection: any, filename: string ) {
    let dataGeoJson = JSON.stringify(featureCollection);
    fs.writeFileSync(filename, dataGeoJson);
}

export function renderJSONAsText(object: any)  {
    let json = JSON.stringify(object, null, 2);
    const searchRegExp = new RegExp('"', 'g')
    json = json.replace(searchRegExp, "");
    if (json[0] === '{') {
        return json.substring(2, json.length - 1);
    }
    return json;
};

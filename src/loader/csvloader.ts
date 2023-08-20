import { parse } from "csv-parse";
import * as fs from "fs";
export function loadLocationFromCSVFile(filename: string) {
    return new Promise<any[]>((resolve, reject)=> {
        const data: any[] = [];
        fs.createReadStream(filename)
            .pipe(
                parse({
                    delimiter: ",",
                    columns: true,
                    ltrim: true,
                    rtrim: true,
                })
            )
            .on("data", function (row) {
                // This will push the object row into the array
                data.push(row);
            })
            .on("error", function (error) {
                console.log(error.message);
                reject({cause: "File error"});
            })
            .on("end", function () {

                for (const row of data) {
                    for (const key in row) {
                        if (row.hasOwnProperty(key)) {
                            const newKey =  key.trim();
                            if (newKey!==key) {
                                row[newKey]  = row[key];
                                delete row[key];
                            }
                        }
                    }
                }

                const left_top = data.find(e=>e.name==="left_top");
                const left_bottom = data.find(e=>e.name==="left_bottom");
                const right_bottom = data.find(e=>e.name==="right_bottom");
                const right_top = data.find(e=>e.name==="right_top");

                if (isCorrectFormat(left_top) && isCorrectFormat(left_bottom) &&
                    isCorrectFormat( right_bottom) && isCorrectFormat(right_top) ) {
                    const sortedBounds = [left_top, left_bottom, right_bottom, right_top, left_top];
                    resolve(sortedBounds);
                } else {
                    reject({cause:"Bad format"})
                }
            });
    })
}

function isCorrectFormat(row) {
    const isDefined = (value: any) => typeof value!=="undefined";

    if (typeof row === "undefined") return false;

    const allValuesDefined =
        isDefined(row.ecef_x) &&
        isDefined(row.ecef_y) &&
        isDefined(row.ecef_z) &&
        isDefined(row.wgs84_lat) &&
        isDefined(row.wgs84_lon) &&
        isDefined(row.wgs84_elev) &&
        isDefined(row.utm25832_lat) &&
        isDefined(row.utm25832_lon) &&
        isDefined(row.utm25832_elev) &&
        isDefined(row.name);

    return allValuesDefined;
}

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

                if (typeof left_top !== "undefined" && typeof left_bottom !== "undefined" &&
                    typeof right_bottom !== "undefined" && typeof right_top !== "undefined" ) {
                    const sortedBounds = [left_top, left_bottom, right_bottom, right_top, left_top];
                    resolve(sortedBounds);
                } else {
                    reject({cause:"Bad format"})
                }
            });
    })
}

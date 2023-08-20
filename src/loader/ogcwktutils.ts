import axios from "axios";
import {saveTextFile} from "./fileutils";

export function downloadEPSGToPrj(epsgInput: string, prjFile: string) {
    let epsg = epsgInput.toLowerCase();
    if (epsg==="crs:84") epsg = "EPSG:4326".toLowerCase();
    if (epsg.startsWith("epsg:")) {
        const parts = epsg.split(":");
        if (parts.length==2) {
            const code = parts[1];
            const request = `https://spatialreference.org/ref/epsg/${code}/ogcwkt/`;
            axios.get(request).then(response=>{
                if (response.status==200) {
                    const wkt  = response.data;
                    saveTextFile(wkt, prjFile);
                } else {
                    console.log(`Failed to download .prj for ${epsgInput} from ${request}`);
                }
            }, (err)=>{
                console.log(`Failed to create .prj for ${epsgInput} from  ${request}`);
            })
        }
    } else {
        console.log(`Failed to create .prj file: Invalid name:   ${epsgInput} / ${epsg}`)
    }

}

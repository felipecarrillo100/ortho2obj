import axios from "axios";
import {saveTextFile} from "./fileutils";

export function downloadEPSGToPrj(epsgInput: string, prjFile: string) {
    const epsg = epsgInput.toLowerCase();
    if (epsg.startsWith("epsg:")) {
        const parts = epsg.split(":");
        if (parts.length==2) {
            const code = parts[1];
            const request = `https://spatialreference.org/ref/epsg/${code}/ogcwkt/`;
            axios.get(request).then(response=>{
                if (response.status==200) {
                    const wkt  = response.data;
                    saveTextFile(wkt, prjFile);
                }
            })
        }
    }

}

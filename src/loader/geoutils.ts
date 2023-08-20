import transformation from "transform-coordinates";
import turf from "turf";
import transformTranslate from "@turf/transform-translate";

export function reprojectPolygonFeature(polygonFeature, targetEPSG) {
    const newFeature = JSON.parse(JSON.stringify(polygonFeature));

    if (targetEPSG==="EPSG:4326" || targetEPSG==="CRS:84") return newFeature;
    const transform = transformation('EPSG:4326', targetEPSG);

    const coordinates = polygonFeature.geometry.coordinates[0];

    newFeature.crs = {
        "type": "name",
        "properties": {
            "name": targetEPSG
        }
    };

    const scale = 1;
    const x= 0 ;
    const y= 0;

    for (let i=0; i<coordinates.length; ++i) {
        const coordinate = coordinates[i];

        const txCoordinates = transform.forward({x: coordinate[0], y: coordinate[1], z: coordinate[2]})
        newFeature.geometry.coordinates[0][i] = [(txCoordinates.x-x)*scale, (txCoordinates.y-y)*scale, txCoordinates.z];
    }
    return newFeature;
}

export function shiftPolygonFeatureBackInMeters(feature: any, width: number) {
    if (feature.type === "Feature" && feature.geometry.type === "Polygon") {
        const coordinates = feature.geometry.coordinates;
        const bottomLeft = coordinates[0][1];
        const bottomRight = coordinates[0][2];

        const from = turf.point(bottomLeft);
        const to = turf.point(bottomRight);

        const bearing = turf.bearing(from, to);
        const polygonFeature = turf.polygon(coordinates);
        const translatedPoly = transformTranslate(polygonFeature, width,bearing-90, {units: "meters"} );
        return translatedPoly;
    }
}

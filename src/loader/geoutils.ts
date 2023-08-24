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

function interpolateHeight(bottom, top, ratio) {
    return (top - bottom) * ratio + bottom;
}

function along(line: any, distance: number, totalDistance) {
    const point = turf.along(line, distance, "meters");
    if (line.geometry.coordinates.length ===2 && line.geometry.coordinates[0].length === 3 || line.geometry.coordinates[1].length ===3) {
       const height =  interpolateHeight(line.geometry.coordinates[0][2], line.geometry.coordinates[1][2], distance / totalDistance);
       if (point.geometry.coordinates.length === 2) {
           point.geometry.coordinates.push(height);
       } else {
           point.geometry.coordinates[2] = height;
       }
       return point;
    } else {
        return point;
    }
}

function lineString(a:number[], b: number[]) {
    const line = turf.lineString([a, b]);
    return line;
}
export function splitFeatureCollectionInHorizontalPieces(featureCollection: any, pieces: number, ratio: number) {
    const newFeatureCollection = JSON.parse(JSON.stringify(featureCollection));
    const features = newFeatureCollection.features;
    newFeatureCollection.features = [];

    if (features.length !== 1 ) return null;
    if (pieces === 1 ) return newFeatureCollection;

    const feature =  features[0];
    const coordinates = feature.geometry.coordinates;

    const topLeft = coordinates[0][0];
    const topRight = coordinates[0][3];

    const bottomLeft = coordinates[0][1];
    const bottomRight = coordinates[0][2];

    const lineBottom = lineString(bottomLeft, bottomRight);
    const lineTop = lineString(topLeft, topRight);

    console.log(lineTop);


    const from = turf.point(bottomLeft);
    const to = turf.point(bottomRight);

    const totalDistance = turf.distance(from, to, "meters");

    console.log(`distance ${totalDistance}`);

    const D = totalDistance * ratio;
    console.log(`Tile distance ${D}`);

    for (let i=0; i<pieces; ++i) {
        const leftPointTop = along(lineTop, D*i, totalDistance);
        const rightPointTop = along(lineTop, (D*(i+1)), totalDistance);
        const leftPointBottom = along(lineBottom, D*i, totalDistance);
        const rightPointBottom = along(lineBottom, (D*(i+1)), totalDistance);

        const shiftedFeature = JSON.parse(JSON.stringify(feature));
        const newCoordinates =  [leftPointTop.geometry.coordinates, leftPointBottom.geometry.coordinates, rightPointBottom.geometry.coordinates, rightPointTop.geometry.coordinates, leftPointTop.geometry.coordinates];
        shiftedFeature.geometry.coordinates[0] = newCoordinates;

        newFeatureCollection.features.push(shiftedFeature);
    }

    return  newFeatureCollection;
}

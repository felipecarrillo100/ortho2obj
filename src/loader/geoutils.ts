import transformation from "transform-coordinates";
import turf from "turf";
import transformTranslate from "@turf/transform-translate";
import {saveJSON} from "./jsonutils";

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

export function splitFeatureCollectionInHorizontalPieces(featureCollection: any, pieces: number, ratio: number) {
  const newFeatureCollection = JSON.parse(JSON.stringify(featureCollection));
  const features = newFeatureCollection.features;
  newFeatureCollection.features = [];

  if (features.length !== 1 ) return null;

  const feature =  features[0];
  const coordinates = feature.geometry.coordinates;

    const topLeft = coordinates[0][0];
    const topRight = coordinates[0][3];

    const bottomLeft = coordinates[0][1];
    const bottomRight = coordinates[0][2];

    const from = turf.point(bottomLeft);
    const to = turf.point(bottomRight);

    const distance = turf.distance(from, to, "meters");
    const bearing = turf.bearing(from, to);

    console.log(`distance ${distance}`);
    console.log(`bearing ${bearing}`);

    const pointTop = turf.point(topLeft);
    const pointBottom = turf.point(bottomLeft);

    const newTopRight = turf.destination(pointTop, distance*ratio, bearing, "meters");
    const newBottomRight = turf.destination(pointBottom, distance*ratio, bearing, "meters");


    console.log(`newTopRight ${JSON.stringify(newTopRight)}`);
    console.log(`newBottomRight ${JSON.stringify(newBottomRight)}`);


    feature.geometry.coordinates[0][3] = [...newTopRight.geometry.coordinates, topRight[2]];
    feature.geometry.coordinates[0][2] = [...newBottomRight.geometry.coordinates, bottomRight[2]];


    for (let i=0; i<pieces; ++i) {
        const shiftedFeature = transformTranslate(feature, distance*ratio*i,bearing, {units: "meters"} );
        newFeatureCollection.features.push(shiftedFeature);
    }

    const lastFeature = newFeatureCollection.features[newFeatureCollection.features.length-1];

    lastFeature.geometry.coordinates[0][3] = topRight;
    lastFeature.geometry.coordinates[0][2] = bottomRight

    console.log("New Feature clipped: ", JSON.stringify(newFeatureCollection));

  return  newFeatureCollection;
}

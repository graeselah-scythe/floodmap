export const cdo_geojson = {
  "type": "FeatureCollection",
  "name": "CDO Barangays",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "barangay": "Agusan",
        "risk": "High" // set risk level here
      },
      "geometry": {
        "type": "Point",
        "coordinates": [124.74891105532096, 8.485406552136249] 
        // ⚠️ NOTE: GeoJSON MUST BE [lng, lat]
      }
    }
  ]
};

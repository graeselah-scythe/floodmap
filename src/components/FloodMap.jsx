import React, { useState, useRef, useMemo } from "react";
import "./FloodMap.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { cdo_geojson } from "../data/cdo_geojson";

// CUSTOM MAP PIN ICONS (colored per risk)
const pinIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [27, 41],
    iconAnchor: [13, 41],
    popupAnchor: [1, -34],
  });

const riskIcons = {
  "Very High": pinIcon("red"),
  High: pinIcon("orange"),
  Medium: pinIcon("yellow"),
  Low: pinIcon("green"),
};

const FloodMap = () => {
  const mapRef = useRef(null);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [hovered, setHovered] = useState(null);

  // Color function for risk levels
  const getRiskColor = (risk) => {
    switch (risk) {
      case "Very High":
        return "#8B0000";
      case "High":
        return "#D9534F";
      case "Medium":
        return "#F0AD4E";
      case "Low":
        return "#5CB85C";
      default:
        return "#999999";
    }
  };

  // Filter + Search
  const filteredBarangays = useMemo(() => {
    return cdo_geojson.features.filter((f) => {
      const matchRisk =
        riskFilter === "All" || f.properties.risk === riskFilter;

      const matchSearch = f.properties.barangay
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchRisk && matchSearch;
    });
  }, [search, riskFilter]);

  // flyTo when clicking a barangay card
  const flyToBarangay = (barangay) => {
    const map = mapRef.current;
    if (!map) return;

    const coords = barangay.geometry.coordinates;
    map.flyTo([coords[1], coords[0]], 15, { duration: 1.2 });

    L.popup()
      .setLatLng([coords[1], coords[0]])
      .setContent(`
        <strong>${barangay.properties.barangay}</strong><br/>
        Risk: ${barangay.properties.risk}
      `)
      .openOn(map);
  };

  return (
    <div style={{ display: "flex", height: "600px", width: "100%" }}>

      {/* ---------- SIDEBAR ---------- */}
      <div
        style={{
          width: "320px",
          background: "#FFF7E5",
          borderRight: "2px solid #F3D79C",
          padding: "20px",
          overflowY: "auto"
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>Barangay List</h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search barangay..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "15px"
          }}
        />

        {/* Risk Filters */}
        <div style={{ marginBottom: "20px" }}>
          {["All", "Low", "Medium", "High", "Very High"].map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              style={{
                padding: "8px 12px",
                marginRight: "6px",
                marginBottom: "6px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background:
                  riskFilter === risk ? "#F3D79C" : "#EDEDED"
              }}
            >
              {risk}
            </button>
          ))}
        </div>

        {/* Barangay Cards */}
        {filteredBarangays.map((f, index) => (
          <div
            key={index}
            onMouseEnter={() => setHovered(f.properties.barangay)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => flyToBarangay(f)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "10px",
              background: hovered === f.properties.barangay ? "#FFF1C4" : "#FFFFFF",
              cursor: "pointer",
              border: "1px solid #E9D398"
            }}
          >
            <strong>{f.properties.barangay}</strong><br />
            Risk Level: <span style={{ color: getRiskColor(f.properties.risk) }}>
              {f.properties.risk}
            </span>
          </div>
        ))}
      </div>

      {/* ---------- MAP AREA ---------- */}
      <MapContainer
        center={[8.477, 124.645]}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Markers */}
        {filteredBarangays.map((f, index) => {
          const coords = f.geometry.coordinates;
          return (
            <Marker
  key={index}
  position={[coords[1], coords[0]]}
  icon={riskIcons[f.properties.risk] || riskIcons["Low"]} // default
>
  <Popup>
    <strong>{f.properties.barangay}</strong> <br />
    Risk: {f.properties.risk}
  </Popup>
</Marker>

          );
        })}
      </MapContainer>
    </div>
  );
};

export default FloodMap;

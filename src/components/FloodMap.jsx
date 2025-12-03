import React, { useState, useRef, useMemo, useEffect } from "react";
import { Tooltip, MapContainer, TileLayer, Marker } from "react-leaflet";
import "./FloodMap.css";
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
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  // Fix for map resize/overlap issues
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    // Invalidate size after component mounts
    setTimeout(() => {
      handleResize();
    }, 100);

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Color function for right panel
  const getRiskColor = (risk) => {
    switch (risk) {
      case "Very High": return "#E53935";
      case "High": return "#FB8C00";
      case "Medium": return "#FDD835";
      case "Low": return "#43A047";
      default: return "#757575";
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

  // flyTo when clicking a barangay
  const flyToBarangay = (barangay) => {
    const map = mapRef.current;
    if (!map) return;

    const coords = barangay.geometry.coordinates;
    map.flyTo([coords[1], coords[0]], 15, { duration: 1.2 });

    setSelectedBarangay(barangay.properties);
  };

  // Handle map creation with invalidation
  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
    
    // Invalidate size after a short delay to ensure DOM is ready
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 0);
  };

  return (
    <div className="floodmap-grid-container">
      {/* NAVBAR - Assuming you have one, adjust if needed */}
      <header className="floodmap-navbar">
        <h1>Flood Risk Map</h1>
        <div className="navbar-subtitle">Cagayan de Oro City</div>
      </header>

      {/* LEFT SIDEBAR */}
      <aside className="floodmap-sidebar">
        <div className="sidebar-content">
          <h2>Barangay List</h2>

          <input
            type="text"
            placeholder="Search barangay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          <div className="risk-filter-buttons">
            {["All", "Low", "Medium", "High", "Very High"].map((risk) => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`risk-btn ${riskFilter === risk ? "active" : ""}`}
              >
                {risk}
              </button>
            ))}
          </div>

          {/* INFO PANEL */}
          <div className="info-panel">
            {selectedBarangay ? (
              <>
                <h3>Barangay Details</h3>
                <p>
                  <strong>{selectedBarangay.barangay}</strong>
                </p>
                <p>
                  <strong>Flood Risk: </strong>
                  <span style={{ color: getRiskColor(selectedBarangay.risk) }}>
                    {selectedBarangay.risk}
                  </span>
                </p>
              </>
            ) : (
              <p className="placeholder-text">Click a barangay to view details</p>
            )}
          </div>

          {/* Barangay Cards */}
          <div className="barangay-list">
            {filteredBarangays.map((f, index) => (
              <div
                key={index}
                className={`barangay-card ${hovered === f.properties.barangay ? "hovered" : ""}`}
                onMouseEnter={() => setHovered(f.properties.barangay)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  flyToBarangay(f);
                  // Force map resize after interaction
                  setTimeout(() => {
                    if (mapRef.current) {
                      mapRef.current.invalidateSize();
                    }
                  }, 10);
                }}
              >
                <strong>{f.properties.barangay}</strong><br />
                <span style={{ color: getRiskColor(f.properties.risk) }}>
                  {f.properties.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN MAP AREA */}
      <main className="floodmap-main">
        <div className="map-container">
          <MapContainer
            center={[8.477, 124.645]}
            zoom={11}
            scrollWheelZoom={true}
            className="leaflet-map"
            whenCreated={handleMapCreated}
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {filteredBarangays.map((f, index) => {
              const coords = f.geometry.coordinates;
              return (
                <Marker
                  key={index}
                  position={[coords[1], coords[0]]}
                  icon={riskIcons[f.properties.risk] || riskIcons["Low"]}
                  eventHandlers={{
                    click: () => {
                      setSelectedBarangay(f.properties);
                      // Force map resize after marker click
                      setTimeout(() => {
                        if (mapRef.current) {
                          mapRef.current.invalidateSize();
                        }
                      }, 10);
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} sticky>
                    <strong>{f.properties.barangay}</strong>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default FloodMap;
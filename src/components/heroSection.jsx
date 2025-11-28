import React from "react";
import "./HeroSection.css";
import cdoMap from "../assets/cdoMap.png";     // change path to your asset

const HeroSection = () => {
  return (
    <section className="hero-wrapper">

      <div className="hero-left">
        <h1>Building a Flood-Resilient Cagayan de Oro</h1>

        <p className="hero-sub">
          An AI-powered flood risk assessment for your Barangay.
          Stay informed, stay prepared, stay safe.
        </p>

        <button className="hero-btn">View Flood Map</button>
      </div>

      <div className="hero-right">
        <img src={cdoMap} alt="map" />
      </div>
    </section>
  );
};

export default HeroSection;

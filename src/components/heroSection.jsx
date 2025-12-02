import React from "react";
import "./HeroSection.css";
import cdoMap from "../assets/cdoMap.png";     // change path to your asset
import { Icon } from '@iconify/react';

const HeroSection = () => {
  return (
    <section className="hero-wrapper">

      <div className="hero-left">
        <h1>Building a Flood-Resilient Cagayan de Oro</h1>

        <p className="hero-sub">
          An AI-powered flood risk assessment for your Barangay.
          <br />
          Stay informed. Stay prepared. Stay safe.
        </p>

    <button className="hero-btn">
  <Icon icon="mdi:map-outline" className="hero-btn-icon" />
  View Flood Map
</button>

      </div>

      <div className="hero-right">
        <img src={cdoMap} alt="map" />
      </div>
    </section>
  );
};

export default HeroSection;

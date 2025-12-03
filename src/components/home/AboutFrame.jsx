import React from "react";
import "./AboutFrame.css";

const AboutFrame = () => {
  return (
    <div className="about-section">

      <p className="about-description">
        This project uses a Random Forest Machine Learning Model to classify barangays 
        into Low, Medium, High, or Very High Flood Risk using multi-source climate 
        and geographic data.
      </p>

      <h1 className="about-heading">How<br />Useful</h1>

      <div className="about-inner-box">
        <ul>
          <li>
            Generate insights that can guide residents and policymakers 
            in flood preparedness and infrastructure planning.
          </li>

          <li>
            Seeks to generate accurate and localized flood-risk assessments.
          </li>

          <li>
            Intends to identify barangays that are most suitable for the placement 
            of evacuation centers based on their flood-risk classification 
            and geographic features.
          </li>
        </ul>
      </div>

    </div>
  );
};

export default AboutFrame;

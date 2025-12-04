import React from "react";
import "./FloodInfo.css";
import flood from "../../assets/flood.jpg";

const FloodInfo = () => {
  return (
    <section className="stats-wrapper">

      {/* Top Numbers */}
      <div className="stats-gradient-box">
        <div className="stats-numbers">
          <div className="stats-box">
            <h2>80+</h2>
            <p>Barangays Mapped</p>
          </div>

          <div className="stats-box">
            <h2>15+</h2>
            <p>Risk Factors Analyzed</p>
          </div>

          <div className="stats-box">
            <h2>99%</h2>
            <p>Prediction Accuracy</p>
          </div>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="stats-content">
        <div className="stats-left">
          <h1>Flooding Impacts Thousands<br />in CDO Every Year</h1>

          <p className="stats-desc">
            Cagayan de Oro City faces recurring flood events that disrupt lives,
            damage property, and threaten community safety. Traditional risk assessment 
            methods often lack the granularity and predictive power needed for effective 
            preparedness.
          </p>

          <ul>
            <li><br/> Limited access to actionable, localized flood risk data</li> <br />
            <li>Difficulty in identifying high-risk areas before disasters strike</li> <br />
            <li>Need for data-driven tools to support emergency response planning</li> <br />
          </ul>
        </div>

       <div className="stats-right">
  <div className="image-frame">
    <img src={flood} alt="Flooded Building" />
  </div>
</div>
      </div>

    </section>
  );
};

export default FloodInfo;

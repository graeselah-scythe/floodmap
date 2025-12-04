import React, { useState } from "react";
import "./PreparednessTab.css";


const PreparednessTab = () => {
  const [activeTab, setActiveTab] = useState("before");

  return (
    <div className="prep-wrapper">
      <div className="prep-container">
        {/* HEADER */}
        <div className="prep-header">
          <span className="prep-tag">🛟 Stay Prepared, Stay Safe</span>
          <h1>Flood Preparedness Hub</h1>
          <p>Essential resources and guidelines to help you prepare for, respond to, and recover from flood events.</p>
        </div>

{/* TABS */}
<div className="prep-tabs">
  <button
    className={activeTab === "before" ? "active" : ""}
    onClick={() => setActiveTab("before")}
  >
    Before Flood
  </button>
  <button
    className={activeTab === "during" ? "active" : ""}
    onClick={() => setActiveTab("during")}
  >
    During Flood
  </button>
  <button
    className={activeTab === "after" ? "active" : ""}
    onClick={() => setActiveTab("after")}
  >
    After Flood
  </button>
</div>

        {/* CONTENT AREA */}
        <div className="prep-content">
          {activeTab === "before" && (
            <>
              <h2 className="section-title">Preparation Steps</h2>

              <div className="prep-steps">
                {[
                  "Prepare an Emergency Kit",
                  "Secure Important Documents",
                  "Move Valuables To Higher Areas",
                  "Know Evacuation Routes",
                  "Stay Informed",
                  "Take Care Of Pets",
                ].map((step, index) => (
                  <div className="step-card" key={index}>
                    <div className="step-number">{index + 1}</div>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "during" && (
            <>
              <h2 className="section-title">During a Flood</h2>
              
              <div className="prep-steps">
                {[
                  "Stay calm and follow instructions from authorities.",
                  "Avoid walking or driving through floodwaters.",
                  "Move immediately to higher ground.",
                  "Keep emergency kit accessible.",
                  "Stay updated through radio, TV, or official social media pages.",
                ].map((step, index) => (
                  <div className="step-card" key={index}>
                    <div className="step-number">{index + 1}</div>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "after" && (
            <>
              <h2 className="section-title">After a Flood</h2>
              <div className="prep-steps">
                {[
                  "Return home only when authorities say it is safe.",
                  "Check property for structural damage.",
                  "Avoid using electrical appliances until inspected.",
                  "Document damage for insurance and reporting.",
                  "Clean and disinfect everything that got wet.",
                ].map((step, index) => (
                  <div className="step-card" key={index}>
                    <div className="step-number">{index + 1}</div>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparednessTab;

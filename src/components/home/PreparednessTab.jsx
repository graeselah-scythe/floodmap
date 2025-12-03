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

              {/* EMERGENCY CONTACTS */}
              <div className="contacts-card">
                <h3>Emergency Contacts</h3>
                <ul>
                  <li><strong>CDRRMO Emergency Hotline:</strong> 0917-722-4677</li>
                  <li><strong>PNP CDO:</strong> 0998-857-2333</li>
                  <li><strong>City Health Office:</strong> (088) 865-1420</li>
                  <li><strong>Fire Department:</strong> (088) 857-1332</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === "during" && (
            <>
              <h2 className="section-title">During a Flood</h2>
              <ul className="prep-list">
                <li>Stay calm and follow instructions from authorities.</li>
                <li>Avoid walking or driving through floodwaters.</li>
                <li>Move immediately to higher ground.</li>
                <li>Keep emergency kit accessible.</li>
                <li>Stay updated through radio, TV, or official social media pages.</li>
              </ul>
            </>
          )}

          {activeTab === "after" && (
            <>
              <h2 className="section-title">After a Flood</h2>
              <ul className="prep-list">
                <li>Return home only when authorities say it is safe.</li>
                <li>Check property for structural damage.</li>
                <li>Avoid using electrical appliances until inspected.</li>
                <li>Document damage for insurance and reporting.</li>
                <li>Clean and disinfect everything that got wet.</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparednessTab;

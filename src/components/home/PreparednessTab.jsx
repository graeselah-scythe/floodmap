import React, { useState } from "react";
import "./PreparednessTab.css";
import { Icon } from '@iconify/react';

const PreparednessTab = () => {
  const [activeTab, setActiveTab] = useState("before");

  const beforeSteps = [
    "Prepare an Emergency Kit",
    "Secure Important Documents",
    "Move Valuables To Higher Areas",
    "Know Evacuation Routes",
    "Stay Informed",
    "Take Care Of Pets",
  ];

  const duringSteps = [
    "Stay calm and follow instructions from authorities.",
    "Avoid walking or driving through floodwaters.",
    "Move immediately to higher ground.",
    "Keep your emergency kit close.",
    "Monitor updates from official channels.",
  ];

  const afterSteps = [
    "Return home ONLY when authorities say it is safe.",
    "Check property for structural damage before entering.",
    "Avoid using electrical appliances until inspected.",
    "Document damages for insurance and reporting.",
    "Clean and disinfect items affected by floodwater.",
  ];

  return (
    <div className="prep-wrapper">
      <div className="prep-container">

        {/* HEADER */}
    <div className="prep-header">
  <div className="prep-tag-box">
  <Icon icon="material-symbols:warning-outline" className="warning-icon" />
  Stay Prepared, Stay Safe
</div>

          <h1>Flood Preparedness Hub</h1>
          <p>
            Essential resources and guidelines to help you prepare for, respond
            to, and recover from flood events.
          </p>
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

        {/* CONTENT */}
        <div className="prep-content">
          {(activeTab === "before" ||
            activeTab === "during" ||
            activeTab === "after") && (
            <>

              {/* TITLE PER TAB */}
              <h2 className="section-title">
                {activeTab === "before" && "Preparation Steps"}
                {activeTab === "during" && "Safety Steps During a Flood"}
                {activeTab === "after" && "Recovery Steps After a Flood"}
              </h2>

              {/* STEP CARDS */}
              <div className="prep-steps">
                {(activeTab === "before"
                  ? beforeSteps
                  : activeTab === "during"
                  ? duringSteps
                  : afterSteps
                ).map((step, index) => (
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
                  <li>
                    <strong>CDRRMO Emergency Hotline:</strong> 0917-722-4677
                  </li>
                  <li>
                    <strong>PNP CDO:</strong> 0998-857-2333
                  </li>
                  <li>
                    <strong>City Health Office:</strong> (088) 865-1420
                  </li>
                  <li>
                    <strong>Fire Department:</strong> (088) 857-1332
                  </li>
                </ul>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparednessTab;

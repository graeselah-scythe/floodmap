import React from "react";
import "./Contacts.css";

const Contacts = () => {
  return (
    <div className="emergency-wrapper">
      <div className="contacts-card">
        <h3>Emergency Contacts</h3>
        
        <ul>
          <li>
            <strong>CDRRMO Emergency Hotline <span className="emergency-badge">24/7</span></strong>
            <span className="number">0917-722-4677</span>
          </li>
          <li>
            <strong>PNP Cagayan de Oro</strong>
            <span className="number">0998-857-2333</span>
          </li>
          <li>
            <strong>City Health Office</strong>
            <span className="number">(088) 865-1420</span>
          </li>
          <li>
            <strong>Fire Department</strong>
            <span className="number">(088) 857-1332</span>
          </li>
        </ul>
        
        <p className="contacts-subtitle">
          Save these numbers. Stay safe, stay prepared.
        </p>
      </div>
    </div>
  );
};

export default Contacts;
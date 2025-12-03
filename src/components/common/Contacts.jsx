import React from "react";
import "./Contacts.css";

const Contacts = () => {
  return (
    <div className="contacts-card">
      <h3>Emergency Contacts</h3>

      <ul>
        <li><strong>CDRRMO Emergency Hotline:</strong> 0917-722-4677</li>
        <li><strong>PNP Cagayan de Oro:</strong> 0998-857-2333</li>
        <li><strong>City Health Office:</strong> (088) 865-1420</li>
        <li><strong>Fire Department:</strong> (088) 857-1332</li>
      </ul>
    </div>
  );
};

export default Contacts;

import React from 'react'; // Add this missing import
import Navbar from '../components/common/Navbar.jsx';
import PreparednessTab from '../components/PreparednessTab';

const Preparedness = () => {
  return (
    <div>
      <Navbar />
      <PreparednessTab />
    </div>
  );
};

export default Preparedness;
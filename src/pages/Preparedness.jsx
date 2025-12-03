import React from 'react'; // Add this missing import
import Navbar from '../components/common/Navbar';
import PreparednessTab from '../components/home/PreparednessTab';

const Preparedness = () => {
  return (
    <div>
      <Navbar />
      <PreparednessTab />
    </div>
  );
};

export default Preparedness;
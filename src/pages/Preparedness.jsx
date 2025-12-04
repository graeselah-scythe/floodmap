import React from 'react'; // Add this missing import
import PreparednessTab from '../components/Preparedness/PreparednessTab';
import Contacts from '../components/Preparedness/Contacts';
import Footer from '../components/common/Footer'; 
const Preparedness = () => {
  return (
      <div>
        <PreparednessTab />
        <Contacts />
        <Footer />
      </div>
  );
};

export default Preparedness;
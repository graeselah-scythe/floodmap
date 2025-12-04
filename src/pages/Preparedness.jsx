import React from 'react'; // Add this missing import

import PreparednessTab from '../components/home/PreparednessTab';
import Contacts from '../components/common/Contacts';
import  Footer  from '../components/common/Footer';

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
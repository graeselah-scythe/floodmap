import React from 'react';
import HeroSection from '../components/home/heroSection';
import Preparedness from '../components/home/PreparednessTab';
import AboutFrame from '../components/home/AboutFrame';

const home = () => {
  return (
    <div>
      <HeroSection />
      <Preparedness />
      <AboutFrame />
    </div>
  );
};

export default home;
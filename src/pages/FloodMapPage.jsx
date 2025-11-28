import React from 'react';

const FloodMapPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Flood Map</h1>
            <div className="flex space-x-4">
              <a href="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md">Home</a>
              <a href="/map" className="text-blue-600 font-semibold px-3 py-2 rounded-md">Flood Map</a>
              <a href="/preparedness" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md">Preparedness</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Interactive Flood Map</h2>
          <p className="text-gray-600 mb-6">This is where your React Leaflet map will be integrated.</p>
          
          {/* Map Placeholder */}
          <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">Map Component</p>
              <p className="text-gray-400">React Leaflet Map will be implemented here</p>
            </div>
          </div>

          {/* Map Controls Placeholder */}
          <div className="mt-6 flex gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              View High Risk Areas
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Show Evacuation Centers
            </button>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
              Real-time Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloodMapPage;
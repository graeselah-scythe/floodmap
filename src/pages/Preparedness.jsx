import React from 'react';

const Preparedness = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Emergency Preparedness</h1>
            <div className="flex space-x-4">
              <a href="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md">Home</a>
              <a href="/map" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md">Flood Map</a>
              <a href="/preparedness" className="text-blue-600 font-semibold px-3 py-2 rounded-md">Preparedness</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Flood Safety Preparedness</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-xl font-semibold mb-2">Before a Flood</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Know your area's flood risk and elevation</li>
                <li>Prepare an emergency kit with essential supplies</li>
                <li>Develop an evacuation plan and practice it</li>
                <li>Keep important documents in waterproof containers</li>
              </ul>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-xl font-semibold mb-2">During a Flood</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Move to higher ground immediately</li>
                <li>Avoid walking or driving through flood waters</li>
                <li>Stay tuned to local news and emergency alerts</li>
                <li>Follow evacuation orders from authorities</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-xl font-semibold mb-2">After a Flood</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Return home only when authorities say it's safe</li>
                <li>Avoid floodwaters - they may be contaminated</li>
                <li>Inspect your home for damage carefully</li>
                <li>Document damage for insurance claims</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Emergency Contacts</h4>
            <ul className="text-yellow-700 space-y-1">
              <li>Emergency Services: 911</li>
              <li>Local Barangay Office: [Your local number]</li>
              <li>Rescue Services: [Local rescue hotline]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preparedness;
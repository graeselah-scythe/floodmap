import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Make sure this file exists (we moved it to src/styles/index.css in the plan, so update this path if you moved it)
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
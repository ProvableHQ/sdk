import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css'; 

const Homepage = () => {
  return (
    <div className="homepage">
      <h1 className="header">Aleo SDK</h1>
      <p>The tooling for building zero knowledge applications at your fingertips</p>
      <p>Select a section to navigate:</p>
      <ul>
        <li>
          <Link to="/account">Account</Link>
        </li>
        <li>
          <Link to="/record">Record</Link>
        </li>
        <li>
          <Link to="/rest">REST</Link>
        </li>
        <li>
          <Link to="/advanced">Advanced</Link>
        </li>
        </ul>
    </div>
  );
};

export default Homepage;
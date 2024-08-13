import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "antd";

import './Homepage.css'; 

const Homepage = () => {
  return (
    <div className="homepage">
    <img src="../public/primary-wordmark-dark.png" className="logo"></img>
    <div className="headerContainer">
      <h1 className="header">Aleo SDK</h1>
      <p className="subheader">The tooling for building zero knowledge applications at your fingertips</p>
        <button className="button"> View Docs <span className="arrow">&rarr;</span> </button>
        </div>
     
      <ul className="actionRow">
        <li  className="actionItem">
          <Link to="/account">Manage Accounts</Link>
        </li>
        <li className="actionItem">
          <Link to="/develop" >Execute and deploy programs</Link>
        </li>
        <li className="actionItem"> 
          <Link to="/transfer">Manage program state and data</Link>
        </li>
        </ul>
    </div>
  );
};

export default Homepage;
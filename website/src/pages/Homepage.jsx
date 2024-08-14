import React from 'react';
import { Link } from 'react-router-dom';


import './Homepage.css'; 

const Homepage = () => {
  return (
    <div className="homepage">
    <img src="../public/primary-wordmark-dark.png" className="logo"></img>
    <div className="headerContainer">
      <h1 className="header">Aleo SDK</h1>
      <p className="subheader">The tooling for building zero knowledge applications at your fingertips</p>
        <button className="button"> <Link target="_blank" rel="noopener noreferrer" to="https://developer.aleo.org/sdk/"> View Docs <span className="arrow">&rarr;</span> </Link> </button>
    
     
      <ul className="actionRow">
        <li  className="actionItem">
          <Link to="/account">Create and manage accounts</Link>
        </li>
        <li className="actionItem">
          <Link to="/develop" >Execute and deploy programs</Link>
        </li>
        <li className="actionItem"> 
          <Link to="/transfer">Manage program state and data</Link>
        </li>
        </ul>


        <p className="secondSubheader">Build your first zero knowledge app with create-leo-app</p>
        <button className="button"> <Link target="_blank" rel="noopener noreferrer" to="https://docs.leo-lang.org/sdk/create-leo-app/tutorial/">Try it now <span className="arrow">&rarr;</span></Link>  </button>


        <div className="footer">          
           <a href="https://github.com/ProvableHQ/sdk">
                            <img src="../public/github-mark-white.png" style={{height:"24px", marginBottom: "1rem"}}></img>
                            </a>
                         
                            © 2024 Provable Inc.
                      
        </div>
        </div>
    </div>
  );
};

export default Homepage;
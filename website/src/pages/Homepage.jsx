import React from "react";
import { Link } from "react-router-dom";

import "./Homepage.css";

const Homepage = () => {
    return (
        <div className="homepage">
            <Link to="https://provable.com/">
                <img
                    src="../public/primary-wordmark-dark.png"
                    className="logo"
                ></img>
            </Link>
            <div className="headerContainer">
                <h1 className="header">Aleo SDK</h1>
                <p className="subheader">
                    The tooling for building zero-knowledge applications at your
                    fingertips
                </p>{" "}
                <div className="buttonRow">
                <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    to="/account"
                >
                    <button className="button">
                        {" "}
                        Try now <span className="arrow">&rarr;</span>{" "}
                    </button>
                </Link>{" "}
                <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    to="https://developer.aleo.org/sdk/"
                >
                    <button className="button">
                        {" "}
                        See Docs <span className="arrow">&rarr;</span>{" "}
                    </button>
                </Link>{" "}
                </div>
                <ul className="actionRow">
                    <Link to="/account" className="actionItem">
                        {" "}
                        <li>Create and manage accounts </li>
                    </Link>

                    <Link to="/develop" className="actionItem">
                        {" "}
                        <li>Execute and deploy programs </li>
                    </Link>

                    <Link to="/transfer" className="actionItem">
                        <li>Manage program state and data</li>
                    </Link>
                </ul>
                <p className="secondSubheader">
                    Build your first zero-knowledge app with create-leo-app
                </p>{" "}
                <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    to="https://docs.leo-lang.org/sdk/create-leo-app/tutorial/"
                >
                    <button className="button">
                        Try now <span className="arrow">&rarr;</span>
                    </button>
                </Link>{" "}
                <div className="footer">
                    <a href="https://github.com/ProvableHQ/sdk">
                        <img
                            src="../public/github-mark-white.png"
                            style={{ height: "24px", marginBottom: "1rem" }}
                        ></img>
                    </a>
                    <Link to="https://sdk.betteruptime.com/" style={{color: "white"}}> <span>Status</span> </Link>
                    <Link to="/terms_of_use" style={{ color: "white", textDecoration: "none" }}>
                        {" "}
                        <span>Terms of Use</span>{" "}
                    </Link>
                    <Link to="/privacy_policy" style={{ color: "white", textDecoration: "none"}}>
                        <span>Privacy Policy</span>
                    </Link>
                    © 2024 Provable Inc.
                </div>
            </div>
        </div>
    );
};

export default Homepage;

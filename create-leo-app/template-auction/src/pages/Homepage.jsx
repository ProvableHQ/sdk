import React from "react";
import { Link } from "react-router-dom";

import "./Homepage.css";

const Homepage = () => {
    return (
        <div className="homepage">
            <Link to="https://provable.com/">
                <img
                    src="../public/provable-logo-light.svg"
                    className="logo"
                ></img>
            </Link>
            <div className="headerContainer">
                <h1 className="header">Zero Knowledge Auction</h1>
                <p className="subheader">
                    Learn how to manage private state via a private auction.
                </p>{" "}
                <div className="buttonRow">
                <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    to="/bidder"
                >
                    <button className="button">
                        {" "}
                        Make a Bid <span className="arrow">&rarr;</span>{" "}
                    </button>
                </Link>{" "}
                <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    to="https://docs.explorer.provable.com/docs/sdk"
                >
                    <button className="button">
                        {" "}
                        See Open bids <span className="arrow">&rarr;</span>{" "}
                    </button>
                </Link>{" "}
                </div>
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
                    © 2025 Provable Inc.
                </div>
            </div>
        </div>
    );
};

export default Homepage;

// GmailApi.jsx

import React, { useState } from "react";

const GmailApi = () => {
  const [gmailAuthenticated, setGmailAuthenticated] = useState(false);
  const [showGmailEmoji, setGmailEmoji] = useState(false);

  const handleGmailAuthenticate = async ({ sessionID }) => {
    const jsonCredentials = document.getElementById("gmailJsonInput").value;

    try {
      const response = await fetch("http://localhost:8000/authenticate/gmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionID: sessionID, credentials: jsonCredentials }),
      });
      setGmailEmoji(true); 
      if (response.ok) {
        const data = await response.json();
        setGmailAuthenticated(data.success);
      } else {
        setGmailAuthenticated(false);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  };

  return (
    <div className="api-container">
      <div className="api-heading">
        <h2>Gmail</h2>
      </div>
      <div className="api-content">         
        <div className="bullet-points-container">
          <li> Create <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"> credentials </a> in google using OAuth 2.0 Client IDs (for web clients)
          </li>
          <li> Download the credentials, copy the json content below and hit Authenticate
          </li>
        </div>
        <input
            type="text"
            placeholder="Enter json credentials ..."
            id="gmailJsonInput"
          />
      </div>
      <div className="authentication-container">
        <button className="styled-button" onClick={handleGmailAuthenticate}> Authenticate
        </button>
        <div className="emoji-buttons">
          { showGmailEmoji ? (
            gmailAuthenticated ? (
              <button className="thumbs-up">
                <span>&#128077;&#127997;</span>
              </button>
               ) : (
              <button className="thumbs-down">
                <span>&#10060;</span>
              </button>
              ) 
            ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailApi;

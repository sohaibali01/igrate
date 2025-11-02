// HubspotApi.jsx

import { useState } from "react";
const API_URL = "http://localhost:8000";

const HubspotApi = ({ sessionID }) => {
  const [hubspotAuthenticated, setHubspotAuthenticated] = useState(false);
  const [showHubspotEmoji, setHubspotEmoji] = useState(false);

  const handleHubspotAuthenticate = async () => {
    const jsonCredentials = document.getElementById("hubspotJsonInput").value;

    try {
      
      const response = await fetch(`${API_URL}/authenticate/hubspot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionID: sessionID, credentials: jsonCredentials }),
      });
      setHubspotEmoji(true); 
      if (response.ok) {
        const data = await response.json();
        setHubspotAuthenticated(data.success);
      } else {
        setHubspotAuthenticated(false);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  };

  return (
    <div className="api-container">
      <div className="api-heading">
        <h2>Hubspot</h2>
      </div>
      <div className="api-content">         
        <div className="hubspot-bullet-points-container">
          <li> Create your hubspot <a href="https://developers.hubspot.com/docs/api/private-apps" target="_blank" rel="noopener noreferrer"> app </a>  </li>
          <li> Login to your hubspot account <span>&#x2192;</span> Settings <span>&#x2192;</span> Integration <span>&#x2192;</span> Private apps <span>&#x2192;</span> select app <span>&#x2192;</span> paste access token below and hit Authenticate </li>
        </div>
        <input 
            type="text"
            placeholder="Enter api key ..."
            id="hubspotJsonInput"
          />
      </div>
      <div className="authentication-container">
        <button className="styled-button" onClick={handleHubspotAuthenticate}> Authenticate
        </button>
        <div className="emoji-buttons">
          { showHubspotEmoji ? (
            hubspotAuthenticated ? (
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

export default HubspotApi;

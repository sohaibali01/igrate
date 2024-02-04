// SlackApi.jsx

import React, { useState } from "react";

const SlackApi = () => {
  const [slackAuthenticated, setSlackAuthenticated] = useState(false);
  const [showSlackEmoji, setSlackEmoji] = useState(false);

  const handleSlackAuthenticate = async () => {
    const jsonCredentials = document.getElementById("slackJsonInput").value;

    try {
      const response = await fetch("http://localhost:8000/authenticate/slack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credentials: jsonCredentials }),
      });
      setSlackEmoji(true); 
      if (response.ok) {
        const data = await response.json();
        setSlackAuthenticated(data.success);
      } else {
        setSlackAuthenticated(false);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  };

  return (
    <div className="api-container">
      <div className="api-heading">
        <h2>Slack</h2>
      </div>
      <div className="api-content">         
        <div className="bullet-points-container">
            <li> Create your slack <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer"> app </a>   </li>
            <li> Select your app <span>&#x2192;</span> "OAuth & Permissions" <span>&#x2192;</span> "User Token Scopes" <span>&#x2192;</span> select your scopes <span>&#x2192;</span> "Reinstall to workspace" <span>&#x2192;</span> paste token below and hit Authenticate   </li>
        </div>
        <input
            type="text"
            placeholder="Enter json credentials ..."
            id="slackJsonInput"
          />
      </div>
      <div className="authentication-container">
        <button className="styled-button" onClick={handleSlackAuthenticate}> Authenticate
        </button>
        <div className="emoji-buttons">
          { showSlackEmoji ? (
            slackAuthenticated ? (
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

export default SlackApi;

// OpenAIApi.jsx

import React, { useState } from "react";

const OpenAIApi = ({ openAIAuthenticated, setOpenAIAuthenticated,  sessionID  }) => {
 // const [openAIAuthenticated, setOpenAIAuthenticated] = useState(false);
  const [showOpenAIEmoji, setOpenAIEmoji] = useState(false);
  const [isAuthenticating, setisAuthenticating] = useState(false);

  const handleOpenAIAuthenticate = async () => {
    const jsonCredentials = document.getElementById("openAIJsonInput").value;
    try {
      setisAuthenticating(true);
      setOpenAIEmoji(true); 
      const response = await fetch("http://localhost:8000/authenticate/openAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({sessionID: sessionID,  credentials: jsonCredentials }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setOpenAIAuthenticated(data.success);
      } else {
        setOpenAIAuthenticated(false);
      }
      setisAuthenticating(false);
    } catch (error) {
      console.error("Error during authentication:", error);
    }
  };

  return (
    <div className="openai-container">
    <div className="api-heading">
      <h2>OpenAI</h2>
    </div>
    <div className="api-content">         
    <div className="bullet-points-container">
      <li> Go to <a href="https://platform.openai.com/account/billing/overview" target="_blank" rel="noopener noreferrer"> billing </a> 
        section and add your credit card info (don't worry it'll probably cost you less that 0.1$/hr at max)
      </li>
      <li> Create your <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"> api key</a>, paste it below and hit Authenticate
      </li>
    </div>
        <input
          type="text"
          placeholder="Enter API Key ..."
          id="openAIJsonInput"
        />
    </div>
    <div className="authentication-container">
      <button
        className="styled-button"
        onClick={handleOpenAIAuthenticate}
      > Authenticate
      </button>
      <div className="emoji-buttons">
          { showOpenAIEmoji ? (
            ( isAuthenticating ? (
              <button
                type="submit"
                className={`send-button ${isAuthenticating ? 'stop-animation' : ''}`} // Add stop-animation class when isTyping is true
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
              </button>
            ) : (
            openAIAuthenticated ? (
              <button className="thumbs-up">
                <span>&#128077;&#127997;</span>
              </button>
               ) : (
              <button className="thumbs-down">
                <span>&#10060;</span>
              </button>
               )
              )  
            )
            ) : (<></>)
               }
        </div>
    </div>
  </div>
  );
};

export default OpenAIApi;

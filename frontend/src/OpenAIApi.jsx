// OpenAIApi.jsx

import React, { useState } from "react";

const OpenAIApi = ({ openAIAuthenticated, setOpenAIAuthenticated }) => {
 // const [openAIAuthenticated, setOpenAIAuthenticated] = useState(false);
  const [showOpenAIEmoji, setOpenAIEmoji] = useState(false);

  const handleOpenAIAuthenticate = async () => {
    const jsonCredentials = document.getElementById("openAIJsonInput").value;
    try {
      const response = await fetch("http://localhost:8000/authenticate/openAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credentials: jsonCredentials }),
      });
      setOpenAIEmoji(true); 
      if (response.ok) {
        const data = await response.json();
        setOpenAIAuthenticated(data.success);
      } else {
        setOpenAIAuthenticated(false);
      }
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
            openAIAuthenticated ? (
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

export default OpenAIApi;

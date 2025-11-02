// GmailApi.jsx

import { useState } from "react";
const API_URL = "http://localhost:8000";

const GmailApi = ({ sessionID }) => {
  const [gmailAuthenticated, setGmailAuthenticated] = useState(false);
  const [showGmailEmoji, setGmailEmoji] = useState(false);

  const handleGmailAuthenticate = async () => {
    const jsonCredentials = document.getElementById("gmailJsonInput").value;
    try {
      // Parse the JSON credentials
      const credentials = JSON.parse(jsonCredentials);
  
      // Open OAuth 2.0 endpoint in a new window
      const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
      const params = {
        'client_id': credentials.web.client_id,
        'redirect_uri': credentials.web.redirect_uris[0],
        'scope': 'https://mail.google.com',
        'state': 'try_sample_request',
        'include_granted_scopes': 'true',
        'response_type': 'token'
      };
      const urlParams = new URLSearchParams(params);
      const authUrl = `${oauth2Endpoint}?${urlParams.toString()}`;
  
      // Open authentication window
      const authWindow = window.open(authUrl, '_blank');
      setGmailEmoji(true);

      const interval = setInterval(async () => {
        console.log("received", authWindow.location.href);
        if (authWindow.location.href.startsWith(credentials.web.redirect_uris[0])) {
          const urlParams = new URLSearchParams(authWindow.location.hash.substr(1));
          if (urlParams.has('access_token')) {
            const accessToken = urlParams.get('access_token');
            console.log("Access token:", accessToken);
            clearInterval(interval);
            authWindow.close(); // Close the authentication window once done
            // Proceed with further actions, such as sending the access token to the server
            try {
              
              const response = await fetch(`${API_URL}/authenticate/gmail`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ sessionID: sessionID, accessToken: accessToken }),
              });
              if (response.ok) {
                const data = await response.json();
                setGmailAuthenticated(data.success);
              } else {
                setGmailAuthenticated(false);
              }
            } catch (error) {
              console.error("Error while sending access token to server:", error);
            }

          } else {
            console.log("Access token not found in URL: ", authWindow.location);
          }
        }
      }, 1000);

      window.addEventListener('message', messageEventHandler);

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
          <li> Create google <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"> credentials </a>  <span>&#x2192;</span> "OAuth client ID"  <span>&#x2192;</span>  "Web application" <span>&#x2192;</span> "Authorized redirect URIs: https://www.demo.igrate.ai"  <span>&#x2192;</span> "Create" 
          </li>
          <li> Download json credentials, copy json content below and hit Authenticate
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

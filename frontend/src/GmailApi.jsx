// GmailApi.jsx
import { useState, useEffect } from "react";
const API_URL = "http://localhost:7000";

const GmailApi = ({sessionID }) => {
  const [gmailAuthenticated, setGmailAuthenticated] = useState(false);
  const [showGmailEmoji, setGmailEmoji] = useState(false);
  const [isAuthenticating, setisAuthenticating] = useState(false);

  useEffect(() => {
    // Only call on the redirect URI page
    if (window.location.pathname === "/oauth2/callback") {
      handleOAuthCallback();
    }
  }, []);

  async function generatePKCE() {
    const encoder = new TextEncoder();

    // Generate random 32-byte code_verifier
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const verifier = btoa(String.fromCharCode(...randomBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // SHA256 hash for code_challenge
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return { verifier, challenge };
  }

const handleGmailAuthenticate = async () => {
    const jsonCredentials = document.getElementById("gmailJsonInput").value;
    setisAuthenticating(true);
    setGmailEmoji(true); 
    localStorage.removeItem("gmail_authenticated");
    localStorage.setItem("jsonCredentials", jsonCredentials);
    localStorage.setItem("sessionID", sessionID);
    const credentials = JSON.parse(jsonCredentials);
    try {
      const { verifier, challenge } = await generatePKCE();

      // Save code_verifier in localStorage (or memory) to use after redirect
      localStorage.setItem("pkce_verifier", verifier);

      // Replace these with your credentials
      const scope = "https://mail.google.com/";

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: credentials.web.client_id,
        redirect_uri: credentials.web.redirect_uris[0],
        response_type: "code",
        scope: scope,
        access_type: "offline",
        code_challenge: challenge,
        code_challenge_method: "S256",
        prompt: "consent",
      })}`;

    // Open popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      authUrl,
      "gmail-oauth",
      `width=${width},height=${height},top=${top},left=${left}`
    );
 
    // Poll localStorage for result
    const poll = setInterval(() => {
      const authJSON = localStorage.getItem("gmail_authenticated");
      if (authJSON) {
        const isAuthenticated = JSON.parse(authJSON);
        // Update UI 
        setisAuthenticating(false);
        setGmailAuthenticated(!!isAuthenticated);
        // Clean up
        localStorage.removeItem("gmail_authenticated");
        clearInterval(poll);
       // popup.close();
      }
    }, 500);

    } catch (err) {
      console.error("Error starting PKCE OAuth:", err);
    }
  };

async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return console.error("No code found in URL");

    const verifier = localStorage.getItem("pkce_verifier");
    if (!verifier) return console.error("No PKCE verifier found");

    // Now exchange code for tokens
    const credentials = JSON.parse(localStorage.getItem("jsonCredentials"));
    const clientId = credentials.web.client_id;
    const client_secret = credentials.web.client_secret;
    const redirectUri = credentials.web.redirect_uris[0];

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: client_secret,
        code: code,
        code_verifier: verifier,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();
    let accessToken = tokens.access_token;

    const sessionID = localStorage.getItem("sessionID");
    // Tokens include: access_token, refresh_token, expires_in, etc.
    // You can now use the access_token to access Gmail APIs
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
          const success = !!data.success;
          localStorage.setItem("gmail_authenticated", JSON.stringify(success));
        } else {
          localStorage.setItem("gmail_authenticated", JSON.stringify(false));
        }
        // Close popup
        window.close();
      } catch (error) {
        localStorage.setItem("gmail_authenticated", JSON.stringify("false"));
        window.close();
        return console.error("Error while sending access token to server:", error);
      }
  };

  return (
    <div className="api-container">
      <div className="api-heading">
        <h2>Gmail</h2>
      </div>
      <div className="api-content">         
        <div className="bullet-points-container">
          <li> Create google <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"> credentials </a>  <span>&#x2192;</span> "OAuth client ID"  <span>&#x2192;</span>  "Web application" <span>&#x2192;</span> "Authorized redirect URIs: http://localhost:5173/oauth2/callback"  <span>&#x2192;</span> "Create" 
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
            gmailAuthenticated ? (
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
        ) : (  <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailApi;

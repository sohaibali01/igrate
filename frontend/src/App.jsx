import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [openAIAuthenticated, setOpenAIAuthenticated] = useState(false);
  const [showOpenAIEmoji, setOpenAIEmoji] = useState(false);
  const [gmailAuthenticated, setGmailAuthenticated] = useState(false);
  const [showGmailEmoji, setGmailEmoji] = useState(false);
  const [slackAuthenticated, setSlackAuthenticated] = useState(false);
  const [showSlackEmoji, setSlackEmoji] = useState(false);
  const [hubspotAuthenticated, setHubspotAuthenticated] = useState(false);
  const [showHubspotEmoji, setHubspotEmoji] = useState(false);

  const chat = async (e, message) => {
    e.preventDefault();

    if (!message) return;
    setIsTyping(true);
    scrollTo(0, 1e10);

    let msgs = chats;
    msgs.push({ role: "user", content: message });
    setChats(msgs);

    let msgCopy = message;
    setMessage("");

    fetch("http://localhost:8000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify( {message: msgCopy}),
    })
      .then((response) => response.json())
      .then((data) => {
        msgs.push(data.output);
        setChats(msgs);
        setIsTyping(false);
        scrollTo(0, 1e10);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleFileUpload = (e) => {
    // Handle multiple file upload logic here
    const files = e.target.files;
    console.log('Files uploaded:', files);
  };

  const handleOpenAIAuthenticate = () => {
    if (!openAIAuthenticated) {
      setOpenAIAuthenticated(true);
      setOpenAIEmoji(true); // Show thumbs-up on the first authentication
    }
    else setOpenAIAuthenticated(false);
  };

  const handleGmailAuthenticate = () => {
    if (!gmailAuthenticated) {
      setGmailAuthenticated(true);
      setGmailEmoji(true); // Show thumbs-up on the first authentication
    }
    else setGmailAuthenticated(false);
  };

  const handleSlackAuthenticate = () => {
    if (!slackAuthenticated) {
      setSlackAuthenticated(true);
      setSlackEmoji(true); // Show thumbs-up on the first authentication
    }
    else setSlackAuthenticated(false);
  };

  const handleHubspotAuthenticate = () => {
    if (!hubspotAuthenticated) {
      setHubspotAuthenticated(true);
      setHubspotEmoji(true); // Show thumbs-up on the first authentication
    }
    else setHubspotAuthenticated(false);
  };

  const handleOpenAIJsonInputChange = (e) => {
    // Handle JSON input change logic here
    // You can use e.target.value to get the input value
  };

  const handleGmailJsonInputChange = (e) => {
    // Handle JSON input change logic here
    // You can use e.target.value to get the input value
  };

  const handleSlackJsonInputChange = (e) => {
    // Handle JSON input change logic here
    // You can use e.target.value to get the input value
  };

  const handleHubspotJsonInputChange = (e) => {
    // Handle JSON input change logic here
    // You can use e.target.value to get the input value
  };

  return (
    <div className="container">
    <h1>
      <span className="logo">iGrate</span>
    </h1>

      <div className="horizontal-container">
        <div className="api-container">
            <div className="api-heading">
              <h2>Gmail</h2>
            </div>
            <div className="api-content">         
              <div className="bullet-points-container">
                <li> Create <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"> credentials </a> in google using OAuth 2.0 Client IDs (for desktop clients)
                </li>
                <li> Download the credentials, copy the json content below and hit Authenticate
                </li>
              </div>
              <input
                  type="text"
                  placeholder="Enter json credentials ..."
                  onChange={handleGmailJsonInputChange}
                />
            </div>
            <div className="authentication-container">
              <button
                className="styled-button"
                onClick={handleGmailAuthenticate}
              > Authenticate
              </button>
                <div className="emoji-buttons">
                  {showGmailEmoji && gmailAuthenticated ? (
                    <button className="thumbs-up">
                      <span>&#10060;</span>
                    </button>
                  ) : (
                    <button className="thumbs-down">
                    <span>&#128077;&#127997;</span>
                    </button>
                  )}
                </div>
          </div>
        </div>
        <div className="api-container">
            <div className="api-heading">
              <h2>Slack</h2>
            </div>
            <div className="api-content">         
              <div className="bullet-points-container">
                <li> Create your slack <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer"> app </a>
                </li>
                <li> Select your app <span>&#x2192;</span> "OAuth & Permissions" <span>&#x2192;</span> "User Token Scopes" <span>&#x2192;</span> select your scopes <span>&#x2192;</span> "Reinstall to workspace" <span>&#x2192;</span> paste token below and hit Authenticate
                </li>
              </div>
              <input
                  type="text"
                  placeholder="Enter api key ..."
                  onChange={handleSlackJsonInputChange}
                />
            </div>
            <div className="authentication-container">
              <button
                className="styled-button"
                onClick={handleSlackAuthenticate}
              > Authenticate
              </button>
                <div className="emoji-buttons">
                  {showSlackEmoji && slackAuthenticated ? (
                    <button className="thumbs-up">
                      <span>&#10060;</span>
                    </button>
                  ) : (
                    <button className="thumbs-down">
                    <span>&#128077;&#127997;</span>
                    </button>
                  )}
                </div>
          </div>
        </div>
        <div className="api-container">
            <div className="api-heading">
              <h2>Hubspot</h2>
            </div>
            <div className="api-content">         
              <div className="bullet-points-container">
                <li> Create your hubspot <a href="https://developers.hubspot.com/docs/api/private-apps" target="_blank" rel="noopener noreferrer"> app </a>
                </li>
                <li> Login to your hubspot account <span>&#x2192;</span> Settings <span>&#x2192;</span> Integration <span>&#x2192;</span> Private apps <span>&#x2192;</span> select app <span>&#x2192;</span> paste access token below and hit Authenticate
                </li>
              </div>
              <input
                  type="text"
                  placeholder="Enter api key ..."
                  onChange={handleHubspotJsonInputChange}
                />
            </div>
            <div className="authentication-container">
              <button
                className="styled-button"
                onClick={handleHubspotAuthenticate}
              > Authenticate
              </button>
                <div className="emoji-buttons">
                  {showHubspotEmoji && hubspotAuthenticated ? (
                    <button className="thumbs-up">
                      <span>&#10060;</span>
                    </button>
                  ) : (
                    <button className="thumbs-down">
                    <span>&#128077;&#127997;</span>
                    </button>
                  )}
                </div>
          </div>
        </div>
      </div>

      <div className="columns-container">
        <div className="api-container">
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
                  onChange={handleOpenAIJsonInputChange}
                />
            </div>
            <div className="authentication-container">
              <button
                className="styled-button"
                onClick={handleOpenAIAuthenticate}
              > Authenticate
              </button>
                <div className="emoji-buttons">
                  {showOpenAIEmoji && openAIAuthenticated ? (
                    <button className="thumbs-up">
                      <span>&#10060;</span>
                    </button>
                  ) : (
                    <button className="thumbs-down">
                    <span>&#128077;&#127997;</span>
                    </button>
                  )}
                </div>
          </div>
        </div>
        <div className="right-column">
          <main>
            <section>
              {chats && chats.length
                ? chats.map((chat, index) => (
                    <p key={index} className={chat.role === 'user' ? 'user_msg' : 'assistant_msg'}>
                      <span>
                        <b>{chat.role.toUpperCase()}</b>
                      </span>
                      <span>:</span>
                      <span>{chat.content}</span>
                    </p>
                  ))
                : ''}
            </section>

            <div className={isTyping ? '' : 'hide'}>
              <p>
                <i>{isTyping ? 'Thinking...' : ''}</i>
              </p>
            </div>

            <form action="" onSubmit={(e) => chat(e, message)}>
              <input
                type="text"
                name="message"
                value={message}
                placeholder="Type a message here and hit Enter..."
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="send-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
              <label htmlFor="file-upload" className="file-upload-label">
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  multiple
                />
                 📂 Upload Files
              </label>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

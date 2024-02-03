import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
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

  const handleAuthenticate = () => {
    setAuthenticated(true);
  };

  const handleJsonInputChange = (e) => {
    // Handle JSON input change logic here
    // You can use e.target.value to get the input value
  };

  return (
    <div className="container">
    <h1>
      <span className="logo">iGrate</span>
    </h1>

      <div className="horizontal-container">
        <div className="sub-container">
          <h2>Sub-container 1</h2>
          <p>Content for sub-container 1</p>
        </div>
        <div className="sub-container">
          <h2>Sub-container 2</h2>
          <p>Content for sub-container 2</p>
        </div>
        <div className="sub-container">
          <h2>Sub-container 3</h2>
          <p>Content for sub-container 3</p>
        </div>
      </div>

      <div className="columns-container">
      <div className="left-container">
          <div className="left-heading">
            <h2>OpenAI</h2>
          </div>
          <div className="left-content">         
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
                onChange={handleJsonInputChange}
              />
          </div>
          <button className={`styled-button ${authenticated ? 'authenticated' : ''}`} onClick={handleAuthenticate}>
            Authenticate
            {authenticated && <span className="thumbs-up">👍</span>}
          </button>
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

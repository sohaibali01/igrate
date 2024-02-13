import { useState } from "react";
import "./App.css";
import GmailApi from "./GmailApi"; 
import OpenAIApi from "./OpenAIApi"
import HubspotApi from "./HubspotApi"; 
import SlackApi from "./SlackApi";
import Duplex from 'stream';

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [openAIAuthenticated, setOpenAIAuthenticated] = useState(false);
  const [fileList, setFileList] = useState([]);

  const animateOpenAIContainer = async () => {
      // Trigger hovering effect on OpenAIApi container
      const openAIApiContainer = document.querySelector(".openai-container");
      openAIApiContainer.classList.add("hover-effect");
      setTimeout(() => {
        openAIApiContainer.classList.remove("hover-effect");
      }, 3000);
  }

  const chat = async (e, message) => {
    e.preventDefault();

    if (!openAIAuthenticated) {
      animateOpenAIContainer();
      return;
    }

    if (!message) return;
    setIsTyping(true);
    scrollTo(0, 1e10);

    let msgs = chats;
    msgs.push({ role: "user", content: message });
    setChats(msgs);

    let msgCopy = message;
    setMessage("");

    fetch("http://localhost:8000/chat", {
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
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const response = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });
  
    if (response.ok) {
      const data = await response.json();
      console.log(data.success);
    } else {
      console.error('Failed to upload files');
    }
};

  return (
    <div className="container">
      <h1>  <span className="logo">iGrate</span>   </h1>
      <div className="horizontal-container">
        <GmailApi />
        <SlackApi />
        <HubspotApi />
      </div>

      <div className="columns-container">
        <OpenAIApi 
         id="openAIContainer"
         openAIAuthenticated={openAIAuthenticated}
         setOpenAIAuthenticated={setOpenAIAuthenticated}
        />
        <div className="file-list" id="file-list">
          {fileList.map((fileName, index) => (
            <div key={index} className="file-item">
              <span className="file-icon">📂</span>
              <span>{fileName}</span>
            </div>
          ))}
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
                id="inputMessageBox"
                name="message"
                value={message}
                placeholder="Type a message here and hit Enter..."
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="send-button" onClick={(e) => chat(e, document.getElementById("inputMessageBox").value)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
              {openAIAuthenticated ? (
              <label htmlFor="file-upload" className="file-upload-label">
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  multiple
                />
                 📂 Upload Files
              </label>            ) : (
            <></>)}
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

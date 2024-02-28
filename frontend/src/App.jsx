
// App.jsx

import { useState, useEffect } from "react";
import "./App.css";
import GmailApi from "./GmailApi"; 
import OpenAIApi from "./OpenAIApi"
import HubspotApi from "./HubspotApi"; 
import SlackApi from "./SlackApi";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [openAIAuthenticated, setOpenAIAuthenticated] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [sessionID, setSessionID] = useState("");

  useEffect( () => {
    console.log("session: ", sessionID);
    if (sessionID==="")
    {
    // Function to be called when the component mounts (similar to window.onload)
    const initialize = async () => {
      try {
        // Make a GET request to initiate session when component mounts
        const response = await fetch('https://excited-lionfish-talented.ngrok-free.app/open', {
          method: 'POST',
          body:  new FormData(),
        });
        const data = await response.json();
        console.log('Session ID:', data.sessionID);
        setSessionID(data.sessionID);
        // Use the session ID received from the backend as needed
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // Call the initialize function
    initialize();
  }
  const handleBeforeUnload = async (event) => {
    event.preventDefault(); // Cancel the event to ensure prompt is shown

    try {
      // const formData = new FormData();
      // formData.append('sessionID', sessionID);
      const response = await fetch('https://excited-lionfish-talented.ngrok-free.app/close', {
        headers: {
          "Content-Type": "application/json",
        },
        method: 'POST',
        body: JSON.stringify({sessionID: sessionID }),
      });
      console.log('Backend notified about page closing');
    } catch (error) {
      console.error('Error notifying backend:', error);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [sessionID]);

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

    if (isTyping) {
      fetch("https://excited-lionfish-talented.ngrok-free.app/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify( {sessionID: sessionID}),
      })
        .then((response) => response.json())
        .then((data) => {
          setIsTyping(!data.isCompleted);
        })
        .catch((error) => {
          console.log(error);
        });
      }
    else 
    {
      if (!message) return;

      setIsTyping(true);
      scrollTo(0, 1e10);

      let msgs = chats;
      msgs.push({ role: "user", content: message });
      setChats(msgs);

      let msgCopy = message;
      setMessage("");

      fetch("https://excited-lionfish-talented.ngrok-free.app/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify( {sessionID: sessionID, message: msgCopy}),
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
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    const formData = new FormData();
    formData.append('sessionID', sessionID);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const response = await fetch("https://excited-lionfish-talented.ngrok-free.app/upload", {
      method: "POST",
      body: formData,
    });
  
    if (response.ok) {
      const data = await response.json();
          // Extract filenames from e.target.files directly
      const uploadedFiles = Array.from(files).map(file => file.name);
      
      // Update fileList state to populate file-list with filenames
      setFileList(prevFileList => [...prevFileList, ...uploadedFiles])
    } else {
      console.error('Failed to upload files');
    }
};

  return (
    <div className="container">
      <h1>  <span className="logo">iGrate</span>   </h1>
      <div className="horizontal-container">
        <GmailApi sessionID={sessionID} />
        <SlackApi sessionID={sessionID}  />
        <HubspotApi sessionID={sessionID}  />
      </div>

      <div className="columns-container">
        <div className="left-column">
          <OpenAIApi 
          id="openAIContainer"
          openAIAuthenticated={openAIAuthenticated}
          setOpenAIAuthenticated={setOpenAIAuthenticated}
          sessionID={sessionID}
          />
          {fileList.length > 0 && (
          <div className="openai-container" id="file-list">
            <div className="api-heading">
              <h2>Files</h2>
            </div>
            {fileList.map((fileName, index) => (
              <div key={index} className="file-item">
                <span> &#128188; </span>
                <span>{fileName}</span>
              </div>
            ))}
          </div>
            )}
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

            <form action="" onSubmit={(e) => chat(e, message)}>
              <input
                type="text"
                id="inputMessageBox"
                name="message"
                value={message}
                placeholder="Enter message here ..."
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className={`send-button ${isTyping ? 'stop-animation' : ''}`} // Add stop-animation class when isTyping is true
                onClick={(e) => chat(e, document.getElementById("inputMessageBox").value)}
              >
                {isTyping ? ( // Conditional rendering of SVG based on isTyping state
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
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

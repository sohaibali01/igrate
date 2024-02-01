import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

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

  return (
    <div className="container">
      <h1>FullStack Chat AI Tutorial</h1>

      <div className="columns-container">
        <div className="left-column">
          <div className="button-container">
            <button>Click Me</button>
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
              <label htmlFor="file-upload" className="file-upload-label">
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  multiple // Allow multiple file selection
                />
                📎 Upload Files
              </label>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

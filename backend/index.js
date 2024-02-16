import express from "express";
// import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import { AutomationAgent } from './automation_agent.js';

const storage = multer.memoryStorage(); // Use memory storage to keep files in memory
const upload = multer({ storage: storage });

const app = express();
const port = 8000;
app.use(express.json());
app.use(cors());

// // Set timeout to 30 seconds (adjust as needed)
// const TIMEOUT_DURATION = 30000;

// // Add timeout middleware
// app.use((req, res, next) => {
//   req.setTimeout(TIMEOUT_DURATION, () => {
//     console.error('Request timed out');
//     res.status(504).send('Request timed out');
//   });
//   res.setTimeout(TIMEOUT_DURATION, () => {
//     console.error('Response timed out');
//     res.status(504).send('Response timed out');
//   });
//   next();
// });

let agent = {};

// Function to generate a random session ID
function generateSessionID() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Route to handle starting a new session or container for each new user
app.get("/open", async (req, res) => {
  try {
    // Start a new session or container for the user
    // This could involve spawning a new Docker container or any other initialization steps
    // Here, let's assume a simple response indicating successful session initiation
    let sessionID = generateSessionID();
    console.log("get /: ", sessionID);
    agent[sessionID] = new AutomationAgent();
    res.json({ success: true, sessionID: sessionID });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ success: false});
  }
});

app.post("/close", async (req, res) => {
  try {
    delete agent[req.body.sessionID];
    console.log("deleted:", req.body.sessionID);
    res.json({ success: true });
    
  } catch (error) {
    console.error("Error closing session:", error);
    res.status(500).json({ success: false});
  }
});

app.post('/upload', upload.array('files'), async (req, response) => {
  if (!req.files) {
    return response.status(400).json({
      success: false
    });
  }
  console.log(req.body.sessionID);
  try {
    let fileIds = [];
    await Promise.all(req.files.map(async file => {
      const filePath = `./temp/${file.originalname}`;
      if (!fs.existsSync("./temp")) {
        // If it doesn't exist, create the directory
        fs.mkdirSync("./temp");
      }
      fs.writeFileSync(filePath, file.buffer);

      // Read each file from disk as a stream and construct the byte array
      const readStream = fs.createReadStream(filePath);
      let uploadedFile = await agent[req.body.sessionID].openAIClient.gptClient.files.create({
        file: readStream,
        purpose: 'assistants',
      });
      fs.unlinkSync(filePath);
      fileIds.push(uploadedFile.id);
    }));

    // Do something with the byte array, like saving to a file or processing it further
    await agent[req.body.sessionID].openAIClient.gptClient.beta.assistants.update(agent[req.body.sessionID].assistants["file"].assistant.id, { file_ids: fileIds });

    response.json({
      success: true,
    });
  } catch (error) {
    console.error("Error during upload:", error);
    response.status(500).json({
      success: false
    });
  }
});

app.post("/authenticate/slack", async (request, response) => {
  const  credentials  = request.body.credentials;
  try {
    let isauthenticated = await agent[request.body.sessionID].slackClient.authorize(credentials);
    response.json({
      success: isauthenticated,
    });
  } catch (error) {
    console.error("Error during Slack authentication:", error);
    response.status(500).json({
      success: false
    });
  }
});

app.post("/authenticate/hubspot", async (request, response) => {
  const  credentials  = request.body.credentials;
  try {
    let isauthenticated = await agent[request.body.sessionID].hubspotClient.authorize(credentials);
    response.json({
      success: isauthenticated,
    });
  } catch (error) {
    console.error("Error during Hubspot authentication:", error);
    response.status(500).json({
      success: false
    });
  }
});

app.post("/authenticate/gmail", async (request, response) => {
  const  credentials  = request.body.credentials;
  try {
    let isauthenticated = await agent[request.body.sessionID].gmailClient.authorize(credentials);
    response.json({
      success: isauthenticated,
    });
  } catch (error) {
    console.error("Error during Gmail authentication:", error);
    response.status(500).json({
      success: false
    });
  }
});

app.post("/authenticate/openai", async (request, response) => {
  try {
    let isauthenticated = await agent[request.body.sessionID].openAIClient.authorize(request.body.credentials);
    if (isauthenticated){ await agent[request.body.sessionID].create(); 
    response.json({
      success: isauthenticated,
     // assistant_file_id: agent.assistants["file"].assistant.id,
    });
  }
  else
  {
    response.json({
      success: false
    });
  }
  } catch (error) {
    console.error("Error during OpenAI authentication:", error);
    response.status(500).json({
      success: false
    });
  }
});

app.post("/chat", async (request, response) => {
  let msg;
  try 
  { 
    let jsonPrompt = `{"task":"${request.body.message}"}`;
    await agent[request.body.sessionID].processPrompt(jsonPrompt, null);
    msg = {role: "Global Assistant", content: agent[request.body.sessionID].messages[agent[request.body.sessionID].messages.length - 1][3].reverse()[0]};
    response.json({
      output: msg,
    });
  }
  catch(e)
  {
    msg = {role: "Global Assistant", content: e.toString()};
    response.json({
      output: msg,
    });
  }
  console.log(msg);
});

app.post("/stop", async (request, response) => {
  try 
  { 
    let runs = {};
    for (const appname in agent[request.body.sessionID].apps) {
      console.log(appname, agent[request.body.sessionID].assistants[appname].run);
      if (typeof agent[request.body.sessionID].assistants[appname].run !== 'undefined') {
        runs[appname]  = await agent[request.body.sessionID].openAIClient.gptClient.beta.threads.runs.retrieve( agent[request.body.sessionID].assistants[appname].thread.id,  agent[request.body.sessionID].assistants[appname].run.id);
        console.log(runs[appname].status);
        if ( runs[appname].status ==="queued" || runs[appname].status ==="in_progress" ||  runs[appname].status ==="requires_action")
            runs[appname]  = await agent[request.body.sessionID].openAIClient.gptClient.beta.threads.runs.cancel( agent[request.body.sessionID].assistants[appname].thread.id,  agent[request.body.sessionID].assistants[appname].run.id);
      }
    }
  
    while (true)  {
      await new Promise(resolve => setTimeout(resolve, 150));
      let completed = true;
      for (const appname in agent[request.body.sessionID].apps) {
        if (typeof agent[request.body.sessionID].assistants[appname].run !== 'undefined') {
          runs[appname] = await agent[request.body.sessionID].openAIClient.gptClient.beta.threads.runs.retrieve( agent[request.body.sessionID].assistants[appname].thread.id,  agent[request.body.sessionID].assistants[appname].run.id);
          if ( runs[appname].status ==="queued" || runs[appname].status ==="in_progress" ||  runs[appname].status ==="requires_action" ||  runs[appname].status ==="cancelling" ){
            completed=false;
            break;
          }
        }
      }
      if (completed) break;
  }
  response.json({
    isCompleted: true,
  });
  }
  catch(e)
  {
    console.log(e.toString());
    response.json({
      isCompleted: false,
    });
  }
});


app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

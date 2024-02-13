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

// Set timeout to 30 seconds (adjust as needed)
const TIMEOUT_DURATION = 30000;

// Add timeout middleware
app.use((req, res, next) => {
  req.setTimeout(TIMEOUT_DURATION, () => {
    console.error('Request timed out');
    res.status(504).send('Request timed out');
  });
  res.setTimeout(TIMEOUT_DURATION, () => {
    console.error('Response timed out');
    res.status(504).send('Response timed out');
  });
  next();
});

let agent = new AutomationAgent();

app.post('/upload', upload.array('files'), async (req, response) => {
  if (!req.files) {
    return response.status(400).json({
      success: false
    });
  }

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
      let uploadedFile = await agent.openAIClient.gptClient.files.create({
        file: readStream,
        purpose: 'assistants',
      });
      fileIds.push(uploadedFile.id);
    }));

    // Do something with the byte array, like saving to a file or processing it further
    await agent.openAIClient.gptClient.beta.assistants.update(agent.assistants["file"].assistant.id, { file_ids: fileIds });

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
  const { credentials } = request.body;
  try {
    let isauthenticated = await agent.slackClient.authorize(credentials);
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
  const { credentials } = request.body;
  try {
    let isauthenticated = await agent.hubspotClient.authorize(credentials);
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
  const { credentials } = request.body;
  try {
    let isauthenticated = await agent.gmailClient.authorize(credentials);
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
  const { credentials } = request.body;
  try {
    let isauthenticated = await agent.openAIClient.authorize(credentials);
    if (isauthenticated){ await agent.create(); 
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
    await agent.processPrompt(jsonPrompt, null);
    msg = {role: "Global Assistant", content: agent.messages[agent.messages.length - 1][3].reverse()[0]};
  }
  catch(e)
  {
    msg = {role: "Global Assistant", content: e.toString()};
  }
  response.json({
    output: msg,
  });

});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

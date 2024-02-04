import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { AutomationAgent } from './automation_agent.js';

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());

const agent = new AutomationAgent();

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
    if (isauthenticated) await agent.create();
    response.json({
      success: isauthenticated,
    });
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

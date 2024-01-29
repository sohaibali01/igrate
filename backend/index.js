import { OpenAI } from 'openai';
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { AutomationAgent } from './automation_agent.js';

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());

const agent = new AutomationAgent();
await agent.create();

//const openai = new OpenAI({apiKey:'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'});

app.post("/", async (request, response) => {
  let jsonPrompt = `{"task":"${request.body.message}"}`;
  await agent.processPrompt(jsonPrompt, null);

  let msg = {role: "Gloabl Assistant", content: agent.messages[agent.messages.length - 1][3].reverse()[0]};
  response.json({
    output: msg,
  });

});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

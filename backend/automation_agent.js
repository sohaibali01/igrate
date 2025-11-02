import { GptAssistant, OpenAIClient } from './client_gpt.js';
import { HubspotClient } from './client_hubspot.js';
import { SlackClient } from './client_slack.js';
import { GmailClient } from './client_gmail.js';
import { readFileSync, createWriteStream, createReadStream} from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from "fs";
export class AutomationAgent {

    constructor(sessionID) {

      this.logStream = createWriteStream("./logs/session_"+sessionID + ".txt", {flags:'a'});
      this.gmailClient = new GmailClient();
      this.slackClient = new SlackClient();
      this.hubspotClient = new HubspotClient();
      this.openAIClient = new OpenAIClient();

      this.apps = {
        global: "Your goal is to store data and assist user in general queries and interaction with different computer applications. If the user wants you to perform some action with computer applications, only then call provided functions in a specific order to achieve given task.",
        slack: "Your goal is to assist user in interaction with slack api.",
        hubspot: "Your goal is to perform queries with hubspot CRM.",
        gmail: "Your goal is to assist user in general queries and email communication using gmail api. Figure out dependency between function parameters first and then call the provided functions in a specific order to complete the given task. Do not call functions in parallel or use functions that are not given to you",
        };

      this.messages = [];
      this.lastAssistantMessage = "";

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);

      this.functionsApp = {};
      for (const appname in this.apps) {
        this.functionsApp[appname] = JSON.parse(readFileSync(__dirname+`/functions_${appname}.json`, 'utf-8'));
      }
    }

    async uploadLogFile(){
      if (typeof this.openAIClient.gptClient === 'undefined')
        return;

      this.logStream.end();
      await this.openAIClient.gptClient.files.create({
          file: createReadStream(this.logStream.path),
          purpose: 'assistants',
      });
    }

    async create(){
      this.assistants = {};
      const threadIds = {};
      for (const appname in this.apps) {
        this.assistants[appname] = new GptAssistant();
        await this.assistants[appname].create(this.functionsApp[appname],   appname, this.apps[appname], this.openAIClient);
        threadIds[appname] = this.assistants[appname].thread.id;
      }
      for (const agentType in this.assistants) {
        if (agentType !== "global") {
          this.assistants[agentType].setThreadIds(threadIds);
        }
      }
    }

    async processPrompt(task, agentType) {
      if (agentType === null) {
          await this.processPrompt( task, agentType = "global" );
          return;
      }
      this.logStream.write(`${agentType}: ${task}` + "\n");
      await this.assistants[agentType].callAssistant(task);
      
      let apiMessages = [];
      let currentResponse = this.assistants[agentType].response;
      this.logStream.write(`${JSON.stringify(currentResponse)}` + "\n");

      let imageApiMessage="";
      for (const toolCall of currentResponse.output) {
        if (toolCall.type === "image_generation_call") {
          imageApiMessage = await this.uploadImage(agentType, toolCall.result);
        }
      }    
      if (imageApiMessage!==""){
         currentResponse = await this.assistants[agentType].openAIClient.gptClient.responses.create({  model: this.assistants[agentType].model, instructions: this.assistants[agentType].instructions, tools: this.assistants[agentType].newTools, conversation: this.assistants[agentType].thread.id, input: [{role: "developer", content : imageApiMessage}]});
      }

      let count = await this.getNumberOfFuncCalls(currentResponse.output);
      while (count > 0) {
        let toolOutputs = [];
        for (const toolCall of currentResponse.output) {
          if (toolCall.type === "function_call") {
            let functionCalled = toolCall.name;
            this.logStream.write(`${agentType}:  called ${functionCalled}` + "\n");
            let success, apiMessage;
            if (agentType === 'global' && this.functionsApp['global'].some(name => name.name === functionCalled)) {
                await this.processPrompt(toolCall.arguments, functionCalled );
                apiMessage = this.lastAssistantMessage;
            } 
            else if (this.functionsApp[agentType].some(name => name.name === functionCalled)) {
                const appName = functionCalled.split('_')[0];
                if (appName === 'hubspot') {
                   this.logStream.write(`${JSON.stringify(toolCall)}: + \n`);
                   this.logStream.write(`${task}: + \n`);
                   this.logStream.write(`${JSON.stringify(this.functionsApp[appName])}: + \n`);
                    [success, apiMessage] = await this.hubspotClient.callHubspotAPI(toolCall,task, this.functionsApp[appName]);
                } else if (appName === 'slack') {
                    [success, apiMessage] = await this.slackClient.callSlackAPI(toolCall, this.functionsApp[appName]);
                } else if (appName === 'gmail') {
                    [success, apiMessage] = await this.gmailClient.callGmailAPI(toolCall, this.functionsApp[appName]);
                } else {
                    [success, apiMessage] = [false, "Operation Failed: External function calling not allowed. Only use functions that are explicitly provided by the user"];
                }
                this.logStream.write(`${agentType}:  respsonded ${apiMessage}` + "\n");
            }
            else {
              [success, apiMessage] = [false, "Operation Failed: External function calling not allowed. Only use functions that are explicitly provided by the user"];
              this.logStream.write(`${agentType}:  respsonse failing ${apiMessage}` + "\n");
            }
            toolOutputs.push({type: "function_call_output", call_id: toolCall.call_id, output: apiMessage });
            apiMessages.push(apiMessage);
          }
          this.logStream.write(`${agentType}:  generating response` + "\n");
          currentResponse = await this.assistants[agentType].openAIClient.gptClient.responses.create({  model: this.assistants[agentType].model, instructions: this.assistants[agentType].instructions, tools: this.assistants[agentType].newTools, conversation: this.assistants[agentType].thread.id, input: toolOutputs});
          this.logStream.write(`${agentType}:  completed response` + "\n");
          count = await this.getNumberOfFuncCalls(currentResponse.output);
          this.logStream.write(`${agentType}:  calls remaining ${count}` + "\n");
        }
      }
      await this.logMessages( agentType, apiMessages );
    }

    async getNumberOfFuncCalls(responseOutput){
      let i = 0;
      for (const toolCall of responseOutput) {
        if (toolCall.type === "function_call") {
            i++;
        }
      }
      return i;
    }

    async uploadImage(agentType, imageData){
        const buffer = Buffer.from(imageData, "base64");
        // 2️⃣ Write it temporarily to disk
        const filePath = "./temp_uploaded_image.png";
        if (!fs.existsSync("./temp")) {
          fs.mkdirSync("./temp");
        }
        fs.writeFileSync(filePath, buffer);
        // 3️⃣ Upload the image file to OpenAI
        const readStream = fs.createReadStream(filePath);
        const uploadedFile = await this.assistants[agentType].openAIClient.gptClient.files.create({
          file: readStream,
          purpose: "vision", // or "fine-tune" if you’re using it for another purpose
        });
        // 4️⃣ Clean up local file
        fs.unlinkSync(filePath);
        const fileUrl = `File uploaded successfully at the following link: https://platform.openai.com/storage/files/${uploadedFile.id}. Relay this messsage to the user`;
        return fileUrl;
    }

    async logMessages(agentType, apiMessages) {
       this.logStream.write(`${agentType}: logging` + "\n");
      const threadMessages = await this.openAIClient.gptClient.conversations.items.list(this.assistants[agentType].thread.id );

      const gptMessages = [];
      this.lastAssistantMessage = "";
      for (const msg of threadMessages.data) {
        if (msg.type === 'message') {
          if (msg.role === 'assistant') {
             this.logStream.write(`message is` + "\n");
             this.logStream.write(`${JSON.stringify(msg)}` + "\n");
              const gptOutput = await this.openAIClient.getAssistantMessage(msg, this.assistants[agentType].response.id);
              gptMessages.push(gptOutput);
              this.lastAssistantMessage += `\n${gptOutput}`;
          } 
          else {
              this.messages.push([agentType, apiMessages, msg.content[0].text, gptMessages]);
              break;
          }
        }
      }
      for (const msg of this.messages[this.messages.length - 1][3].reverse()) {
          this.logStream.write(`${agentType}: ${msg}` + "\n");
      }
  }

}

// let agent = new HubspotClient();
// let [textOk, textResponse] = await agent.callHTTPAPI('https://api.hubapi.com/crm/v3/objects/contacts?hs_object_type=contacts&limit=20', 'GET', {});
// console.log(textResponse);
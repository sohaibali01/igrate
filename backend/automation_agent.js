import { GptAssistant, gptClient, getAssistantMessage } from './client_gpt.js';
import { HubspotClient } from './client_hubspot.js';
import { SlackClient } from './client_slack.js';
import { GmailClient } from './client_gmail.js';
import { readFileSync } from 'fs';

class AutomationAgent {

  constructor() {
    this.gmailClient = new GmailClient();
    this.slackClient = new SlackClient();
    this.hubspotClient = new HubspotClient();
  }

  async create(){
    const apps = {
      global: "Your goal is to store data and assist user in general queries and interaction with different computer applications. If the user wants you to perform some action with computer applications, only then call provided functions in a specific order to achieve given task. In order to do that, figure out the data dependency between provided functions first before determining the order of function calling",
      slack: "Your goal is to assist user in interaction with slack api.",
      hubspot: "Your goal is to perform queries with hubspot CRM.",
      gmail: "Your goal is to assist user in general queries and email communication using gmail api. Figure out dependency between function parameters first and then call the provided functions in a specific order to complete the given task. Do not call functions in parallel or use functions that are not given to you",
      retrieval: "Your goal is to assist user in general queries, information retrieval and file handling operations"
    };

    await this.hubspotClient.authorize('pat-eu1-9da6d3a7-04fd-4a72-853c-3f5d239b805d');
    await this.slackClient.authorize('xoxp-6288430948499-6290981906052-6288597673954-b9bbf68869cbcc99958dd577c9a701b2');

    const CREDENTIALS_GMAIL = '{"web":{"client_id":"344920505144-tnh67ak9pt3vlk80j2tukskbc9kagsba.apps.googleusercontent.com","project_id":"apicomm","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["http://localhost:8080"]}}';
    await this.gmailClient.authorize(CREDENTIALS_GMAIL);

    this.messages = [];
    this.lastAssistantMessage = "";

    this.functionsApp = {};
    for (const appname in apps) {
      this.functionsApp[appname] = JSON.parse(readFileSync(`functions_${appname}.json`, 'utf-8'));
    }

    this.assistants = {};
    this.localApps = [];
    const threadIds = {};

    for (const appname in apps) {
      this.assistants[appname] = new GptAssistant();
      await this.assistants[appname] .create(this.functionsApp[appname],   appname, apps[appname] );
      threadIds[appname] = this.assistants[appname].thread.id;
      if (appname !== 'global') {
        this.localApps.push(appname);
      }
    }

    for (const agentType in this.assistants) {
      if (agentType !== "global") {
        this.assistants[agentType].setThreadIds(threadIds);
      }
    }
  }

    async processPrompt(task, agentType = null) {
      if (agentType === null) {
          await this.processPrompt( task, agentType = "global" );
          return;
      }
      await this.assistants[agentType].callAssistant(task);
      const apiMessages = [];
      this.assistants[agentType].runRetreived = await gptClient.beta.threads.runs.retrieve( this.assistants[agentType].thread.id,  this.assistants[agentType].run.id);
      while (this.assistants[agentType].runRetreived.status === "requires_action") {
          const toolCalls = this.assistants[agentType].runRetreived.required_action.submit_tool_outputs.tool_calls;
          const toolOutputs = [];
          for (const toolCall of toolCalls) {
              let functionCalled = toolCall.function.name;
              let success, apiMessage;
              if (functionCalled ==='multi_tool_use.parallel')
                  [success, apiMessage] = [false, "Operation Failed: Calling functions in parallel is not allowed. Use sequential function calling"]
              else if (agentType === 'global' && this.functionsApp['global'].some(name => name.function.name === functionCalled)) {
                  await this.processPrompt(toolCall.function.arguments, functionCalled );
                  apiMessage = this.lastAssistantMessage;
              } 
              else if (this.functionsApp[agentType].some(name => name.function.name === functionCalled)) {
                  const appName = functionCalled.split('_')[0];
                  if (appName === 'hubspot') {
                      [success, apiMessage] = await this.hubspotClient.callHubspotAPI(toolCall,task, this.functionsApp[appName]);
                  } else if (appName === 'slack') {
                      [success, apiMessage] = await this.slackClient.callSlackAPI(toolCall, this.functionsApp[appName]);
                  } else if (appName === 'gmail') {
                      [success, apiMessage] = await this.gmailClient.callGmailAPI(toolCall, this.functionsApp[appName]);
                  } else {
                      [success, apiMessage] = [false, "Operation Failed: External function calling not allowed. Only use functions that are explicitly provided by the user"];
                  }
              }
              else {
                [success, apiMessage] = [false, "Operation Failed: External function calling not allowed. Only use functions that are explicitly provided by the user"];
              }
              toolOutputs.push({ tool_call_id: toolCall.id, output: apiMessage });
              apiMessages.push(apiMessage);
          }
          await gptClient.beta.threads.runs.submitToolOutputs(this.assistants[agentType].thread.id, this.assistants[agentType].run.id, {tool_outputs: toolOutputs} );
          this.assistants[agentType].runRetreived = await gptClient.beta.threads.runs.retrieve(this.assistants[agentType].thread.id,  this.assistants[agentType].run.id);
          while (this.assistants[agentType].runRetreived.status === 'in_progress' || this.assistants[agentType].runRetreived.status === 'queued') {
              await new Promise(resolve => setTimeout(resolve, 150));
              this.assistants[agentType].runRetreived = await gptClient.beta.threads.runs.retrieve( this.assistants[agentType].thread.id, this.assistants[agentType].run.id);              await new Promise(resolve => setTimeout(resolve, 150));
          }
          this.assistants[agentType].runRetreived = await gptClient.beta.threads.runs.retrieve( this.assistants[agentType].thread.id,  this.assistants[agentType].run.id);
      }
 
      await this.logMessages( agentType, apiMessages );
  }

    async logMessages(agentType, apiMessages) {
      const threadMessages = await gptClient.beta.threads.messages.list(this.assistants[agentType].thread.id );
      if (threadMessages.data.length < 2 || this.assistants[agentType].runRetreived.status !== 'completed') {
          console.log(`WTF!, status: ${this.assistants[agentType].runRetreived.status}, length: ${threadMessages.data.length}`);
          return;
      }
      const gptMessages = [];
      this.lastAssistantMessage = "";
      for (const msg of threadMessages.data) {
          if (msg.role === 'assistant') {
              const gptOutput = await getAssistantMessage(msg);
              gptMessages.push(gptOutput);
              this.lastAssistantMessage += `\n${gptOutput}`;
          } else if (msg.role !== 'assistant') {
              this.messages.push([agentType, apiMessages, msg.content[0].text.value, gptMessages]);
              break;
          }
      }
      for (const msg of this.messages[this.messages.length - 1][3].reverse()) {
          console.log(`${agentType}: ${msg}`);
      }
  }
}

async function main() {
  try {

       const agent = new AutomationAgent();
       await agent.create();
       let prompt = "delete the last draft from my gmail inbox";
       let jsonPrompt = `{"task":"${prompt}"}`;
       await agent.processPrompt(jsonPrompt);


  } catch (e) {
      console.error(e.toString());
      return;
  }
}

// Usage
await main();


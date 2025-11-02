import { OpenAI } from 'openai';

export class OpenAIClient {
    constructor() {
    }
    async authorize(accessToken) {
      try {
        this.accessToken = accessToken;
        this.gptClient = new OpenAI({apiKey:accessToken});
        //this.gptClient.containers.files.content.retrieve().responses.create()
        return true;
      }
      catch (e) {
        console.error(e.toString());
        return false;
      }
    }  

    async getAssistantMessage(message, response_id) {
        // Extract the message content
        let messageContent = message.content[0].text;
        const annotations =  message.content[0].annotations;
        // Iterate over the annotations and add footnotes
        for (let index = 0; index < annotations.length; index++) {
            const annotation = annotations[index];
            if (annotation.type === "container_file_citation") {
                const fileUrl = `Download it from: https://platform.openai.com/logs/${response_id}`;
                messageContent =  messageContent + '\n' + fileUrl + '\n';
            }
        }
        return messageContent;
    }
}

export class GptAssistant {
    constructor(){
    }

    async create(functionList, name, instructions, openAIClient) {
        this.openAIClient = openAIClient;

        this.model = "gpt-4.1";
        this.instructions= instructions;
        this.tools = functionList;
        this.newTools=[];

        this.agentType = name;
        this.lastMessageTimeStamp = 0;
        this.thread = await this.openAIClient.gptClient.conversations.create();
        this.threadIds = {};
        this.fileIds=[];
        this.imageIds=[];
    }

    async addImageIds(imageIds) {
        this.imageIds.push(...imageIds);
    }

    async addFileIds(fileIds) {
        this.fileIds.push(...fileIds);
    }

    setThreadIds(threadIds) {
      this.threadIds = threadIds;
    }

    async compileHistory() {
      let historyString = "";
      let history = {};
      for (const agentType in this.threadIds) {
          if (agentType !== this.agentType) {
              const threadMessages = await this.openAIClient.gptClient.conversations.items.list(this.threadIds[agentType]);

              for (const msg of threadMessages.data) {
                  if ( msg.type === 'message' && msg.role === 'assistant' && msg.created_at > this.lastMessageTimeStamp) {
                      history[msg.created_at] = `${agentType} assistant: ${await this.openAIClient.getAssistantMessage(msg)}`;
                  }
              }
          }
      }
      history = Object.fromEntries(Object.entries(history).sort((a, b) => b[0] - a[0]));
      for (const timestamp in history) {
          historyString += `Unix timestamp: ${timestamp}:${history[timestamp]}\n`;
      }
      return historyString;
    }

    async callAssistant(jsonPrompt) {
        const functionArgs = JSON.parse(jsonPrompt);
        const prompt = functionArgs.task;
        delete functionArgs.task;
    
        let combinedPrompt = prompt;
    
        if (this.agentType !== "global") {
            const history = await this.compileHistory();
            combinedPrompt = `Consider processing the following task \nTask: ${prompt}: ${functionArgs.extra_info || ""}`;
                
            if (history !== "") {
                combinedPrompt += `\n if there is some missing information, the following event history may help you. \n Context History:\n${history}`;
            }
        }

        this.newTools = structuredClone(this.tools);
        if (this.fileIds.length > 0) {
            const vectorStore = await this.openAIClient.gptClient.vectorStores.create({file_ids: this.fileIds });
            this.newTools.push( { type: "file_search", "vector_store_ids": [vectorStore.id]});
            this.newTools.push( { type: "code_interpreter", container: { type: "auto", file_ids: this.fileIds}});
        }

        if (this.imageIds.length > 0) {
            const content = [
                ...this.imageIds.map(id => ({ type: "input_image", file_id: id})),
                { type: "input_text", text: `${combinedPrompt}` }
            ];
            combinedPrompt = [
                { role: "user", content: content }
            ]; 
        }

        this.response = await this.openAIClient.gptClient.responses.create({ model: this.model, instructions: this.instructions, tools: this.newTools, conversation: this.thread.id, input: combinedPrompt, parallel_tool_calls: false });

        this.lastMessageTimeStamp = this.response.created_at;
        this.imageIds.length = 0;
   }


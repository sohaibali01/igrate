import { OpenAI } from 'openai';
import fs from "fs";

export class OpenAIClient {
    constructor() {
     // this.accessToken="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";
    }
    async authorize(accessToken) {
      try {
        this.accessToken = accessToken;
        this.gptClient = new OpenAI({apiKey:accessToken});
        await this.gptClient.beta.assistants.list();
        return true;
      }
      catch (e) {
        console.error(e.toString());
        return false;
      }
    }  

    async getAssistantMessage(message) {
    // Extract the message content
    const messageContent = message.content[0].text;
    const annotations = messageContent.annotations;
    const citations = [];

    // Iterate over the annotations and add footnotes
    for (let index = 0; index < annotations.length; index++) {
        const annotation = annotations[index];

        // Replace the text with a footnote
        messageContent.value = await messageContent.value.replace(annotation.text, `[${index}]`);

        // Gather citations based on annotation attributes
        if (annotation.file_citation) {
            const citedFile = await this.gptClient.files.retrieve(annotation.file_citation.file_id);
            citations.push(`[${index}] ${annotation.file_citation.quote} from ${citedFile.filename}`);
        } else if (annotation.file_path) {
            const link = `https://platform.openai.com/files/${annotation.file_path.file_id}`;
            citations.push(`[${index}] To download, visit ${link}`);
            // Note: File download functionality not implemented above for brevity
        }
    }

    // Add footnotes to the end of the message before displaying to the user
    messageContent.value += '\n' + citations.join('\n');
    return messageContent.value;
    }
}

export class GptAssistant {
    constructor(){
    }

    async create(functionList, name, instructions, openAIClient) {
        this.openAIClient = openAIClient;
        // let uploadedFile;
        // try {
        // if (name === 'file') {
        //     console.log("reading file ");
        //     // Upload a file with an "assistants" purpose
        //     uploadedFile = await this.openAIClient.gptClient.files.create({
        //         file: fs.createReadStream("D:/sohaib/References.docx"),
        //         purpose: 'assistants',
        //     });
        // }
        // } catch (error) {
        //     console.error(error);
        // }
       
        const existingAssistant = await this.findExistingAssistant( name );
        if (!existingAssistant) {
            this.assistant = await this.openAIClient.gptClient.beta.assistants.create({
                name: name,
                model: "gpt-3.5-turbo-1106",
                instructions: instructions,
                tools: functionList,
                file_ids: []
                // file_ids: name === 'retrieval' ? [uploadedFile.id] : [],
                //file_ids: name === 'file' ? ["file-mIRUcl5ACMX1jExfwXjbD4n4"] : []
            });
        } else {
            this.assistant = existingAssistant;
            await this.openAIClient.gptClient.beta.assistants.update(this.assistant.id, {
                model: "gpt-3.5-turbo-1106",
                instructions: instructions,
                tools: functionList,
                file_ids: []
                // file_ids: name === 'file' ? [uploadedFile.id] : []
            });
        }

        this.agentType = name;
        this.lastMessageTimeStamp = 0;
        this.thread = await this.openAIClient.gptClient.beta.threads.create();
        this.threadIds = {};
    }

    setThreadIds(threadIds) {
      this.threadIds = threadIds;
    }

    async compileHistory() {
      let historyString = "";
      let history = {};
      for (const agentType in this.threadIds) {
          if (agentType !== this.agentType) {
              const threadMessages = await this.openAIClient.gptClient.beta.threads.messages.list(this.threadIds[agentType]);

              for (const msg of threadMessages.data) {
                  if (msg.role === 'assistant' && msg.created_at > this.lastMessageTimeStamp) {
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
      console.log(`calling ${this.agentType}: ${prompt}: ${functionArgs.extra_info || ""}`);
  
      if (this.agentType !== "global") {
          const history = await this.compileHistory();
          combinedPrompt = `Consider processing the following task \nTask: ${prompt}: ${functionArgs.extra_info}`;
            
          if (history !== "") {
              combinedPrompt += `\n if there is some missing information, the following event history may help you. \n Context History:\n${history}`;
          }
      }
  
      const message = await this.openAIClient.gptClient.beta.threads.messages.create(this.thread.id, {role: "user", content: combinedPrompt });
  
      this.lastMessageTimeStamp = message.created_at;
      this.run = await this.openAIClient.gptClient.beta.threads.runs.create( this.thread.id, { assistant_id: this.assistant.id });
  
      let runRetrieved = await this.openAIClient.gptClient.beta.threads.runs.retrieve( this.thread.id,  this.run.id );
  
      while (runRetrieved.status === "in_progress" || runRetrieved.status === "queued") {
          await new Promise(resolve => setTimeout(resolve, 300));
          runRetrieved = await this.openAIClient.gptClient.beta.threads.runs.retrieve( this.thread.id,  this.run.id );
      }
   }
  

    async findExistingAssistant(name) {
      let assts = await this.openAIClient.gptClient.beta.assistants.list({ limit: 100 });

      while (assts.data.length > 0) {
          for (const asst of assts.data) {
              if (asst.name === name) {
                  return asst;
              }
          }

          assts = await this.openAIClient.gptClient.beta.assistants.list({
              after: assts.data[assts.data.length - 1].id,
              limit: 100
          });
      }
   }
}

import { OpenAI } from 'openai';

export const gptClient = new OpenAI({apiKey:'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'});

import { createReadStream } from 'fs';

export async function getAssistantMessage(message) {
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
          const citedFile = await gptClient.files.retrieve(annotation.file_citation.file_id);
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

export class GptAssistant {
    constructor(){}

    async create(functionList, name, instructions) {
        // let uploadedFile;
        // if (name === 'retrieval') {
        //     // Upload a file with an "assistants" purpose
        //     uploadedFile = await gptClient.files.create({
        //         file: createReadStream("D:/sohaib/References.docx"),
        //         purpose: 'assistants',
        //     });
        // }

        const assistantID = await this.findExistingAssistant( name );
        if (!assistantID) {
            this.assistant = await gptClient.beta.assistants.create({
                name: name,
                model: "gpt-3.5-turbo-1106",
                instructions: instructions,
                tools: functionList,
                // file_ids: name === 'retrieval' ? [uploadedFile.id] : [],
                file_ids: name === 'retrieval' ? ["file-mIRUcl5ACMX1jExfwXjbD4n4"] : []
            });
        } else {
            this.assistant = await gptClient.beta.assistants.update(assistantID, {
                model: "gpt-3.5-turbo-1106",
                instructions: instructions,
                tools: functionList,
                // file_ids: name === 'retrieval' ? [uploadedFile.id] : [],
                file_ids: name === 'retrieval' ? ["file-mIRUcl5ACMX1jExfwXjbD4n4"] : []
            });
        }

        this.agentType = name;
        this.lastMessageTimeStamp = 0;
        this.thread = await gptClient.beta.threads.create();
        this.threadIds = {};
        this.description = {
           // hubspot: "\n For the above task, you must not update or delete any object, unless the object details provided by the user in the task match exactly with those in hubspot",
            hubspot: "",
            slack: "",
            retrieval: "",
            gmail: "",
            global: "",
        }
    }

    setThreadIds(threadIds) {
      this.threadIds = threadIds;
    }

    async compileHistory() {
      let historyString = "";
      let history = {};
      for (const agentType in this.threadIds) {
          if (agentType !== this.agentType) {
              const threadMessages = await gptClient.beta.threads.messages.list(this.threadIds[agentType]);

              for (const msg of threadMessages.data) {
                  if (msg.role === 'assistant' && msg.created_at > this.lastMessageTimeStamp) {
                      history[msg.created_at] = `${agentType} assistant: ${await getAssistantMessage(msg)}`;
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
          combinedPrompt = combinedPrompt + this.description[this.agentType];  
          if (history !== "") {
              combinedPrompt += `\n if there is some missing information, the following event history may help you. \n Context History:\n${history}`;
          }
      }
  
      const message = await gptClient.beta.threads.messages.create(this.thread.id, {role: "user", content: combinedPrompt });
  
      this.lastMessageTimeStamp = message.created_at;
      this.run = await gptClient.beta.threads.runs.create( this.thread.id, { assistant_id: this.assistant.id });
  
      let runRetrieved = await gptClient.beta.threads.runs.retrieve( this.thread.id,  this.run.id );
  
      while (runRetrieved.status === "in_progress" || runRetrieved.status === "queued") {
          await new Promise(resolve => setTimeout(resolve, 300));
          runRetrieved = await gptClient.beta.threads.runs.retrieve( this.thread.id,  this.run.id );
      }
   }
  

    async findExistingAssistant(name) {
      let assts = await gptClient.beta.assistants.list({ limit: 100 });

      while (assts.data.length > 0) {
          for (const asst of assts.data) {
              if (asst.name === name) {
                  return asst.id;
              }
          }

          assts = await gptClient.beta.assistants.list({
              after: assts.data[assts.data.length - 1].id,
              limit: 100
          });
      }
   }
}

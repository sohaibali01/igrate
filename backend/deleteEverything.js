
import { OpenAI } from 'openai';

KEY="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";

async function deleteAllVectorStores() {
  let gptClient = new OpenAI({apiKey: KEY});
  let assts = await gptClient.vectorStores.list({ limit: 100 });
  let list=[]
  while (assts.data.length > 0) {
      for (const asst of assts.data) {
          list.push(asst.id);
      }
      assts = await gptClient.vectorStores.list({
          after: assts.data[assts.data.length - 1].id,
          limit: 100
      });
  }
  for (const id of list){
    try {
    await gptClient.vectorStores.delete(id);}
    catch
  {continue}
  }
}

async function deleteAllFiles() {
  let gptClient = new OpenAI({apiKey:KEY});
  let assts = await gptClient.files.list({ limit: 100 });
  let list=[]
  while (assts.data.length > 0) {
      for (const asst of assts.data) {
          list.push(asst.id);
      }
      assts = await gptClient.files.list({
          after: assts.data[assts.data.length - 1].id,
          limit: 100
      });
  }
  for (const id of list){
    try {
    await gptClient.files.delete(id);}
    catch
  {continue}
  }
}

async function deleteContainers() {
  let gptClient = new OpenAI({apiKey:KEY});
  let assts = await gptClient.containers.list({ limit: 100 });
  let list=[]
  while (assts.data.length > 0) {
      for (const asst of assts.data) {
          list.push(asst.id);
      }
      assts = await gptClient.containers.list({
          after: assts.data[assts.data.length - 1].id,
          limit: 100
      });
  }
  for (const id of list){
    try {
    await gptClient.containers.delete(id);}
    catch
  {continue}
  }
}

// Usage
await deleteAllFiles();
await deleteAllVectorStores();
await deleteContainers();



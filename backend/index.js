import { OpenAI } from 'openai';
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());


const openai = new OpenAI({apiKey:'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'});

app.post("/", async (request, response) => {
  const { chats } = request.body;
  console.log(request.body)
  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: request.body.message
      },
    ],
  });

  response.json({
    output: result.choices[0].message,
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

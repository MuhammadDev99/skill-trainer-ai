import dotenv from 'dotenv';
// Load env immediately
import path from 'path';
const __DIRNAME = import.meta.dirname;
dotenv.config({ path: path.resolve(__DIRNAME, '../.env') });
import express, { Request, Response } from 'express';
import cors from 'cors';
import type { ConversationMessage, ChatCompletionRequest } from './common/types.js'
import { askNvidiaAISimple } from './services/ai/ai.js'; // Assuming askNvidiaAISimple is exported correctly

const app = express();

// **ADD THIS MIDDLEWARE:**
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(cors());

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


app.post("/chat", async (req: Request, res: Response) => {
    try {
        // Now req.body should be parsed correctly
        const chatCompletionRequest = req.body as ChatCompletionRequest;
        // Check if 'messages' property exists
        if (!chatCompletionRequest || !chatCompletionRequest.messages) {
            console.log(chatCompletionRequest)
            console.log("Missing 'messages' in request body")
            return res.status(400).json({ error: "Missing 'messages' in request body" });
        }

        const updatedConversation: ConversationMessage[] = await askNvidiaAISimple(chatCompletionRequest.messages);

        res.json(updatedConversation);
    } catch (error) {
        console.error("Error in /chat endpoint:", error); // Log the error on the server
        res.status(500).json({ error: "Failed to fetch AI response" });
    }
});
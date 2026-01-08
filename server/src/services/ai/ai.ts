import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { nvidiaModels, NvidiaModelValue } from './models.js';
import { safe } from '../../utils/index.js';
import { ConversationMessage } from '../../common/types.js';


interface NvidiaDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
    reasoning_content?: string;
}

export async function askNvidiaAI({
    model,
    conversation,
    onToken,
    isThinking = true,
    maxTokens = 8192,
    temperature = 0.7,
    getReasoningTokens = false,
    apiKey
}: {
    model: NvidiaModelValue;
    conversation: ConversationMessage[];
    onToken: (token: string) => void;
    systemPrompt?: string;
    isThinking?: boolean;
    maxTokens?: number;
    temperature?: number;
    getReasoningTokens?: boolean;
    apiKey?: string;
}
): Promise<string> {

    const finalApiKey = apiKey || process.env.NVIDIA_API_KEY;
    if (!finalApiKey) throw new Error("Missing NVIDIA_API_KEY");

    const openai = new OpenAI({
        apiKey: finalApiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    /* const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    if (conversation) {
        messages.push({ role: "user", content: prompt });
    } */
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = conversation;

    // We use 'any' here to support Nvidia's custom 'chat_template_kwargs'
    const requestOptions: any = {
        model,
        messages,
        temperature,
        top_p: 0.7,
        max_tokens: maxTokens,
        stream: true
    };

    if (isThinking) {
        requestOptions.chat_template_kwargs = { thinking: true };
    }

    const stream = (await openai.chat.completions.create(requestOptions)) as unknown as Stream<OpenAI.Chat.Completions.ChatCompletionChunk>;

    let fullResponse = "";

    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta as NvidiaDelta;

        if (getReasoningTokens && delta?.reasoning_content) {
            onToken(delta.reasoning_content);
            fullResponse += delta.reasoning_content;
        }

        if (delta?.content) {
            onToken(delta.content);
            fullResponse += delta.content;
        }
    }

    return fullResponse;
}


export async function askNvidiaAISimple(conversation: ConversationMessage[]): Promise<ConversationMessage[]> {

    const result = await safe(askNvidiaAI({
        model: nvidiaModels.deepseek_v3_1,
        conversation,
        isThinking: false,
        onToken: (token) => process.stdout.write(token)
    }));


    if (!result.success) {
        console.error("\n\n❌ AI Generation Failed:", result.error.message);
        throw result.error
    }
    const updatedConversation = conversation
    updatedConversation.push({ role: "assistant", content: result.data })
    return updatedConversation
}
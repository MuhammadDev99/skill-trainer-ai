export interface Story {
    title: string;
    description: string;
    id: string
    author: string
}
export interface DialogueLine {
    speaker: 'man' | 'woman';
    text: string;
    audioUrl: string | null
}

export interface GeneratedStory {
    original: Story;
    content: string;
    dialogue: DialogueLine[];
}

export type PiperModel = | 'female' | 'male'

export type ConversationMessageRole = "assistant" | "user" | "system" | "developer"
export type ConversationMessage = {
    role: ConversationMessageRole;
    content: string;
}
export type ChatCompletionRequest = {
    messages: ConversationMessage[]
}
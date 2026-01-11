export type MessageType = 'success' | 'error' | 'warning';

export interface Message {
    id: number;
    title: string;
    content: string;
    type: MessageType;
    duration: number;
}


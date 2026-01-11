import { signal } from "@preact/signals-react";
import type { Message } from "../common/types";

export const messagesSignal = signal<Message[]>([]);

export function showMessage(msg: Omit<Message, 'id'>) {
    const id = Date.now();
    messagesSignal.value = [...messagesSignal.value, { ...msg, id }];

    // Auto-remove logic
    setTimeout(() => {
        messagesSignal.value = messagesSignal.value.filter(m => m.id !== id);
    }, msg.duration);
}
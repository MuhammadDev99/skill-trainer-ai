import type { ConversationMessageRole, ConversationMessage, ChatCompletionRequest } from '../common/types'
import { API_BASE } from '../common/config'
export async function chatCompletion(conversation: ConversationMessage[]): Promise<ConversationMessage[]> {
    const response = await fetch(API_BASE + "/chat", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: conversation })
    })
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    const data: ConversationMessage[] = await response.json()
    return data
}
import type { ConversationMessageRole, ConversationMessage, ChatCompletionRequest, QuizData } from '../../common/types'
import { chatCompletion } from '../../api/utils'
import styles from './style.module.css'
import { signal } from '@preact/signals-react'
import { safe } from '../../utils/safe'
import { QUESTIONS_GENERATION_AI_SYSTEM_MESSAGE, QUIZES_DATA_LOCALSTORAGE_KEY } from '../../common/config'

async function askAI() {
    if (prompt.value.trim().length === 0) return
    isAskingAI.value = true
    let conversation: ConversationMessage[] = []
    const systemMessage: ConversationMessage = {
        role: "system",
        content:
            QUESTIONS_GENERATION_AI_SYSTEM_MESSAGE
    }
    const userMessage: ConversationMessage = {
        role: "user",
        content: prompt.value
    }
    conversation = conversation.concat([systemMessage, userMessage])
    const conversationResult = await safe(chatCompletion(conversation));
    if (conversationResult.success) {
        let rawContent = conversationResult.data[2].content;

        const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = rawContent.match(jsonRegex);
        const cleanJsonString = match ? match[1].trim() : rawContent.trim();

        const newQuizData: QuizData = JSON.parse(cleanJsonString)
        aiConversation.value = conversationResult.data
        const existingQuizzes: QuizData[] = JSON.parse(localStorage.getItem(QUIZES_DATA_LOCALSTORAGE_KEY) ?? '[]')
        localStorage.setItem(QUIZES_DATA_LOCALSTORAGE_KEY, JSON.stringify([...existingQuizzes, (newQuizData)]))
    }
    isAskingAI.value = false
}
const prompt = signal<string>("")
const isAskingAI = signal<boolean>(false)
function handlePromptKeydown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        askAI()
    }
}
const aiConversation = signal<ConversationMessage[]>([])
export default function GenerateQuestions() {
    return (
        <div className={styles.container}>
            {aiConversation.value.length === 0 && <h1 className={styles.generateQuestionsHeader}>Generate Questions</h1>}
            {aiConversation.value.map((message: ConversationMessage, index: number) => {
                return (<div key={index}>
                    <p>{message.role}:{message.content}</p>
                </div>)
            })}

            <div className={styles.promptContainer}>
                <textarea className={styles.promptBox} value={prompt.value} onChange={(e) => prompt.value = e.currentTarget.value} onKeyDown={(e) => handlePromptKeydown(e)} disabled={isAskingAI.value}></textarea>
            </div>
        </div>
    )
}
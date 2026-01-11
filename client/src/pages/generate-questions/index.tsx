import type { ConversationMessageRole, ConversationMessage, ChatCompletionRequest, QuizData, QuestionType } from '../../common/types'
import { chatCompletion } from '../../api/utils'
import styles from './style.module.css'
import { signal } from '@preact/signals-react'
import { safe } from '../../utils/safe'
import { QUIZES_DATA_LOCALSTORAGE_KEY, SELECTED_NUMBER_OF_QUESTION_LOCAL_STORAGE_KEY, SELECTED_QUESTION_TYPES_LOCAL_STORAGE_KEY } from '../../common/config'
import { useNavigate } from 'react-router-dom'
import { constructAIQuizGenerationRequest, navigateToQuiz } from '../../utils'
import type { NavigateFunction } from 'react-router-dom'
import { availabeQuizes } from '../../store/quizStore'
import { useEffect } from 'react'
import { filleBlankQuestion, matchQuestion, openEndedQuestion, selectMultiQuestion, selectQuestion, sortQuestion, trueFalseQuestion } from "../../images";
import { showMessage } from '../../my-library'
async function askAI(navigate: NavigateFunction) {
    if (selectedQuestionTypes.value.length === 0) {
        showMessage({
            title: 'Question type',
            content: 'Please select at least one question type.',
            type: 'error',
            duration: 4000
        })
        return
    }
    const questionGenerationPrompt = constructAIQuizGenerationRequest(selectedQuestionTypes.value, numberOfQuestionsToGenerate.value)
    if (prompt.value.trim().length === 0) return
    isAskingAI.value = true
    let conversation: ConversationMessage[] = []
    const systemMessage: ConversationMessage = {
        role: "system",
        content:
            questionGenerationPrompt
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
        newQuizData.id = Date.now()
        aiConversation.value = conversationResult.data
        const existingQuizzes: QuizData[] = JSON.parse(localStorage.getItem(QUIZES_DATA_LOCALSTORAGE_KEY) ?? '[]')
        localStorage.setItem(QUIZES_DATA_LOCALSTORAGE_KEY, JSON.stringify([...existingQuizzes, (newQuizData)]))
        availabeQuizes.value = existingQuizzes
        navigateToQuiz(navigate, newQuizData)
    }
    isAskingAI.value = false
}
const prompt = signal<string>("")
const isAskingAI = signal<boolean>(false)
const selectedQuestionTypes = signal<QuestionType[]>([])
const numberOfQuestionsToGenerate = signal<number>(10)
const aiConversation = signal<ConversationMessage[]>([])
export default function GenerateQuestions() {
    useEffect(() => {
        availabeQuizes.value = JSON.parse(localStorage.getItem(QUIZES_DATA_LOCALSTORAGE_KEY) ?? '[]')
        selectedQuestionTypes.value = JSON.parse(localStorage.getItem(SELECTED_QUESTION_TYPES_LOCAL_STORAGE_KEY) ?? '[]')
        numberOfQuestionsToGenerate.value = JSON.parse(localStorage.getItem(SELECTED_NUMBER_OF_QUESTION_LOCAL_STORAGE_KEY) ?? '10')
    }, [])
    const navigate = useNavigate()
    function handlePromptKeydown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            askAI(navigate)
        }
    }
    function toggleSelectQuestionType(questionType: QuestionType) {
        const selectedTypes = selectedQuestionTypes.value;
        const isSelected = selectedTypes.some(x => x === questionType)
        const newSelectedTypes = isSelected ? [...(selectedTypes.filter(x => x !== questionType))] : [...selectedTypes, questionType]
        selectedQuestionTypes.value = newSelectedTypes
        localStorage.setItem(SELECTED_QUESTION_TYPES_LOCAL_STORAGE_KEY, JSON.stringify(newSelectedTypes))
    }
    function handleNumberOfQuestionsChange(newNumber: number) {
        numberOfQuestionsToGenerate.value = Number(newNumber)
        localStorage.setItem(SELECTED_NUMBER_OF_QUESTION_LOCAL_STORAGE_KEY, JSON.stringify(newNumber))
    }
    return (
        <div className={styles.container}>
            <div className={styles.generateQuestionsHeaderContainer}>
                <h1 className={styles.generateQuestionsHeader}>Generate Questions</h1>
                <button onClick={() => navigate('/')}>View {availabeQuizes.value.length} generated quizes</button>
            </div>

            <div className={styles.promptContainer}>
                <div className={styles.promptOptions}>
                    <div className={styles.numberOfQuestionsContainer}>
                        <h2>Number of questions</h2>
                        <input type='number' min={1} max={100} value={numberOfQuestionsToGenerate.value} onChange={(e) => handleNumberOfQuestionsChange(Number(e.target.value))} />
                    </div>
                    <div className={styles.typesOptionsContainer}>
                        <h2>Allowed question types</h2>
                        <div className={styles.typesOptions}>
                            <div onClick={() => toggleSelectQuestionType('multi-true-false')} className={selectedQuestionTypes.value.includes('multi-true-false') ? styles.enabled : ""}>
                                <img src={trueFalseQuestion} />
                                <p>True False</p>
                            </div>
                            <div onClick={() => toggleSelectQuestionType('sorting')} className={selectedQuestionTypes.value.includes('sorting') ? styles.enabled : ""}>
                                <img src={sortQuestion} />
                                <p>Sorting</p>
                            </div>
                            <div onClick={() => toggleSelectQuestionType('matching')} className={selectedQuestionTypes.value.includes('matching') ? styles.enabled : ""}>
                                <img src={matchQuestion} />
                                <p>Match Pairs</p>
                            </div>
                            <div onClick={() => toggleSelectQuestionType('fill-in-blanks')} className={selectedQuestionTypes.value.includes('fill-in-blanks') ? styles.enabled : ""}>
                                <img src={filleBlankQuestion} />
                                <p>Fill Blanks</p>
                            </div>
                            <div onClick={() => toggleSelectQuestionType('single-select')} className={selectedQuestionTypes.value.includes('single-select') ? styles.enabled : ""}>
                                <img src={selectQuestion} />
                                <p>Select One</p>
                            </div>
                            <div onClick={() => toggleSelectQuestionType('multi-select')} className={selectedQuestionTypes.value.includes('multi-select') ? styles.enabled : ""}>
                                <img src={selectMultiQuestion} />
                                <p>Select Multi</p>
                            </div>
                            <div onClick={() => toggleSelectQuestionType('open-ended')} className={selectedQuestionTypes.value.includes('open-ended') ? styles.enabled : ""}>
                                <img src={openEndedQuestion} />
                                <p>Open Ended</p>
                            </div>
                        </div>
                    </div>
                </div>
                <textarea className={styles.promptBox} value={prompt.value} onChange={(e) => prompt.value = e.currentTarget.value} onKeyDown={(e) => handlePromptKeydown(e)} disabled={isAskingAI.value}></textarea>
            </div>
        </div>
    )
}
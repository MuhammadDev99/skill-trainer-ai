import { LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY, LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY } from "../common/config";
import type { QuizAnswer, QuizData, QuizQuestion } from "../common/types";
import type { NavigateFunction } from 'react-router-dom'
import { errorImage, filleBlankQuestion, matchQuestion, selectMultiQuestion, selectQuestion, sortQuestion, trueFalseQuestion } from "../images";
import { currentQuiz, quizAnswers } from "../store/quizStore";

export function getQustionTypeImage(question: QuizQuestion): string {
    switch (question.type) {
        case "multi-select":
            return selectMultiQuestion
        case "single-select":
            return selectQuestion
        case "matching":
            return matchQuestion
        case "multi-true-false":
            return trueFalseQuestion
        case "sorting":
            return sortQuestion
        case "fill-in-blanks":
            return filleBlankQuestion
        default:
            return errorImage
    }
}

export function navigateToQuiz(navigate: NavigateFunction, quiz: QuizData) {
    currentQuiz.value = quiz
    localStorage.setItem(LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY, JSON.stringify(currentQuiz.value))
    quizAnswers.value = {}
    localStorage.removeItem(LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY)
    navigate('/quiz')
}

export type OpenEndedQuestionAIResponse = {
    questionId: number
    isCorrect: boolean
    grade: Number // 0 - 10
    explanation: string
}
export async function AskAIToGradeOpenEndedQuestion(question: QuizQuestion, answer: QuizAnswer): Promise<OpenEndedQuestionAIResponse> {
    // will implement later
    return { questionId: question.id, isCorrect: true, grade: 7, explanation: "because water only boils at temp close to a 100 on normal atmospheric pressure" }
} 
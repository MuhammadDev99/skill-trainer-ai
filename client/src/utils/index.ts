import { LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY, LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY } from "../common/config";
import type { ConversationMessage, QuestionType, QuizAnswer, QuizData, QuizQuestion } from "../common/types";
import type { NavigateFunction } from 'react-router-dom'
import { errorImage, filleBlankQuestion, matchQuestion, selectMultiQuestion, selectQuestion, sortQuestion, trueFalseQuestion, openEndedQuestion } from "../images";
import { currentQuestionIndex, currentQuiz, quizAnswers } from "../store/quizStore";
import { safe } from "./safe";
import { chatCompletion } from "../api/utils";
import { showMessage } from "../my-library";

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
        case "open-ended":
            return openEndedQuestion
        default:
            return errorImage
    }
}

export function navigateToQuiz(navigate: NavigateFunction, quiz: QuizData) {
    currentQuiz.value = quiz
    currentQuestionIndex.value = 0
    localStorage.setItem(LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY, JSON.stringify(currentQuiz.value))
    quizAnswers.value = {}
    localStorage.removeItem(LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY)
    navigate('/quiz')
}

export type OpenEndedQuestionAIResponse = {
    questionId: number
    isCorrect: boolean
    grade: number // 0 - 10
    explanation: string
}

export function extractJSON<T>(raw: string): T {
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = raw.match(jsonRegex);
    const cleanJsonString = match ? match[1].trim() : raw.trim();
    return JSON.parse(cleanJsonString);
}


/* export async function AskAIToGradeOpenEndedQuestion(question: QuizQuestion, answer: QuizAnswer): Promise<OpenEndedQuestionAIResponse> {
    if (answer.type !== 'open-ended') {
        throw new Error("answer must be of type open-ended.")
    }
    const instructions = `
Question is: ${question.prompt}

Answer is: ${answer.answer}

Please grade the question in json format similar to this:
{
    isCorrect: boolean
    grade: Number // 0 - 10
    explanation: string
}
    `.trim()

    let conversation: ConversationMessage[] = [{
        role: "user",
        content: instructions
    }]

    const completion = await chatCompletion(conversation);
    const rawData = completion[1].content
    const grading = extractJSON<OpenEndedQuestionAIResponse>(rawData);
    grading.questionId = question.id
    return grading
} */


export async function AskAIToGradeOpenEndedQuestion(question: QuizQuestion, answer: QuizAnswer): Promise<OpenEndedQuestionAIResponse> {
    if (answer.type !== 'open-ended' || question.type !== 'open-ended') {
        throw new Error("Both question and answer must be of type open-ended.");
    }

    const instructions = `
You are an expert grader. Grade the user's answer based on the provided reference answer.

Reference Question: ${question.prompt}
User's Provided Answer: ${answer.answer}

Please grade the user's answer in JSON format:
{
    "isCorrect": boolean,
    "grade": number, // 0 - 10
    "explanation": "Explain why the grade was given and compare it to the reference answer."
}
    `.trim();

    let conversation: ConversationMessage[] = [{
        role: "user",
        content: instructions
    }];

    const completion = await chatCompletion(conversation);
    const rawData = completion[1].content;
    const grading = extractJSON<OpenEndedQuestionAIResponse>(rawData);
    grading.questionId = question.id;
    return grading;
}


/* export function constructAIQuizGenerationRequest(
    questionTypes: QuestionType | QuestionType[],
    numberOfQuestions: number
): string {
    const typesArray = Array.isArray(questionTypes) ? questionTypes : [questionTypes];

    // Configuration bundles: Schema, Rule, and Example per type
    const typeConfig: Record<string, { schema: string; rule?: string; example: string }> = {
        'single-select': {
            schema: `Type "single-select": Root has "correctOptionId". Options only have "id" and "text".`,
            rule: `For "single-select", ensure "correctOptionId" matches exactly one ID from the options array.`,
            example: `{ "id": 1, "type": "single-select", "prompt": "What is the capital of France?", "explanation": "Paris is correct.", "options": [{ "id": 1, "text": "Lyon" }, { "id": 2, "text": "Paris" }], "correctOptionId": 2 }`
        },
        'multi-select': {
            schema: `Type "multi-select": Options have "isCorrect": boolean.`,
            rule: `For "multi-select", ensure at least one option has "isCorrect": true.`,
            example: `{ "id": 2, "type": "multi-select", "prompt": "Select primary colors.", "explanation": "...", "options": [{ "id": 1, "text": "Red", "isCorrect": true }, { "id": 2, "text": "Blue", "isCorrect": true }, { "id": 3, "text": "Green", "isCorrect": false }] }`
        },
        'matching': {
            schema: `Type "matching": "pairs" array containing "left" and "right" strings.`,
            rule: `For "matching", ensure pairs represent a correct 1-to-1 association.`,
            example: `{ "id": 3, "type": "matching", "prompt": "Match the currency", "explanation": "...", "pairs": [{ "id": 1, "left": "USA", "right": "Dollar" }, { "id": 2, "left": "Japan", "right": "Yen" }] }`
        },
        'multi-true-false': {
            schema: `Type "multi-true-false": "items" array where each has "isTrue": boolean.`,
            example: `{ "id": 4, "type": "multi-true-false", "prompt": "Evaluate statements", "explanation": "...", "items": [{ "id": 1, "text": "Sky is blue", "isTrue": true }, { "id": 2, "text": "Fire is cold", "isTrue": false }] }`
        },
        'sorting': {
            schema: `Type "sorting": "items" array of text strings.`,
            rule: `For "sorting", the "items" array MUST be returned in the CORRECT logical/chronological order.`,
            example: `{ "id": 5, "type": "sorting", "prompt": "Sort by size (small to large)", "explanation": "...", "items": [{ "id": 1, "text": "Mouse" }, { "id": 2, "text": "Elephant" }] }`
        },
        'fill-in-blanks': {
            schema: `Type "fill-in-blanks": "content" string with {{id}} placeholders + "blanks" array.`,
            rule: `For "fill-in-blanks", use {{n}} syntax in "content" and match with "blanks" id n.`,
            example: `{ "id": 6, "type": "fill-in-blanks", "prompt": "Complete the sentence.", "content": "The {{1}} fox.", "explanation": "...", "blanks": [{ "id": 1, "correctAnswer": "quick" }] }`
        },
        'open-ended': {
            // UPDATED: No 'content' field. Just prompt + explanation.
            schema: `Type "open-ended": Only requires "prompt" and "explanation". No extra fields.`,
            example: `{ "id": 7, "type": "open-ended", "prompt": "Explain the concept of quantum entanglement.", "explanation": "It is a phenomenon where..." }`
        }
    };

    // Filter configuration based on requested types
    const activeConfigs = typesArray
        .filter(t => typeConfig[t])
        .map(t => typeConfig[t]);

    const schemas = activeConfigs.map(c => `- ${c.schema}`).join('\n');
    const dynamicRules = activeConfigs.map(c => c.rule).filter(Boolean).map(r => `- ${r}`).join('\n');
    const examples = activeConfigs.map(c => c.example).join(',\n    ');

    return `
You are a strict JSON quiz generator.

### REQUEST
- **Quantity**: Exactly ${numberOfQuestions} questions.
- **Allowed Types**: ${typesArray.join(', ')}.

### DATA SCHEMA
${schemas}

### RULES
1. **Mandatory Fields**:
   - **"prompt"**: EVERY question object MUST have a "prompt" string (the actual question text).
   - **"explanation"**: EVERY question object MUST have an "explanation" string.
2. **IDs**:
   - Generate unique numeric IDs for the quiz, questions, and all sub-items.
   - **Internal IDs** (options, pairs, items) must be sequential integers starting at 1 (e.g., 1, 2, 3).
3. **Dynamic Logic**:
${dynamicRules}
4. **Format**:
   - Return **ONLY** raw JSON.
   - No markdown code blocks.

### OUTPUT EXAMPLE
{
  "id": 17156291,
  "learningPath": "Topic Title",
  "questions": [
    ${examples}
  ]
}
`.trim();
} */

export function constructAIQuizGenerationRequest(
    questionTypes: QuestionType | QuestionType[],
    numberOfQuestions: number
): string {
    const typesArray = Array.isArray(questionTypes) ? questionTypes : [questionTypes];

    // Configuration bundles: Schema, Rule, and Example per type
    const typeConfig: Record<string, { schema: string; rule?: string; example: string }> = {
        'single-select': {
            schema: `Type "single-select": Root has "correctOptionId". Options only have "id" and "text".`,
            rule: `For "single-select", ensure "correctOptionId" matches exactly one ID from the options array.`,
            example: `{ "id": 1, "type": "single-select", "prompt": "What is the capital of France?", "explanation": "Paris is correct.", "options": [{ "id": 1, "text": "Lyon" }, { "id": 2, "text": "Paris" }], "correctOptionId": 2 }`
        },
        'multi-select': {
            schema: `Type "multi-select": Options have "isCorrect": boolean.`,
            rule: `For "multi-select", ensure at least one option has "isCorrect": true.`,
            example: `{ "id": 2, "type": "multi-select", "prompt": "Select primary colors.", "explanation": "...", "options": [{ "id": 1, "text": "Red", "isCorrect": true }, { "id": 2, "text": "Blue", "isCorrect": true }, { "id": 3, "text": "Green", "isCorrect": false }] }`
        },
        'matching': {
            schema: `Type "matching": "pairs" array containing "left" and "right" strings.`,
            rule: `For "matching", ensure pairs represent a correct 1-to-1 association.`,
            example: `{ "id": 3, "type": "matching", "prompt": "Match the currency", "explanation": "...", "pairs": [{ "id": 1, "left": "USA", "right": "Dollar" }, { "id": 2, "left": "Japan", "right": "Yen" }] }`
        },
        'multi-true-false': {
            schema: `Type "multi-true-false": "items" array where each has "isTrue": boolean.`,
            example: `{ "id": 4, "type": "multi-true-false", "prompt": "Evaluate statements", "explanation": "...", "items": [{ "id": 1, "text": "Sky is blue", "isTrue": true }, { "id": 2, "text": "Fire is cold", "isTrue": false }] }`
        },
        'sorting': {
            schema: `Type "sorting": "items" array of text strings.`,
            rule: `For "sorting", the "items" array MUST be returned in the CORRECT logical/chronological order.`,
            example: `{ "id": 5, "type": "sorting", "prompt": "Sort by size (small to large)", "explanation": "...", "items": [{ "id": 1, "text": "Mouse" }, { "id": 2, "text": "Elephant" }] }`
        },
        'fill-in-blanks': {
            schema: `Type "fill-in-blanks": "content" string with {{id}} placeholders + "blanks" array.`,
            rule: `For "fill-in-blanks", use {{n}} syntax in "content" and match with "blanks" id n.`,
            example: `{ "id": 6, "type": "fill-in-blanks", "prompt": "Complete the sentence.", "content": "The {{1}} fox.", "explanation": "...", "blanks": [{ "id": 1, "correctAnswer": "quick" }] }`
        },
        'open-ended': {
            schema: `Type "open-ended": Requires "prompt", "explanation", and "answer" (the ideal/reference answer).`,
            example: `{ 
        "id": 7, 
        "type": "open-ended", 
        "prompt": "Explain the concept of quantum entanglement.", 
        "answer": "Quantum entanglement is a physical phenomenon that occurs when a group of particles are generated or interact in such a way that the quantum state of each particle cannot be described independently of the state of the others.",
        "explanation": "Focus on the interconnectedness of particle states regardless of distance." 
    }`
        }
    };

    // Filter configuration based on requested types
    const activeConfigs = typesArray
        .filter(t => typeConfig[t])
        .map(t => typeConfig[t]);

    const schemas = activeConfigs.map(c => `- ${c.schema}`).join('\n');
    const dynamicRules = activeConfigs.map(c => c.rule).filter(Boolean).map(r => `- ${r}`).join('\n');
    const examples = activeConfigs.map(c => c.example).join(',\n    ');

    return `
You are a strict JSON quiz generator.

### REQUEST
- **Quantity**: Exactly ${numberOfQuestions} questions.
- **Allowed Types**: ${typesArray.join(', ')}.

### DATA SCHEMA
${schemas}

### RULES
1. **Mandatory Fields**:
   - **"prompt"**: EVERY question object MUST have a "prompt" string (the actual question text).
   - **"explanation"**: EVERY question object MUST have an "explanation" string.
2. **IDs**:
   - Generate unique numeric IDs for the quiz, questions, and all sub-items.
   - **Internal IDs** (options, pairs, items) must be sequential integers starting at 1 (e.g., 1, 2, 3).
3. **Dynamic Logic**:
${dynamicRules}
4. **Format**:
   - Return **ONLY** raw JSON.
   - No markdown code blocks.

### OUTPUT EXAMPLE
{
  "id": 17156291,
  "learningPath": "Topic Title",
  "questions": [
    ${examples}
  ]
}
`.trim();
}
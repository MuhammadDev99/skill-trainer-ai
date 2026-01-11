import { signal } from '@preact/signals-react';
import styles from './style.module.css'
import { downArrow, upArrow, correct, wrong, correctColored, wrongColored } from '../../images'
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import hooks
import type { QuizQuestion, SortingQuestion, MatchingQuestion, MultiTrueFalseQuestion, MultiSelectQuestion, SingleSelectQuestion, FillInBlanksQuestion, QuizData, QuizAnswer, OpenEndedQuestion, GradedAnswerResult } from '../../common/types';

import { currentQuiz, quizAnswers, currentQuestionIndex, instantFeedbackEnabled } from '../../store/quizStore';
import { showMessage } from '../../my-library';
/* export const testQuestions: QuizQuestion[] = [] */

function next() {
    if (!currentQuiz.value) return
    if (currentQuestionIndex.value < currentQuiz.value.questions.length - 1) {
        currentQuestionIndex.value++
    }
}
function previous() {
    if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--
    }
}

function createSeededGenerator(seedString: string): () => number {
    // 1. Hash the string to get a numeric seed
    // This is a simple bitwise hash (cyrb128 style)
    let h = 2166136261;
    for (let i = 0; i < seedString.length; i++) {
        h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
    }

    // 2. Return a PRNG function (Mulberry32 algorithm)
    return function () {
        h |= 0; h = h + 0x6D2B79F5 | 0;
        let t = Math.imul(h ^ h >>> 15, 1 | h);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// --- How to use it with your Shuffle function ---

function shuffle<T>(array: T[], seed: string): T[] {
    const copiedArray = [...array];
    const rng = createSeededGenerator(seed); // Initialize the generator once

    for (let i = copiedArray.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(rng() * (i + 1)); // Call it to get the next number
        [copiedArray[i], copiedArray[randomIndex]] = [copiedArray[randomIndex], copiedArray[i]];
    }

    return copiedArray;
}


function MultiSelectView({ question }: { question: MultiSelectQuestion }) {
    const questionId = question.id
    const currentAnswer = quizAnswers.value[questionId] || {
        type: "multi-select",
        values: {}
    }
    if (currentAnswer.type !== 'multi-select') {
        return
    }
    function handleChange(optionId: number, isChecked: boolean) {
        if (currentAnswer.type !== 'multi-select') return;
        const newValues = { ...currentAnswer.values }
        newValues[optionId] = isChecked
        quizAnswers.value = { ...quizAnswers.value, [questionId]: { ...currentAnswer, values: newValues } }
    }
    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsMultipleChoice}`}>
            {question.options.map(option => {
                const optionId = option.id
                const isOptionAnsweredCorrectly = quizAnswers.value[question.id]?.result?.optionResults[optionId]
                let optionClassNames = styles.multiSelectOption
                if (isOptionAnsweredCorrectly !== undefined && showExplanation.value) {
                    optionClassNames += ` ${isOptionAnsweredCorrectly ? styles.answerCorrect : styles.answerWrong}`
                }
                return (
                    <div key={optionId} className={optionClassNames}>
                        <label>
                            <input checked={!!currentAnswer.values[optionId]} onChange={(e) => handleChange(optionId, e.target.checked)} type='checkbox' name={`question-${questionId}`} />
                            {" " + option.text}
                        </label>
                    </div>
                )
            })}
        </div>
    );
}

function SingleSelectView({ question }: { question: SingleSelectQuestion }) {
    const questionId = question.id
    const currentAnswer = quizAnswers.value[questionId] || {
        type: "single-select",
        selectedId: null
    }
    if (currentAnswer.type !== 'single-select') {
        return
    }

    function handleChange(selectedId: number) {
        if (currentAnswer.type !== 'single-select') return;
        quizAnswers.value = { ...quizAnswers.value, [questionId]: { ...currentAnswer, selectedId: selectedId } }
    }
    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsMultipleChoice}`}>
            {question.options.map(option => {
                const isChecked = currentAnswer.selectedId === option.id
                const optionId = option.id
                const isOptionTheCorrectOne = optionId === question.correctOptionId

                const isOptionAnsweredCorrectly = quizAnswers.value[question.id]?.result?.isCorrect
                let optionClassNames = styles.singleSelectOption
                if ((isOptionTheCorrectOne || isChecked) && isOptionAnsweredCorrectly !== undefined && showExplanation.value) {
                    if (isOptionTheCorrectOne) {
                        optionClassNames += ` ${styles.showExplanation} ${styles.answerCorrect}`
                    } else {
                        optionClassNames += ` ${styles.showExplanation} ${isOptionAnsweredCorrectly ? styles.answerCorrect : styles.answerWrong}`
                    }

                }

                return (
                    <div key={option.id} className={optionClassNames}>
                        <label>
                            <input checked={isChecked} onChange={() => handleChange(option.id)} type='radio' name={`question-${questionId}`} />
                            {" " + option.text}
                        </label>
                    </div>
                )
            })}
        </div>
    );
}

function MatchingView({ question }: { question: MatchingQuestion }) {
    let currentAnswer = quizAnswers.value[question.id]
    if (currentAnswer === undefined) {
        const startingAnswer = { type: 'matching' as const, pairs: {} }
        currentAnswer = startingAnswer
        quizAnswers.value = { ...quizAnswers.value, [question.id]: startingAnswer }
    }
    if (currentAnswer.type !== 'matching') return;
    function handleValueChange(optionId: number, newValue: string) {
        if (currentAnswer.type !== 'matching') return;
        const newPairs = { ...currentAnswer.pairs }
        newPairs[optionId] = newValue
        quizAnswers.value = { ...quizAnswers.value, [question.id]: { ...currentAnswer, pairs: newPairs } }
    }
    const uniqueShuffledOptions = shuffle([...new Set([...question.pairs.map(x => x.right)])], question.prompt)
    const options = ["Select...", ...uniqueShuffledOptions]
    return (
        <div className={`${styles.quizOptions}  ${styles.quizOptionsMatching}`}>
            {question.pairs.map(pair => {
                const optionId = pair.id
                const isOptionAnsweredCorrectly = quizAnswers.value[question.id]?.result?.optionResults[optionId]
                let optionClassNames = styles.matchOption
                if (isOptionAnsweredCorrectly !== undefined && showExplanation.value) {
                    optionClassNames += ` ${styles.showExplanation} ${isOptionAnsweredCorrectly ? styles.answerCorrect : styles.answerWrong}`
                }
                const selectedOption = currentAnswer.pairs[optionId] || "Select..."
                return (
                    <div key={optionId} className={optionClassNames}>
                        <span>{pair.left}</span>
                        <select value={selectedOption} onChange={e => handleValueChange(optionId, e.target.value)} >
                            {options.map((option, index) => {
                                return (<option key={index} value={option}>{option}</option>)
                            })}
                        </select>
                        {showExplanation.value && <p>{pair.right}</p>}
                    </div>
                )
            })}
        </div>
    )
}
function MultiTrueFalseView({ question }: { question: MultiTrueFalseQuestion }) {
    const currentAnswer = quizAnswers.value[question.id] || {
        type: 'multi-true-false',
        values: {}
    }
    if (currentAnswer.type !== 'multi-true-false') return;

    function onValueChange(optionId: number, value: boolean) {
        if (currentAnswer.type !== 'multi-true-false') return;
        const newValues = { ...currentAnswer.values }
        newValues[optionId] = value
        quizAnswers.value = { ...quizAnswers.value, [question.id]: { ...currentAnswer, values: newValues } }
    }
    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsMultiTrueFalse}`}>
            {question.items.map(item => {
                const optionId = item.id
                const answer = currentAnswer.values[optionId]
                const isOptionAnsweredCorrectly = quizAnswers.value[question.id]?.result?.optionResults[optionId]
                let optionClassNames = styles.trueFalseOption
                if (isOptionAnsweredCorrectly !== undefined && showExplanation.value) {
                    optionClassNames += ` ${isOptionAnsweredCorrectly ? styles.answerCorrect : styles.answerWrong}`
                }
                return (
                    <div key={item.id}>
                        <label>{item.text}</label>
                        <br></br>
                        <div className={optionClassNames}>
                            <div role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onValueChange(optionId, false)} onClick={() => onValueChange(optionId, false)}><img src={answer === false ? wrongColored : wrong} /><p>False</p></div>
                            <div role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onValueChange(optionId, true)} onClick={() => onValueChange(optionId, true)}><img src={answer === true ? correctColored : correct} /><p>True</p></div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
function SortingView({ question }: { question: SortingQuestion }) {
    let currentAnswer = quizAnswers.value[question.id]
    if (!currentAnswer) {
        const shuffledIds = shuffle(question.items.map(x => x.id), question.prompt)
        const initialAnswer = { type: "sorting" as const, sortedIds: shuffledIds }
        quizAnswers.value = { ...quizAnswers.value, [question.id]: initialAnswer }
        currentAnswer = initialAnswer
    }
    if (currentAnswer.type !== 'sorting') return;
    const displayItems = currentAnswer.sortedIds.map(id => {
        return question.items.find(x => x.id === id)
    })
    function moveItem(index: number, direction: 'up' | 'down') {
        if (currentAnswer.type !== 'sorting') return;
        const newSortedIds = [...currentAnswer.sortedIds]
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSortedIds.length) {
            return
        }
        const temp = newSortedIds[targetIndex]
        newSortedIds[targetIndex] = newSortedIds[index]
        newSortedIds[index] = temp

        quizAnswers.value = {
            ...quizAnswers.value, [question.id]: {
                ...currentAnswer, sortedIds: newSortedIds
            }
        }
    }

    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsSorting}`}>
            {displayItems.map((item, index) => {
                if (!item) return
                const optionId = item.id
                const isOptionAnsweredCorrectly = quizAnswers.value[question.id]?.result?.optionResults[optionId]
                let optionClassNames = styles.sortOption
                if (isOptionAnsweredCorrectly !== undefined && showExplanation.value) {
                    optionClassNames += ` ${styles.showExplanation} ${isOptionAnsweredCorrectly ? styles.answerCorrect : styles.answerWrong}`
                }
                return (
                    <div key={item.id} className={optionClassNames}>
                        <p><span>{showExplanation.value ? (item.id) : (index + 1)}.</span> {item.text}</p>
                        <div className={styles.upDownArrows}>
                            <img role='button' tabIndex={0} onClick={() => moveItem(index, 'up')} src={upArrow} />
                            <img role='button' tabIndex={0} onClick={() => moveItem(index, 'down')} src={downArrow} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
function FillInBlanksView({ question }: { question: FillInBlanksQuestion }) {
    const currentAnswer = quizAnswers.value[question.id] || {
        type: 'fill-in-blanks',
        values: {}
    }
    if (currentAnswer.type !== 'fill-in-blanks') return;
    function fillBlank(blankId: number, value: string) {
        if (currentAnswer.type !== 'fill-in-blanks') return;
        const newBlankValues = { ...currentAnswer.values }
        newBlankValues[blankId] = value
        quizAnswers.value = {
            ...quizAnswers.value, [question.id]: {
                ...currentAnswer, values: newBlankValues
            }
        }

    }
    const parts = question.content.split(/(\{\{\d+\}\})/g);
    return (
        <div className={`${styles.quizOptions} ${styles.quizOptionsFillInBlanks}`}>
            <p className={styles.blankParagraph}>
                {parts.map((part, index) => {
                    // Check if the current part is a placeholder like {{1}}
                    const match = part.match(/\{\{(\d+)\}\}/);
                    if (match) {
                        const blankId = parseInt(match[1]);
                        console.log(question.blanks)
                        const correctBlankValue = question.blanks[blankId - 1].correctAnswer
                        const blankValue = currentAnswer.values[blankId] || ""
                        const optionId = blankId
                        const isOptionAnsweredCorrectly = quizAnswers.value[question.id]?.result?.optionResults[optionId]
                        let optionClassNames = styles.blankOption + " " + styles.inlineInput
                        if (isOptionAnsweredCorrectly !== undefined && showExplanation.value) {
                            optionClassNames += ` ${styles.showExplanation} ${isOptionAnsweredCorrectly ? styles.answerCorrect : styles.answerWrong}`
                        }
                        return (
                            <input
                                key={index}
                                type="text"
                                className={optionClassNames}
                                placeholder={`...`}
                                value={showExplanation.value ? correctBlankValue : blankValue}
                                onChange={(e) => { fillBlank(blankId, e.target.value) }}
                            />
                        );
                    }

                    // Otherwise, just return the text
                    return <span key={index}>{part}</span>;
                })}
            </p>
        </div>
    );
}


function OpenEndedView({ question }: { question: OpenEndedQuestion }) {
    const currentAnswer = quizAnswers.value[question.id] || {
        type: 'open-ended',
        values: {}
    }
    if (currentAnswer.type !== 'open-ended') return;

    function onValueChange(textAnswer: string) {
        if (currentAnswer.type !== 'open-ended') return;
        quizAnswers.value = { ...quizAnswers.value, [question.id]: { ...currentAnswer, answer: textAnswer } }
    }
    return (
        <div>
            <div>
                <textarea className={styles.openEndedAnswerBox} placeholder='Explain your answer here...' onChange={e => onValueChange(e.target.value)}></textarea>
            </div>
            {
                showExplanation.value && (
                    <div className={styles.explanationSection}>
                        <h4 className={styles.referenceTitle}>Reference Answer:</h4>
                        <p className={styles.referenceText}>
                            {question.answer}
                        </p>
                    </div>
                )
            }
        </div>

    );
}

function renderQuizOptions(question: QuizQuestion) {
    switch (question.type) {
        case 'multi-select':
            return <MultiSelectView question={question} />
        case 'single-select':
            return <SingleSelectView question={question} />
        case 'matching':
            return <MatchingView question={question} />
        case 'multi-true-false':
            return <MultiTrueFalseView question={question} />
        case 'sorting':
            return <SortingView question={question} />
        case 'fill-in-blanks':
            return <FillInBlanksView question={question} />
        case 'open-ended':
            return <OpenEndedView question={question} />
        default:
            return null;
    }
}
const processingAiReview = signal<number | null>(null)

/* async function isAnswerCorrect(question: QuizQuestion, answer: QuizAnswer): Promise<GradedAnswerResult> {
    let result: GradedAnswerResult = { isCorrect: false, grade: 0 }
    if (!answer) return result
    if (answer.type === 'fill-in-blanks' && question.type === 'fill-in-blanks') {
        const optionGradePoints = 10 / question.blanks.length

        for (const key of Object.keys(answer.values)) {
            const blankId = Number(key)
            const correctValue = question.blanks.find(x => x.id === blankId)?.correctAnswer
            const isCorrect = answer.values[blankId] === correctValue
            if (isCorrect) {
                result.grade += optionGradePoints
            }
        }
    }
    if (answer.type === 'sorting' && question.type === 'sorting') {
        const correctSort = question.items.map(x => x.id)
        const userSort = answer.sortedIds
        if (correctSort.length === userSort.length) {
            result.isCorrect = correctSort.every((value, index) => value === userSort[index])
        }

    }
    if (answer.type === 'multi-true-false' && question.type === 'multi-true-false') {
        for (const item of question.items) {
            result.isCorrect = answer.values[item.id] === item.isTrue;
            if (!result.isCorrect) break
        }
    }
    if (answer.type === 'matching' && question.type === 'matching') {
        for (const pair of question.pairs) {
            result.isCorrect = answer.pairs[pair.id] === pair.right
            if (!result.isCorrect) break
        }
    }
    if (answer.type === 'multi-select' && question.type === 'multi-select') {
        for (const option of question.options) {
            result.isCorrect = !!answer.values[option.id] === option.isCorrect
            if (!result.isCorrect) break
        }
    }
    if (answer.type === 'single-select' && question.type === 'single-select') {
        if (answer.selectedId) {
            result.isCorrect = answer.selectedId === question.correctOptionId
        }
    }
    if (answer.type === 'open-ended' && question.type === 'open-ended') {
        if (currentQuiz.value) {
            processingAiReview.value = question.id
            const questions = currentQuiz.value.questions
            const aiGrading = await AskAIToGradeOpenEndedQuestion(question, answer)
            result.isCorrect = aiGrading.isCorrect
            result.grade = aiGrading.grade
            currentQuiz.value = { ...currentQuiz.value, questions: questions.map(q => q.id === question.id ? { ...q, explanation: aiGrading.explanation } : q) }
            processingAiReview.value = null
        }
    }
    if (result.isCorrect && result.grade === 0) {
        result.grade = 10
    }
    return result
} */
async function isAnswerCorrect(question: QuizQuestion, answer: QuizAnswer): Promise<GradedAnswerResult> {
    let result: GradedAnswerResult = { isCorrect: false, grade: 0, optionResults: {}, optionsCount: 1, wrongOptionsCount: 0, correctOptionsCount: 0 }
    if (!answer) return result
    /* if (answer.type === 'fill-in-blanks' && question.type === 'fill-in-blanks') {
        const keys = Object.keys(answer.values)
        for (const key of keys) {
            const blankId = Number(key)
            const correctValue = question.blanks.find(x => x.id === blankId)?.correctAnswer
            const isCorrect = answer.values[blankId] === correctValue
            result.optionResults[blankId] = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
        result.optionsCount = keys.length
        result.isCorrect = result.correctOptionsCount === result.optionsCount
    } */
    if (answer.type === 'fill-in-blanks' && question.type === 'fill-in-blanks') {
        /* const keys = Object.keys(answer.values)
        for (const key of keys) {
            const blankId = Number(key)
            const correctValue = question.blanks.find(x => x.id === blankId)?.correctAnswer
            const isCorrect = answer.values[blankId] === correctValue
            result.optionResults[blankId] = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        } */
        for (const blank of question.blanks) {
            const optionId = blank.id
            const answeredValue = answer.values[optionId]
            const correctValue = blank.correctAnswer
            const isCorrect = answeredValue === correctValue
            result.optionResults[optionId] = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
        result.optionsCount = question.blanks.length
        result.isCorrect = result.correctOptionsCount === result.optionsCount
    }
    if (answer.type === 'sorting' && question.type === 'sorting') {
        const userSort = answer.sortedIds
        const optionsCount = question.items.length
        for (let i = 0; i < optionsCount; i++) {
            const correctSortedId = question.items[i].id
            const userSortedId = userSort[i]
            const isCorrect = typeof userSortedId === 'number' && correctSortedId === userSortedId;
            result.optionResults[correctSortedId] = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
        result.optionsCount = optionsCount
        result.isCorrect = result.correctOptionsCount === result.optionsCount
    }
    if (answer.type === 'multi-true-false' && question.type === 'multi-true-false') {
        for (const item of question.items) {
            const isCorrect = answer.values[item.id] === item.isTrue
            const optionId = item.id
            result.optionResults[optionId] = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
        result.optionsCount = question.items.length
        result.isCorrect = result.correctOptionsCount === result.optionsCount
    }

    if (answer.type === 'matching' && question.type === 'matching') {
        for (const pair of question.pairs) {
            const isCorrect = answer.pairs[pair.id] === pair.right
            const optionId = pair.id
            result.optionResults[optionId] = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
        result.optionsCount = question.pairs.length
        result.isCorrect = result.correctOptionsCount === result.optionsCount
    }
    if (answer.type === 'multi-select' && question.type === 'multi-select') {
        for (const option of question.options) {
            const isCorrect = !!answer.values[option.id] === option.isCorrect;
            const optionId = option.id;
            result.optionResults[optionId] = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
        result.optionsCount = question.options.length
        result.isCorrect = result.correctOptionsCount === result.optionsCount
    }

    if (answer.type === 'single-select' && question.type === 'single-select') {
        if (answer.selectedId) {
            const isCorrect = answer.selectedId === question.correctOptionId
            result.optionResults[0] = isCorrect
            result.isCorrect = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
    }
    if (answer.type === 'open-ended' && question.type === 'open-ended') {
        if (currentQuiz.value) {
            processingAiReview.value = question.id
            const questions = currentQuiz.value.questions
            const aiGrading = await AskAIToGradeOpenEndedQuestion(question, answer)
            const isCorrect = aiGrading.isCorrect
            result.grade = aiGrading.grade
            currentQuiz.value = { ...currentQuiz.value, questions: questions.map(q => q.id === question.id ? { ...q, explanation: aiGrading.explanation } : q) }
            processingAiReview.value = null

            result.optionResults[0] = isCorrect
            result.isCorrect = isCorrect
            if (isCorrect) {
                result.correctOptionsCount++
            } else {
                result.wrongOptionsCount++
            }
        }
    }
    if (question.type !== 'open-ended' && result.optionsCount > 0) {
        const optionPoints = 10 / result.optionsCount
        result.grade = result.isCorrect ? 10 : optionPoints * result.correctOptionsCount
    }
    return result
}
async function answer() {
    if (!currentQuiz.value) return
    const question = currentQuiz.value.questions[currentQuestionIndex.value]
    if (!quizAnswers.value[question.id]) {
        let defaultAnswer: QuizAnswer | undefined;
        if (question.type === 'multi-select') {
            defaultAnswer = { type: question.type, values: {} }
        }
        if (question.type === 'multi-true-false') {
            defaultAnswer = { type: question.type, values: {} }
        }
        if (question.type === 'sorting') {
            const shuffledIds = shuffle(question.items.map(x => x.id), question.prompt);
            defaultAnswer = { type: question.type, sortedIds: shuffledIds }
        }
        if (question.type === 'fill-in-blanks') {
            defaultAnswer = { type: question.type, values: {} }
        }
        if (question.type === 'open-ended') {
            defaultAnswer = { type: question.type, answer: "" }
        }
        if (question.type === 'single-select') {
            defaultAnswer = { type: question.type, selectedId: null }
        }
        if (defaultAnswer) {
            quizAnswers.value = { ...quizAnswers.value, [question.id]: defaultAnswer }
        }
    }
    const existingAnswer = quizAnswers.value[question.id]

    if (question.type === 'open-ended') {
        if (existingAnswer.type === 'open-ended') {
            if (existingAnswer.answer?.trim() === "") {
                showMessage({
                    title: "Empty answer",
                    content: 'Please write something in the textbox',
                    type: 'error',
                    duration: 4000
                })
                return
            }
            if (processingAiReview.value !== null) {
                showMessage({
                    title: "Please wait",
                    content: 'Please wait a bit untill ai finishs the review for the answer',
                    type: 'error',
                    duration: 4000
                })
                return
            }
        }
    } else {
        if (processingAiReview.value !== null) {
            showMessage({
                title: "Answer type mismatch",
                content: 'Check why the answer type is open-ended type',
                type: 'error',
                duration: 4000
            })
            return
        }
    }
    const isCorrectResult = await safe(isAnswerCorrect(question, existingAnswer))
    if (isCorrectResult.success) {
        quizAnswers.value = { ...quizAnswers.value, [question.id]: { ...existingAnswer, result: isCorrectResult.data } }
        localStorage.setItem(LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY, JSON.stringify(quizAnswers.value))
        if (isCorrectResult.data.isCorrect && showExplanation.value) {
            showExplanation.value = false
        }
    } else {
        showMessage({
            title: "Error checking answer",
            content: isCorrectResult.error.toString(),
            type: 'error',
            duration: 4000
        })
    }

}


/* function QuestionNavigationAndProgressIndicatorView() {
    if (!currentQuiz.value) return
    return (<>
        <div className={styles.questionButtons}>
            {currentQuiz.value.questions.map((question, index) => {
                const answer = quizAnswers.value[question.id]?.result?.isCorrect
                let buttonClassName = styles.questionButtonNoAnswer
                if (answer !== undefined) {
                    const isAnsweredCorrectly = answer
                    buttonClassName = isAnsweredCorrectly ? styles.questionButtonCorrect : styles.questionButtonWrong
                    if (!instantFeedbackEnabled.value) {
                        buttonClassName = styles.questionButtonAnswered
                    }
                }

                if (index === currentQuestionIndex.value) {
                    buttonClassName += ` ${styles.questionButtonSelected}`
                }
                return (<button onClick={() => currentQuestionIndex.value = index} className={buttonClassName} key={index}>
                    {index + 1}
                </button>)
            })}
        </div></>)
}
 */




function QuestionNavigationAndProgressIndicatorView() {
    if (!currentQuiz.value) return
    const questionsCount = currentQuiz.value.questions.length
    const chunkSize = 10
    const currentChunkIndex = Math.floor(currentQuestionIndex.value / chunkSize)
    const chunkItems = []
    for (let i = currentChunkIndex * chunkSize; i < (Math.min(questionsCount, (currentChunkIndex + 1) * chunkSize)); i++) {
        chunkItems.push(i)
    }
    return (<>
        <div className={styles.questionButtons}>
            {chunkItems.map(questionIndex => {
                if (!currentQuiz.value) return null
                const question = currentQuiz.value.questions[questionIndex]
                const answer = quizAnswers.value[question.id]?.result?.isCorrect
                let buttonClassName = styles.questionButtonNoAnswer
                if (answer !== undefined) {
                    const isAnsweredCorrectly = answer
                    buttonClassName = isAnsweredCorrectly ? styles.questionButtonCorrect : styles.questionButtonWrong
                    if (!instantFeedbackEnabled.value) {
                        buttonClassName = styles.questionButtonAnswered
                    }
                }

                if (questionIndex === currentQuestionIndex.value) {
                    buttonClassName += ` ${styles.questionButtonSelected}`
                }
                return (<button onClick={() => currentQuestionIndex.value = questionIndex} className={buttonClassName} key={questionIndex}>
                    {questionIndex + 1}
                </button>)
            })}
        </div>
        {/* <pre>
            {JSON.stringify({
                currentChunkIndex,
                items: chunkItems
            }, null, 2)}
        </pre> */}
    </>)
}

function saveAnswersToLocalStorage() {

}

import { LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY, LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY } from '../../common/config';
import { AskAIToGradeOpenEndedQuestion, getQustionTypeImage } from '../../utils';
import { safe } from '../../utils/safe';
const showExplanation = signal<boolean>(false)
export default function Quiz() {
    const navigate = useNavigate();
    useEffect(() => {
        if (!currentQuiz.value) {
            const currentQuizRaw = localStorage.getItem(LAST_SELECTED_QUIZ_DATA_LOCALSTORAGE_KEY)
            if (currentQuizRaw) {
                currentQuiz.value = JSON.parse(currentQuizRaw)
                // Also reset the index to 0 when loading a new quiz
                currentQuestionIndex.value = 0;
            } else {
                // If there's truly no quiz data anywhere, go home
                navigate("/");
            }
        }
        if (Object.keys(quizAnswers.value).length === 0) {
            const quizAnswersRaw = localStorage.getItem(LAST_SELECTED_QUIZ_ANSWERS_LOCALSTORAGE_KEY)
            quizAnswers.value = JSON.parse(quizAnswersRaw || '{}')
        }
        function handleKeyDown(event: globalThis.KeyboardEvent) {
            const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
            if (isTyping) return
            const key = event.key.toLowerCase()
            if (key === 'a') {
                previous()
            } else if (key === 'd') {
                next()
            }

        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, []);
    useEffect(() => {
        showExplanation.value = false
    }, [currentQuestionIndex.value])

    if (!currentQuiz.value) return

    const question: QuizQuestion = currentQuiz.value.questions[currentQuestionIndex.value];
    if (!question) return
    const answerResult = quizAnswers.value[question.id]?.result?.isCorrect
    const answerGrade = quizAnswers.value[question.id]?.result?.grade
    let shouldShowExplanation = false
    let answerStyleClass = styles.noAnswer;
    let answerResultMessage = "";

    if (processingAiReview.value === question.id) {
        answerResultMessage = "Please wait for answer review."
        answerStyleClass = styles.pending
    } else {
        if (answerResult !== undefined) {
            if (answerResult) {
                answerStyleClass = styles.correct
                answerResultMessage = "Correct"
                shouldShowExplanation = true
            } else {
                answerStyleClass = styles.wrong
                answerResultMessage = "Wrong Answer"
                shouldShowExplanation = showExplanation.value
            }
            answerStyleClass = answerResult ? styles.correct : styles.wrong
            if (question.type === 'open-ended' && answerGrade !== undefined) {
                answerResultMessage += ` | ${answerGrade}`
            }

        }
    }
    function toggleExplanation() {
        const currentQuestionType = currentQuiz.value?.questions[currentQuestionIndex.value].type
        if (currentQuestionType && currentQuestionType !== 'open-ended' && !showExplanation.value && question) {
            answer()
        }
        showExplanation.value = !showExplanation.value
    }

    const questionTypeImage = getQustionTypeImage(question)
    return (
        <div className={styles.container}>
            <div className={`${styles.quiz} ${answerStyleClass}`}>
                <QuestionNavigationAndProgressIndicatorView />
                <div className={styles.questionHeader}>
                    <img src={questionTypeImage} />
                    <h1>{question.id}. {question.prompt}</h1>
                </div>
                {renderQuizOptions(question)}
                <div className={styles.questionNavigationButtons}>
                    <button onClick={previous}>Previous</button>
                    <button onClick={next}>Next</button>
                    <button onClick={answer}>Answer</button>
                    <button onClick={() => navigate('/quiz-grade')}>Finish</button>
                    <button onClick={() => instantFeedbackEnabled.value = !instantFeedbackEnabled.value}>Instant feedback {instantFeedbackEnabled.value ? 'Off' : 'On'}</button>
                    <button onClick={() => navigate('/quiz-edit')}>Edit</button>
                    <button onClick={() => navigate('/')}>Choose another quiz</button>
                </div>
                {instantFeedbackEnabled.value && <div className={`${styles.answerResult} ${answerStyleClass}`}>
                    <h1>{answerResultMessage}</h1>
                    {question.explanation && answerResult === false && <button className={styles.explanationButton} onClick={toggleExplanation}>{showExplanation.value ? "Hide Explanation" : "Show Explanation"}</button>}
                    <h2>{shouldShowExplanation && question.explanation}</h2>
                    {/* {question.explanation && !showExplanation.value && answerResult === false && <button onClick={() => showExplanation.value = true}>Show Explanation</button>} */}

                </div>}

            </div>
        </div>
    )
}

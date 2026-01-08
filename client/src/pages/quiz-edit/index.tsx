import styles from "./style.module.css"
import { currentQuiz, quizAnswers, currentQuestionIndex, instantFeedbackEnabled } from '../../store/quizStore';
import { useNavigate } from "react-router-dom";
import { getQustionTypeImage } from "../../utils";
import type { QuizQuestion } from "../../common/types";
import { correctColored, garbage, questionmark, wrongColored } from "../../images";
import { signal } from "@preact/signals-react";


function QuestionOptionsView({ question }: { question: QuizQuestion }) {

    return (<>
        {question.type === 'fill-in-blanks' && (
            <div className={styles.questionOptions}>
                <div>
                    <p>{question.content}</p>
                </div>
                {question.blanks.map(x => {
                    return (<div>
                        <p>{x.id}. {x.correctAnswer}</p>
                    </div>)
                })}
            </div>
        )}
        {question.type === 'multi-true-false' && (
            <div className={styles.questionOptions}>
                <div >
                    <p >{question.prompt}</p>
                </div>
                <div className={styles.options}>
                    {question.items.map(x => {
                        return (<div className={styles.trueFalseOption}>
                            <img src={x.isTrue ? correctColored : wrongColored} /><p> <span className={x.isTrue ? styles.true : styles.false}>{x.id}. {x.statement}</span></p>
                        </div>)
                    })}
                </div>
            </div>
        )}
        {question.type === 'matching' && (
            <div className={styles.questionOptions}>
                {question.pairs.map(x => {
                    return (<div className={styles.matchingOption}>
                        <p>{x.id}. <span>{x.left}</span> -  {x.right}</p>
                    </div>)
                })}
            </div>
        )}
        {question.type === 'sorting' && (
            <div className={styles.questionOptions}>
                {question.items.map(x => {
                    return (<div>
                        <p>{x.id}. {x.text}</p>
                    </div>)
                })}
            </div>
        )}
        {question.type === 'multiple-choice' && (
            <div className={styles.questionOptions}>
                {question.options.map(x => {
                    return (<div>
                        <p className={x.isCorrect ? styles.selected : ""}>{x.id}. {x.text}</p>
                    </div>)
                })}
            </div>
        )}
    </>)
}
const markedDeletedQuestions = signal<Record<number, boolean>>({});
export default function QuizEdit() {
    const navigate = useNavigate()
    if (!currentQuiz.value) {
        navigate("/")
    }
    function onToggleDeleteQuestion(question: QuizQuestion) {
        let isDeleted = markedDeletedQuestions.value[question.id] ?? false
        markedDeletedQuestions.value = { ...markedDeletedQuestions.value, [question.id]: !isDeleted }
    }
    return (<div className={styles.container}>
        <h1>Quiz edit</h1>
        <div className={styles.questions}>
            {currentQuiz.value?.questions.map((question) => {
                const isDeleted = markedDeletedQuestions.value[question.id]
                return (<div key={question.id} className={`${styles.question} ${isDeleted ? styles.deleted : ""}`}>
                    <div className={styles.dividerContainer}>
                        <p>{question.id}</p>
                        <div className={styles.divider}></div>
                        <img onClick={() => onToggleDeleteQuestion(question)} src={garbage} className={styles.deleteButton} />
                    </div>

                    <div className={styles.questionPromptContainer}>
                        <img src={getQustionTypeImage(question)} />
                        <p className={styles.questionPromptText}>{question.prompt}</p>
                    </div>
                    <QuestionOptionsView question={question} />
                    <div className={styles.explanation}>
                        <img src={questionmark} />
                        <p>{question.explanation}</p>
                    </div>
                </div>)
            })}
        </div>
    </div>)
}
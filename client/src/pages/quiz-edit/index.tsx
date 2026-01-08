import styles from "./style.module.css"
import { currentQuiz, quizAnswers, currentQuestionIndex, instantFeedbackEnabled } from '../../store/quizStore';
import { useNavigate } from "react-router-dom";
import { getQustionTypeImage } from "../../utils";
import type { QuizQuestion } from "../../common/types";
import { correctColored, questionmark, wrongColored } from "../../images";


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
                    return (<div>
                        <p>{x.id}. {x.left} -  {x.right}</p>
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

export default function QuizEdit() {
    const navigate = useNavigate()
    if (!currentQuiz.value) {
        navigate("/")
    }
    return (<div className={styles.container}>
        <h1>Quiz edit</h1>
        <div className={styles.questions}>
            {currentQuiz.value?.questions.map((question) => {
                return (<div key={question.id} className={styles.question}>
                    <div className={styles.dividerContainer}>
                        <p>{question.id}</p>
                        <div className={styles.divider}></div>
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
import type { QuizQuestion } from "../common/types";
import { errorImage, filleBlankQuestion, matchQuestion, selectMultiQuestion, sortQuestion, trueFalseQuestion } from "../images";

export function getQustionTypeImage(question: QuizQuestion): string {
    switch (question.type) {
        case "multiple-choice":
            return selectMultiQuestion
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
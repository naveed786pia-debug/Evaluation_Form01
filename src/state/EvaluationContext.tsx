import { createContext, ReactNode, useContext, useMemo, useReducer } from "react";
import { defaultTemplate, templates } from "../data/templates";
import {
  EvaluationRecord,
  EvaluationResponse,
  EvaluationTemplate,
  TemplateQuestion
} from "../types/evaluation";

export type EvaluationSubmission = {
  templateId: string;
  subjectName: string;
  subjectRole: string;
  evaluatorName: string;
  evaluationDate: string;
  notes: string;
  responses: Array<{
    questionId: string;
    rating: number;
    comment: string;
  }>;
};

type EvaluationState = {
  templates: EvaluationTemplate[];
  evaluations: EvaluationRecord[];
};

type EvaluationAction =
  | { type: "submit"; payload: EvaluationSubmission }
  | { type: "reset" };

type EvaluationContextValue = EvaluationState & {
  submitEvaluation: (submission: EvaluationSubmission) => EvaluationRecord;
  getTemplateById: (id: string) => EvaluationTemplate | undefined;
};

const EvaluationContext = createContext<EvaluationContextValue | undefined>(undefined);

const initialState: EvaluationState = {
  templates,
  evaluations: []
};

const calculateResponseScore = (question: TemplateQuestion, rating: number): number => {
  if (question.maxRating === 0) {
    return 0;
  }
  const boundedRating = Math.min(Math.max(rating, 0), question.maxRating);
  return (boundedRating / question.maxRating) * question.weight;
};

const submitEvaluationReducer = (
  state: EvaluationState,
  action: EvaluationAction
): EvaluationState => {
  switch (action.type) {
    case "submit": {
      const template = state.templates.find((item) => item.id === action.payload.templateId) ?? defaultTemplate;
      const responses: EvaluationResponse[] = action.payload.responses.map((input) => {
        const question = template.questions.find((questionItem) => questionItem.id === input.questionId);
        if (!question) {
          throw new Error(`Question ${input.questionId} does not exist in template ${template.id}`);
        }
        const scoreContribution = calculateResponseScore(question, input.rating);
        return {
          questionId: input.questionId,
          rating: Number(input.rating.toFixed(2)),
          comment: input.comment,
          scoreContribution: Number(scoreContribution.toFixed(4))
        };
      });

      const overallScore = responses.reduce((total, response) => total + response.scoreContribution, 0);
      const evaluation: EvaluationRecord = {
        id: `evaluation-${Date.now()}`,
        templateId: template.id,
        subjectName: action.payload.subjectName,
        subjectRole: action.payload.subjectRole,
        evaluatorName: action.payload.evaluatorName,
        evaluationDate: action.payload.evaluationDate,
        notes: action.payload.notes,
        responses,
        overallScore: Number(overallScore.toFixed(2)),
        createdAt: new Date().toISOString()
      };

      return {
        ...state,
        evaluations: [evaluation, ...state.evaluations]
      };
    }
    case "reset":
      return initialState;
    default:
      return state;
  }
};

export const EvaluationProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(submitEvaluationReducer, initialState);

  const contextValue = useMemo<EvaluationContextValue>(() => {
    const submitEvaluation = (submission: EvaluationSubmission) => {
      dispatch({ type: "submit", payload: submission });
      const template = state.templates.find((item) => item.id === submission.templateId) ?? defaultTemplate;
      const responses: EvaluationResponse[] = submission.responses.map((input) => {
        const question = template.questions.find((questionItem) => questionItem.id === input.questionId);
        if (!question) {
          throw new Error(`Question ${input.questionId} does not exist in template ${template.id}`);
        }
        const scoreContribution = calculateResponseScore(question, input.rating);
        return {
          questionId: input.questionId,
          rating: Number(input.rating.toFixed(2)),
          comment: input.comment,
          scoreContribution: Number(scoreContribution.toFixed(4))
        };
      });

      const overallScore = responses.reduce((total, response) => total + response.scoreContribution, 0);
      return {
        id: `evaluation-${Date.now()}`,
        templateId: submission.templateId,
        subjectName: submission.subjectName,
        subjectRole: submission.subjectRole,
        evaluatorName: submission.evaluatorName,
        evaluationDate: submission.evaluationDate,
        notes: submission.notes,
        responses,
        overallScore: Number(overallScore.toFixed(2)),
        createdAt: new Date().toISOString()
      } satisfies EvaluationRecord;
    };

    return {
      templates: state.templates,
      evaluations: state.evaluations,
      submitEvaluation,
      getTemplateById: (id: string) => state.templates.find((item) => item.id === id)
    };
  }, [state.templates, state.evaluations]);

  return <EvaluationContext.Provider value={contextValue}>{children}</EvaluationContext.Provider>;
};

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error("useEvaluation must be used within an EvaluationProvider");
  }
  return context;
};

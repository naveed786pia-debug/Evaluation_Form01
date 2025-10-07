export type TemplateQuestion = {
  id: string;
  text: string;
  guidance?: string;
  weight: number;
  maxRating: number;
};

export type EvaluationTemplate = {
  id: string;
  name: string;
  description?: string;
  maxScore: number;
  createdBy: string;
  questions: TemplateQuestion[];
};

export type EvaluationResponse = {
  questionId: string;
  rating: number;
  comment: string;
  scoreContribution: number;
};

export type EvaluationRecord = {
  id: string;
  templateId: string;
  subjectName: string;
  subjectRole: string;
  evaluatorName: string;
  evaluationDate: string;
  notes: string;
  responses: EvaluationResponse[];
  overallScore: number;
  createdAt: string;
};

import { EvaluationTemplate } from "../types/evaluation";

export const defaultTemplate: EvaluationTemplate = {
  id: "template-001",
  name: "Quarterly Performance Review",
  description: "Standard rubric for evaluating quarterly objectives and competencies.",
  maxScore: 100,
  createdBy: "HR Team",
  questions: [
    {
      id: "q-1",
      text: "Delivers on quarterly goals and key results.",
      guidance: "Consider goal completion rates and measurable outcomes.",
      weight: 30,
      maxRating: 5
    },
    {
      id: "q-2",
      text: "Demonstrates collaboration and teamwork.",
      guidance: "Evaluate communication, supportiveness, and cross-team work.",
      weight: 20,
      maxRating: 5
    },
    {
      id: "q-3",
      text: "Shows initiative and innovation in problem solving.",
      guidance: "Look for proactive improvements and creative solutions.",
      weight: 25,
      maxRating: 5
    },
    {
      id: "q-4",
      text: "Maintains quality standards and attention to detail.",
      guidance: "Assess accuracy, thoroughness, and adherence to process.",
      weight: 15,
      maxRating: 5
    },
    {
      id: "q-5",
      text: "Supports professional development and learning.",
      guidance: "Consider mentorship, self-learning, and knowledge sharing.",
      weight: 10,
      maxRating: 5
    }
  ]
};

export const templates: EvaluationTemplate[] = [defaultTemplate];

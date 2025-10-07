import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvaluation } from "../../state/EvaluationContext";
import { EvaluationResponse, TemplateQuestion } from "../../types/evaluation";
import "./evaluation-form-page.css";

type ResponseDraft = {
  questionId: string;
  rating: number;
  comment: string;
};

const clampRating = (rating: number, maxRating: number) => {
  if (Number.isNaN(rating)) {
    return 0;
  }
  return Math.max(0, Math.min(rating, maxRating));
};

const computeScore = (question: TemplateQuestion, rating: number) => {
  if (question.maxRating === 0) {
    return 0;
  }
  return (rating / question.maxRating) * question.weight;
};

export const EvaluationFormPage = () => {
  const navigate = useNavigate();
  const { templates, submitEvaluation } = useEvaluation();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const template = useMemo(() => templates.find((item) => item.id === templateId), [templateId, templates]);

  const [subjectName, setSubjectName] = useState("");
  const [subjectRole, setSubjectRole] = useState("");
  const [evaluatorName, setEvaluatorName] = useState("");
  const [evaluationDate, setEvaluationDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [draftResponses, setDraftResponses] = useState<ResponseDraft[]>(() =>
    template?.questions.map((question) => ({ questionId: question.id, rating: 0, comment: "" })) ?? []
  );
  const [submissionPreview, setSubmissionPreview] = useState<EvaluationResponse[] | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const overallScore = useMemo(() => {
    if (!template) {
      return 0;
    }
    return draftResponses.reduce((total, response) => {
      const question = template.questions.find((item) => item.id === response.questionId);
      if (!question) {
        return total;
      }
      return total + computeScore(question, response.rating);
    }, 0);
  }, [draftResponses, template]);

  const handleTemplateChange = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    const nextTemplate = templates.find((item) => item.id === nextTemplateId);
    setDraftResponses(
      nextTemplate?.questions.map((question) => ({ questionId: question.id, rating: 0, comment: "" })) ?? []
    );
    setSubmissionPreview(null);
  };

  const updateDraft = (question: TemplateQuestion, rating: number, comment: string) => {
    setDraftResponses((current) =>
      current.map((response) =>
        response.questionId === question.id
          ? { questionId: question.id, rating: clampRating(rating, question.maxRating), comment }
          : response
      )
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!template) {
      setSubmissionError("A template must be selected before submitting the evaluation.");
      return;
    }

    const missingResponse = draftResponses.find((response) => Number.isNaN(response.rating));
    if (missingResponse) {
      setSubmissionError("All questions must have a rating.");
      return;
    }

    try {
      const evaluation = submitEvaluation({
        templateId: template.id,
        subjectName,
        subjectRole,
        evaluatorName,
        evaluationDate,
        notes,
        responses: draftResponses
      });
      setSubmissionError(null);
      setSubmissionPreview(evaluation.responses);
      setSubjectName("");
      setSubjectRole("");
      setEvaluatorName("");
      setNotes("");
      setDraftResponses(
        template.questions.map((question) => ({ questionId: question.id, rating: 0, comment: "" }))
      );
      setTimeout(() => {
        navigate("/reports", { replace: false, state: { highlightEvaluationId: evaluation.id } });
      }, 600);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Failed to submit evaluation.");
    }
  };

  const scoreBreakdown = useMemo(() => {
    if (!template) {
      return [] as Array<{ question: TemplateQuestion; response: ResponseDraft; score: number }>;
    }
    return draftResponses.map((response) => {
      const question = template.questions.find((item) => item.id === response.questionId)!;
      return {
        question,
        response,
        score: Number(computeScore(question, response.rating).toFixed(2))
      };
    });
  }, [draftResponses, template]);

  if (!template) {
    return (
      <section className="evaluation-form">
        <div className="form-wrapper">
          <h1 className="form-title">Create an Evaluation</h1>
          <p className="form-message">No templates available. Add a template to begin.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="evaluation-form">
      <form className="form-wrapper" onSubmit={handleSubmit}>
        <header className="form-header">
          <div>
            <h1 className="form-title">Evaluation Entry</h1>
            <p className="form-subtitle">Record ratings, comments, and automatically compute weighted scores.</p>
          </div>
          <div className="template-select-group">
            <label className="field-label" htmlFor="template-id">
              Template
            </label>
            <select
              id="template-id"
              className="field-select"
              value={templateId}
              onChange={(event) => handleTemplateChange(event.target.value)}
            >
              {templates.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="details-grid">
          <div className="field-column">
            <label className="field-label" htmlFor="subject-name">
              Person being evaluated
            </label>
            <input
              id="subject-name"
              className="field-input"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              required
            />
          </div>
          <div className="field-column">
            <label className="field-label" htmlFor="subject-role">
              Role or team
            </label>
            <input
              id="subject-role"
              className="field-input"
              value={subjectRole}
              onChange={(event) => setSubjectRole(event.target.value)}
              placeholder="e.g. Product Engineering"
            />
          </div>
          <div className="field-column">
            <label className="field-label" htmlFor="evaluator-name">
              Evaluator name
            </label>
            <input
              id="evaluator-name"
              className="field-input"
              value={evaluatorName}
              onChange={(event) => setEvaluatorName(event.target.value)}
              required
            />
          </div>
          <div className="field-column">
            <label className="field-label" htmlFor="evaluation-date">
              Evaluation date
            </label>
            <input
              id="evaluation-date"
              type="date"
              className="field-input"
              value={evaluationDate}
              onChange={(event) => setEvaluationDate(event.target.value)}
              required
            />
          </div>
        </section>

        <section className="notes-section">
          <label className="field-label" htmlFor="notes">
            Summary notes
          </label>
          <textarea
            id="notes"
            className="field-textarea"
            value={notes}
            rows={4}
            placeholder="Capture key highlights or action items"
            onChange={(event) => setNotes(event.target.value)}
          />
        </section>

        <section className="question-list">
          {template.questions.map((question) => {
            const draft = draftResponses.find((item) => item.questionId === question.id)!;
            const score = scoreBreakdown.find((item) => item.question.id === question.id)?.score ?? 0;
            return (
              <article key={question.id} className="question-card">
                <header className="question-header">
                  <h2 className="question-title">{question.text}</h2>
                  <span className="score-badge">
                    {score.toFixed(2)} / {question.weight.toFixed(2)} pts
                  </span>
                </header>
                {question.guidance ? <p className="question-guidance">{question.guidance}</p> : null}
                <div className="question-body">
                  <label className="field-label" htmlFor={`rating-${question.id}`}>
                    Rating (0 – {question.maxRating})
                  </label>
                  <input
                    id={`rating-${question.id}`}
                    type="range"
                    className="rating-slider"
                    min={0}
                    max={question.maxRating}
                    step={0.5}
                    value={draft.rating}
                    onChange={(event) =>
                      updateDraft(
                        question,
                        clampRating(Number(event.target.value), question.maxRating),
                        draft.comment
                      )
                    }
                  />
                  <div className="slider-value">{draft.rating.toFixed(1)}</div>
                  <label className="field-label" htmlFor={`comment-${question.id}`}>
                    Comment
                  </label>
                  <textarea
                    id={`comment-${question.id}`}
                    className="field-textarea"
                    value={draft.comment}
                    rows={3}
                    onChange={(event) => updateDraft(question, draft.rating, event.target.value)}
                  />
                </div>
              </article>
            );
          })}
        </section>

        <section className="summary-panel">
          <div className="summary-content">
            <h2 className="summary-title">Weighted total</h2>
            <p className="summary-score">
              {overallScore.toFixed(2)} / {template.maxScore.toFixed(2)} pts
            </p>
            <p className="summary-text">
              Overall scores are automatically normalized to the template weightings.
            </p>
          </div>
          <button className="submit-button" type="submit">
            Save evaluation
          </button>
        </section>

        {submissionError ? <p className="error-banner">{submissionError}</p> : null}
        {submissionPreview ? (
          <section className="preview-panel">
            <h3 className="preview-title">Latest submission summary</h3>
            <ul className="preview-list">
              {submissionPreview.map((response) => {
                const question = template.questions.find((item) => item.id === response.questionId)!;
                return (
                  <li key={response.questionId} className="preview-item">
                    <span className="preview-question">{question.text}</span>
                    <span className="preview-answer">
                      {response.rating.toFixed(1)} / {question.maxRating} → {response.scoreContribution.toFixed(2)} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </form>
    </section>
  );
};

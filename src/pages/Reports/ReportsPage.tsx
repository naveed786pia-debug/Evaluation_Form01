import { useEffect, useMemo, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useEvaluation } from "../../state/EvaluationContext";
import { EvaluationRecord, EvaluationTemplate } from "../../types/evaluation";
import "./reports-page.css";

type TemplateAggregate = {
  template: EvaluationTemplate;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  evaluationCount: number;
  byQuestion: Array<{
    questionId: string;
    questionText: string;
    averageRating: number;
    averageContribution: number;
  }>;
};

const buildAggregate = (template: EvaluationTemplate, evaluations: EvaluationRecord[]): TemplateAggregate => {
  if (evaluations.length === 0) {
    return {
      template,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      evaluationCount: 0,
      byQuestion: template.questions.map((question) => ({
        questionId: question.id,
        questionText: question.text,
        averageRating: 0,
        averageContribution: 0
      }))
    };
  }

  const overallScores = evaluations.map((evaluation) => evaluation.overallScore);
  const averageScore = overallScores.reduce((total, score) => total + score, 0) / evaluations.length;
  const highestScore = Math.max(...overallScores);
  const lowestScore = Math.min(...overallScores);

  const byQuestion = template.questions.map((question) => {
    const responses = evaluations
      .flatMap((evaluation) => evaluation.responses)
      .filter((response) => response.questionId === question.id);

    if (responses.length === 0) {
      return {
        questionId: question.id,
        questionText: question.text,
        averageRating: 0,
        averageContribution: 0
      };
    }

    const averageRating =
      responses.reduce((total, response) => total + response.rating, 0) / responses.length;
    const averageContribution =
      responses.reduce((total, response) => total + response.scoreContribution, 0) / responses.length;

    return {
      questionId: question.id,
      questionText: question.text,
      averageRating,
      averageContribution
    };
  });

  return {
    template,
    averageScore,
    highestScore,
    lowestScore,
    evaluationCount: evaluations.length,
    byQuestion
  };
};

const buildCsv = (evaluations: EvaluationRecord[], template: EvaluationTemplate | undefined) => {
  const headers = [
    "EvaluationId",
    "TemplateId",
    "SubjectName",
    "SubjectRole",
    "EvaluatorName",
    "EvaluationDate",
    "OverallScore"
  ];
  const rows = evaluations.map((evaluation) => [
    evaluation.id,
    evaluation.templateId,
    evaluation.subjectName,
    evaluation.subjectRole,
    evaluation.evaluatorName,
    evaluation.evaluationDate,
    evaluation.overallScore.toFixed(2)
  ]);

  const questionHeaders = template?.questions.map((question) => `Q:${question.id}`) ?? [];
  const questionRows = evaluations.map((evaluation) =>
    template?.questions.map((question) => {
      const response = evaluation.responses.find((item) => item.questionId === question.id);
      return response ? response.rating.toFixed(1) : "";
    }) ?? []
  );

  const combinedRows = rows.map((row, index) => [...row, ...questionRows[index]]);
  const allHeaders = [...headers, ...questionHeaders];

  return [allHeaders, ...combinedRows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
};

export const ReportsPage = () => {
  const { evaluations, templates } = useEvaluation();
  const location = useLocation();
  const highlightEvaluationId = (location.state as { highlightEvaluationId?: string } | null)?.highlightEvaluationId;
  const highlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highlightEvaluationId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightEvaluationId]);

  const defaultTemplate = templates[0];
  const aggregate = useMemo(() =>
    defaultTemplate
      ? buildAggregate(
          defaultTemplate,
          evaluations.filter((evaluation) => evaluation.templateId === defaultTemplate.id)
        )
      : null,
    [defaultTemplate, evaluations]
  );

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(evaluations, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "evaluations.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = buildCsv(evaluations, defaultTemplate);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "evaluations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!defaultTemplate) {
    return (
      <section className="reports-page">
        <div className="report-card">
          <h1 className="report-title">Reports unavailable</h1>
          <p className="report-subtitle">Create an evaluation template to unlock reporting.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="reports-page">
      <div className="report-card">
        <header className="report-header">
          <div>
            <h1 className="report-title">Evaluation Insights</h1>
            <p className="report-subtitle">
              Monitor performance trends, compare scores, and export raw data for deeper analysis.
            </p>
          </div>
          <div className="export-actions">
            <button className="export-button" type="button" onClick={handleExportJson}>
              Export JSON
            </button>
            <button className="export-button" type="button" onClick={handleExportCsv}>
              Export CSV
            </button>
          </div>
        </header>

        {aggregate && aggregate.evaluationCount > 0 ? (
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">Average score</span>
              <span className="summary-value">{aggregate.averageScore.toFixed(2)}%</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Highest score</span>
              <span className="summary-value">{aggregate.highestScore.toFixed(2)}%</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Lowest score</span>
              <span className="summary-value">{aggregate.lowestScore.toFixed(2)}%</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Evaluations logged</span>
              <span className="summary-value">{aggregate.evaluationCount}</span>
            </div>
          </div>
        ) : (
          <p className="empty-state">
            Reports appear once evaluations are saved. <Link to="/evaluate">Log your first evaluation</Link> to see
            charts and stats.
          </p>
        )}

        {aggregate && aggregate.evaluationCount > 0 ? (
          <section className="question-analytics">
            <h2 className="section-title">Question performance</h2>
            <div className="question-table">
              {aggregate.byQuestion.map((row) => (
                <div key={row.questionId} className="question-row">
                  <div className="question-metric">
                    <span className="question-text">{row.questionText}</span>
                    <span className="question-subtext">Average rating {row.averageRating.toFixed(2)} / 5</span>
                  </div>
                  <span className="question-score">{row.averageContribution.toFixed(2)} pts</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {evaluations.length > 0 ? (
          <section className="evaluations-list">
            <h2 className="section-title">Recent evaluations</h2>
            <div className="evaluation-grid">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  ref={evaluation.id === highlightEvaluationId ? highlightRef : null}
                  className={`evaluation-card${evaluation.id === highlightEvaluationId ? " evaluation-card--highlight" : ""}`}
                >
                  <div className="evaluation-header">
                    <span className="evaluation-title">{evaluation.subjectName}</span>
                    <span className="evaluation-score">{evaluation.overallScore.toFixed(2)}%</span>
                  </div>
                  <p className="evaluation-meta">
                    {evaluation.subjectRole ? `${evaluation.subjectRole} · ` : ""}
                    Evaluated by {evaluation.evaluatorName} on {evaluation.evaluationDate}
                  </p>
                  <ul className="evaluation-responses">
                    {evaluation.responses.map((response) => {
                      const question = defaultTemplate.questions.find((item) => item.id === response.questionId);
                      if (!question) {
                        return null;
                      }
                      return (
                        <li key={response.questionId} className="evaluation-response">
                          <span className="response-question">{question.text}</span>
                          <span className="response-rating">
                            {response.rating.toFixed(1)} / {question.maxRating} → {response.scoreContribution.toFixed(2)} pts
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {evaluation.notes ? <p className="evaluation-notes">{evaluation.notes}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
};

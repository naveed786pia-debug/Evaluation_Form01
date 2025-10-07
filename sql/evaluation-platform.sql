-- Database: EvaluationPlatform
-- This script creates core tables and stored procedures for an evaluation form system.

IF DB_ID('EvaluationPlatform') IS NULL
BEGIN
    CREATE DATABASE EvaluationPlatform;
END;
GO

USE EvaluationPlatform;
GO

IF OBJECT_ID('dbo.EvaluationTemplate', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EvaluationTemplate (
        TemplateId INT IDENTITY(1, 1) PRIMARY KEY,
        TemplateName NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        MaxScore DECIMAL(10, 2) NOT NULL DEFAULT 100,
        CreatedBy NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('dbo.TemplateQuestion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TemplateQuestion (
        QuestionId INT IDENTITY(1, 1) PRIMARY KEY,
        TemplateId INT NOT NULL,
        QuestionText NVARCHAR(400) NOT NULL,
        Guidance NVARCHAR(400) NULL,
        Weight DECIMAL(6, 3) NOT NULL DEFAULT 1,
        MaxRating TINYINT NOT NULL DEFAULT 5,
        QuestionType NVARCHAR(50) NOT NULL DEFAULT 'Rating',
        CONSTRAINT FK_TemplateQuestion_Template FOREIGN KEY (TemplateId) REFERENCES dbo.EvaluationTemplate (TemplateId) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID('dbo.Evaluation', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Evaluation (
        EvaluationId INT IDENTITY(1, 1) PRIMARY KEY,
        TemplateId INT NOT NULL,
        SubjectName NVARCHAR(150) NOT NULL,
        SubjectRole NVARCHAR(100) NULL,
        EvaluatorName NVARCHAR(150) NOT NULL,
        EvaluationDate DATE NOT NULL,
        OverallScore DECIMAL(10, 2) NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Evaluation_Template FOREIGN KEY (TemplateId) REFERENCES dbo.EvaluationTemplate (TemplateId)
    );
END;
GO

IF OBJECT_ID('dbo.EvaluationResponse', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EvaluationResponse (
        ResponseId INT IDENTITY(1, 1) PRIMARY KEY,
        EvaluationId INT NOT NULL,
        QuestionId INT NOT NULL,
        RatingValue DECIMAL(10, 4) NOT NULL,
        ScoreValue DECIMAL(10, 4) NOT NULL,
        Comment NVARCHAR(500) NULL,
        RecordedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Response_Evaluation FOREIGN KEY (EvaluationId) REFERENCES dbo.Evaluation (EvaluationId) ON DELETE CASCADE,
        CONSTRAINT FK_Response_Question FOREIGN KEY (QuestionId) REFERENCES dbo.TemplateQuestion (QuestionId)
    );
END;
GO

IF OBJECT_ID('dbo.EvaluationReportCache', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EvaluationReportCache (
        ReportId INT IDENTITY(1, 1) PRIMARY KEY,
        EvaluationId INT NOT NULL,
        GeneratedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        OverallScore DECIMAL(10, 2) NOT NULL,
        MaxPossibleScore DECIMAL(10, 2) NOT NULL,
        SummaryJson NVARCHAR(MAX) NOT NULL,
        CONSTRAINT FK_ReportCache_Evaluation FOREIGN KEY (EvaluationId) REFERENCES dbo.Evaluation (EvaluationId) ON DELETE CASCADE,
        CONSTRAINT UQ_ReportCache UNIQUE (EvaluationId)
    );
END;
GO

IF OBJECT_ID('dbo.usp_CreateEvaluation', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_CreateEvaluation;
GO

CREATE PROCEDURE dbo.usp_CreateEvaluation
    @TemplateId INT,
    @SubjectName NVARCHAR(150),
    @SubjectRole NVARCHAR(100),
    @EvaluatorName NVARCHAR(150),
    @EvaluationDate DATE,
    @Notes NVARCHAR(MAX) = NULL,
    @EvaluationId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Evaluation (TemplateId, SubjectName, SubjectRole, EvaluatorName, EvaluationDate, Notes)
    VALUES (@TemplateId, @SubjectName, @SubjectRole, @EvaluatorName, @EvaluationDate, @Notes);

    SET @EvaluationId = SCOPE_IDENTITY();
END;
GO

IF OBJECT_ID('dbo.usp_RecordEvaluationResponse', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RecordEvaluationResponse;
GO

CREATE PROCEDURE dbo.usp_RecordEvaluationResponse
    @EvaluationId INT,
    @QuestionId INT,
    @RatingValue DECIMAL(10, 4),
    @Comment NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaxRating DECIMAL(10, 4);
    DECLARE @Weight DECIMAL(10, 4);

    SELECT @MaxRating = MaxRating, @Weight = Weight
    FROM dbo.TemplateQuestion
    WHERE QuestionId = @QuestionId;

    IF @MaxRating IS NULL
    BEGIN
        RAISERROR('Question not found.', 16, 1);
        RETURN;
    END;

    DECLARE @ScoreValue DECIMAL(10, 4) = CASE
        WHEN @MaxRating = 0 THEN 0
        ELSE (@RatingValue / @MaxRating) * @Weight
    END;

    INSERT INTO dbo.EvaluationResponse (EvaluationId, QuestionId, RatingValue, ScoreValue, Comment)
    VALUES (@EvaluationId, @QuestionId, @RatingValue, @ScoreValue, @Comment);
END;
GO

IF OBJECT_ID('dbo.usp_RecalculateEvaluationScore', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RecalculateEvaluationScore;
GO

CREATE PROCEDURE dbo.usp_RecalculateEvaluationScore
    @EvaluationId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OverallScore DECIMAL(10, 4);
    DECLARE @MaxPossibleScore DECIMAL(10, 4);

    SELECT @OverallScore = SUM(ScoreValue)
    FROM dbo.EvaluationResponse
    WHERE EvaluationId = @EvaluationId;

    SELECT @MaxPossibleScore = SUM(Weight)
    FROM dbo.TemplateQuestion tq
    INNER JOIN dbo.Evaluation e ON e.TemplateId = tq.TemplateId
    WHERE e.EvaluationId = @EvaluationId;

    UPDATE dbo.Evaluation
    SET OverallScore = CASE WHEN @MaxPossibleScore = 0 THEN 0 ELSE (@OverallScore / @MaxPossibleScore) * 100 END
    WHERE EvaluationId = @EvaluationId;

    MERGE dbo.EvaluationReportCache AS target
    USING (
        SELECT
            e.EvaluationId,
            SYSUTCDATETIME() AS GeneratedAt,
            CASE WHEN @MaxPossibleScore = 0 THEN 0 ELSE @OverallScore END AS OverallScore,
            ISNULL(@MaxPossibleScore, 0) AS MaxPossibleScore,
            (
                SELECT
                    tq.QuestionId,
                    tq.QuestionText,
                    r.RatingValue,
                    r.ScoreValue,
                    tq.Weight
                FROM dbo.EvaluationResponse r
                INNER JOIN dbo.TemplateQuestion tq ON tq.QuestionId = r.QuestionId
                WHERE r.EvaluationId = @EvaluationId
                FOR JSON PATH
            ) AS SummaryJson
        FROM dbo.Evaluation e
        WHERE e.EvaluationId = @EvaluationId
    ) AS source (EvaluationId, GeneratedAt, OverallScore, MaxPossibleScore, SummaryJson)
    ON target.EvaluationId = source.EvaluationId
    WHEN MATCHED THEN
        UPDATE SET GeneratedAt = source.GeneratedAt,
                   OverallScore = source.OverallScore,
                   MaxPossibleScore = source.MaxPossibleScore,
                   SummaryJson = source.SummaryJson
    WHEN NOT MATCHED THEN
        INSERT (EvaluationId, GeneratedAt, OverallScore, MaxPossibleScore, SummaryJson)
        VALUES (source.EvaluationId, source.GeneratedAt, source.OverallScore, source.MaxPossibleScore, source.SummaryJson);
END;
GO

IF OBJECT_ID('dbo.usp_GetEvaluationReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetEvaluationReport;
GO

CREATE PROCEDURE dbo.usp_GetEvaluationReport
    @EvaluationId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.EvaluationId,
        et.TemplateName,
        e.SubjectName,
        e.SubjectRole,
        e.EvaluatorName,
        e.EvaluationDate,
        e.OverallScore,
        rc.MaxPossibleScore,
        rc.GeneratedAt,
        rc.SummaryJson
    FROM dbo.Evaluation e
    INNER JOIN dbo.EvaluationTemplate et ON et.TemplateId = e.TemplateId
    LEFT JOIN dbo.EvaluationReportCache rc ON rc.EvaluationId = e.EvaluationId
    WHERE e.EvaluationId = @EvaluationId;

    SELECT
        r.QuestionId,
        tq.QuestionText,
        tq.Weight,
        tq.MaxRating,
        r.RatingValue,
        r.ScoreValue,
        r.Comment
    FROM dbo.EvaluationResponse r
    INNER JOIN dbo.TemplateQuestion tq ON tq.QuestionId = r.QuestionId
    WHERE r.EvaluationId = @EvaluationId
    ORDER BY tq.QuestionId;
END;
GO

IF OBJECT_ID('dbo.usp_GetTemplatePerformance', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetTemplatePerformance;
GO

CREATE PROCEDURE dbo.usp_GetTemplatePerformance
    @TemplateId INT,
    @FromDate DATE = NULL,
    @ToDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        et.TemplateName,
        COUNT(e.EvaluationId) AS EvaluationCount,
        AVG(e.OverallScore) AS AverageScore,
        MIN(e.OverallScore) AS LowestScore,
        MAX(e.OverallScore) AS HighestScore
    FROM dbo.Evaluation e
    INNER JOIN dbo.EvaluationTemplate et ON et.TemplateId = e.TemplateId
    WHERE e.TemplateId = @TemplateId
      AND (@FromDate IS NULL OR e.EvaluationDate >= @FromDate)
      AND (@ToDate IS NULL OR e.EvaluationDate <= @ToDate)
    GROUP BY et.TemplateName;

    SELECT
        tq.QuestionId,
        tq.QuestionText,
        AVG(r.RatingValue) AS AverageRating,
        AVG(r.ScoreValue) AS AverageScore
    FROM dbo.EvaluationResponse r
    INNER JOIN dbo.TemplateQuestion tq ON tq.QuestionId = r.QuestionId
    INNER JOIN dbo.Evaluation e ON e.EvaluationId = r.EvaluationId
    WHERE e.TemplateId = @TemplateId
      AND (@FromDate IS NULL OR e.EvaluationDate >= @FromDate)
      AND (@ToDate IS NULL OR e.EvaluationDate <= @ToDate)
    GROUP BY tq.QuestionId, tq.QuestionText
    ORDER BY tq.QuestionId;
END;
GO

'use client';

import React, { useState } from 'react';

/**
 * YearSpecificQuery component - Future feature for querying specific year events
 * 
 * This component will allow users to ask questions about specific years
 * to get more detailed predictions for that particular time period.
 * 
 * Planned features:
 * - Year input/selection
 * - Question input field
 * - Query submission to backend API
 * - Display of year-specific detailed predictions
 * - Context-aware answers based on birth chart
 */

interface Props {
  birthDate?: string;
  onQuerySubmit?: (year: number, question: string) => void;
  enabled?: boolean; // Feature flag for future activation
}

export default function YearSpecificQuery({ birthDate, onQuerySubmit, enabled = false }: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Feature not yet enabled - show placeholder
  if (!enabled) {
    return (
      <div className="year-specific-query-placeholder">
        <div className="coming-soon-badge">Coming Soon</div>
        <h4>🔮 Ask About Specific Years</h4>
        <p className="muted">
          Future feature: Ask specific questions about important events in any year of your life.
          Get detailed, context-aware predictions based on your birth chart.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    try {
      onQuerySubmit?.(selectedYear, question);
      // API call will be implemented here in future
      // const response = await api.querySpecificYear(birthDate, selectedYear, question);
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear + i);

  return (
    <div className="year-specific-query">
      <h4>🔮 Ask About a Specific Year</h4>
      <p className="muted">
        Select a year and ask questions about important events, opportunities, or challenges.
      </p>

      <form onSubmit={handleSubmit} className="query-form">
        <div className="form-group">
          <label htmlFor="year-select">Select Year:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-select"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="question-input">Your Question:</label>
          <textarea
            id="question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="E.g., Will I get married in this year? What career opportunities should I look for?"
            className="question-input"
            rows={3}
          />
        </div>

        <button type="submit" disabled={isLoading || !question.trim()} className="submit-button">
          {isLoading ? 'Analyzing...' : 'Get Year Prediction'}
        </button>
      </form>

      <style jsx>{`
        .year-specific-query,
        .year-specific-query-placeholder {
          margin: 2rem 0;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .year-specific-query-placeholder {
          text-align: center;
          position: relative;
        }

        .coming-soon-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #667eea;
          color: white;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .year-specific-query h4,
        .year-specific-query-placeholder h4 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
          font-size: 1.2rem;
        }

        .muted {
          color: #718096;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .query-form {
          margin-top: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2d3748;
        }

        .year-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #cbd5e0;
          border-radius: 6px;
          font-size: 1rem;
          background: white;
          cursor: pointer;
        }

        .year-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .question-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #cbd5e0;
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
        }

        .question-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .year-specific-query,
          .year-specific-query-placeholder {
            padding: 1rem;
          }

          .year-specific-query h4 {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
}

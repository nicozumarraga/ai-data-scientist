import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

export const ReportButton = ({ chatHistory }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_history: chatHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analysis_report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err.message);
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="relative">
      <button
        onClick={handleGenerateReport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-dark-accent text-white rounded-lg
                 hover:bg-dark-accent/90 disabled:bg-dark-muted disabled:cursor-not-allowed
                 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Report...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Generate AI Report</span>
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 w-full bg-red-900/20 border-l-4 border-red-500 p-2 rounded">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

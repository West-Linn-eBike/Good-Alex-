
import React from 'react';
import { markdownToHtml } from '../utils/markdown';

interface FactCheckReportProps {
  report: string;
}

export const FactCheckReport: React.FC<FactCheckReportProps> = ({ report }) => {
  const htmlReport = markdownToHtml(report);

  return (
    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h2 className="text-2xl font-heading text-blue-800 mb-3">Fact-Check Report</h2>
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlReport }}
      />
    </div>
  );
};

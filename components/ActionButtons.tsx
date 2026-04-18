
import React from 'react';

interface ActionButtonsProps {
  isReviewGenerated: boolean;
  onFactCheck: () => void;
  onEdit: () => void;
  isEditing: boolean;
  onDownload: (type: 'pdf' | 'md' | 'json' | 'jsonl' | 'html') => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ isReviewGenerated, onFactCheck, onEdit, isEditing, onDownload }) => {
  if (!isReviewGenerated) return null;

  const baseButtonClass = "px-4 py-2 text-sm font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
  const primaryButtonClass = `${baseButtonClass} text-white bg-brand-secondary hover:bg-brand-secondary-dark focus:ring-brand-secondary`;
  const editButtonClass = isEditing 
    ? `${baseButtonClass} text-white bg-brand-primary hover:bg-brand-primary-dark focus:ring-brand-primary` 
    : primaryButtonClass;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-bold text-brand-charcoal mb-4">Actions</h3>
      <div className="flex flex-wrap gap-3">
        <button onClick={onFactCheck} className={primaryButtonClass}>Fact-Check & Refine</button>
        <button onClick={onEdit} className={editButtonClass}>{isEditing ? 'Cancel Edit' : 'Edit Review'}</button>
        <button onClick={() => onDownload('pdf')} className={primaryButtonClass}>Download PDF</button>
        <button onClick={() => onDownload('html')} className={primaryButtonClass}>Download HTML</button>
        <button onClick={() => onDownload('md')} className={primaryButtonClass}>Download Markdown</button>
        <button onClick={() => onDownload('json')} className={primaryButtonClass}>Download JSON</button>
      </div>
    </div>
  );
};

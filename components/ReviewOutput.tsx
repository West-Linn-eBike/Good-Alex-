
import React, { useState, useEffect } from 'react';
import { markdownToHtml } from '../utils/markdown';

interface ReviewOutputProps {
  markdown: string;
  isEditing: boolean;
  onSave: (newMarkdown: string) => void;
  currentImage: string | null;
}

export const ReviewOutput: React.FC<ReviewOutputProps> = ({ markdown, isEditing, onSave, currentImage }) => {
  const [editedMarkdown, setEditedMarkdown] = useState(markdown);

  useEffect(() => {
    setEditedMarkdown(markdown);
  }, [markdown]);

  if (isEditing) {
    return (
      <div className="mt-6">
        <textarea
          value={editedMarkdown}
          onChange={(e) => setEditedMarkdown(e.target.value)}
          className="w-full h-96 p-3 font-mono text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
        />
        <button
          onClick={() => onSave(editedMarkdown)}
          className="mt-2 px-4 py-2 font-bold text-white bg-brand-success rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Save Changes
        </button>
      </div>
    );
  }

  // Handle Image Injection
  let processedMarkdown = markdown;
  let imageRenderedInMarkdown = false;

  if (currentImage) {
    // 1. Check if the AI generated the specific placeholder (Article Mode)
    if (processedMarkdown.includes('(<User Uploaded Image>)')) {
        processedMarkdown = processedMarkdown.replace(/\(<User Uploaded Image>\)/g, `(${currentImage})`);
        imageRenderedInMarkdown = true;
    }
    // 2. Fallback: check if the AI was clever and used a generic placeholder
    else if (processedMarkdown.includes('](image)')) {
         processedMarkdown = processedMarkdown.replace(/\]\(image\)/g, `](${currentImage})`);
         imageRenderedInMarkdown = true;
    }
  }

  const htmlContent = markdownToHtml(processedMarkdown);

  return (
    <div id="review-output-content" className="mt-6">
        {/* If we have an image, but it wasn't replaced in the Markdown (e.g. Review Mode), prepend it visually */}
        {currentImage && !imageRenderedInMarkdown && (
            <div className="mb-8">
                <img 
                    src={currentImage} 
                    alt="Analyzed eBike" 
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-md object-cover" 
                    style={{ maxHeight: '500px' }}
                />
            </div>
        )}
        
        <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
    </div>
  );
};

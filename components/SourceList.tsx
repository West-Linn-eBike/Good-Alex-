
import React from 'react';
import type { GroundingMetadata } from '../types';

interface SourceListProps {
  metadata: GroundingMetadata | null;
}

export const SourceList: React.FC<SourceListProps> = ({ metadata }) => {
  const sources = metadata?.groundingChunks?.filter(chunk => chunk.web && chunk.web.uri);
  
  if (!sources || sources.length === 0) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-brand-charcoal mb-2">Sources</h3>
        <p className="text-sm text-gray-500">No web sources were identified by the AI for this generation.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-bold text-brand-charcoal mb-4">Sources Used by the AI</h3>
      <ul className="list-disc list-inside space-y-2">
        {sources.map((chunk, index) => (
          <li key={index} className="text-sm">
            <a 
              href={chunk.web.uri} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-secondary-dark hover:text-brand-primary underline break-all"
              title={chunk.web.title}
            >
              {chunk.web.title || chunk.web.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

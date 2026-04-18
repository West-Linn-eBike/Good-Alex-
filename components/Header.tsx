
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-heading text-brand-primary mb-2">
        Alex the AI 🤖 eBike Reviewer
      </h1>
      <p className="text-lg text-brand-secondary">
        Your transparent, AI-powered eBike review generator.
      </p>
    </header>
  );
};

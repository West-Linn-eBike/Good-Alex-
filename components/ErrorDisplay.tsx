
import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="my-6 p-4 bg-brand-error/10 border-l-4 border-brand-error text-brand-error rounded-r-lg" role="alert">
      <p className="font-bold">An Error Occurred</p>
      <p>{message}</p>
    </div>
  );
};

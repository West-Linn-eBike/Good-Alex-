
import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center my-8 p-4 bg-white/50 rounded-lg">
      <div className="w-12 h-12 border-4 border-t-brand-primary border-gray-200 rounded-full animate-spin"></div>
      <p className="mt-4 text-brand-secondary font-semibold">{message}</p>
    </div>
  );
};

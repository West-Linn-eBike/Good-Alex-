
import React, { useState, useCallback } from 'react';

interface ReviewFormProps {
  onGenerate: (bikeName: string, imageFile: File | null) => void;
  isLoading: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onGenerate, isLoading }) => {
  const [bikeName, setBikeName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setBikeName('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const input = document.getElementById('bike-image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!bikeName && !imageFile) {
      alert('Please provide an e-bike name or an image.');
      return;
    }
    onGenerate(bikeName, imageFile);
  }, [bikeName, imageFile, onGenerate]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="bike-model-input" className="block text-sm font-medium text-brand-secondary mb-1">
          eBike Model Name
        </label>
        <input
          type="text"
          id="bike-model-input"
          value={bikeName}
          onChange={(e) => {
            setBikeName(e.target.value);
            if(imageFile) handleRemoveImage();
          }}
          placeholder="e.g., 'Lectric XP 3.0'"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100"
          disabled={isLoading || !!imageFile}
        />
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div>
        <label htmlFor="bike-image-upload" className="block text-sm font-medium text-brand-secondary mb-1">
          Upload an Image
        </label>
        <input
          type="file"
          id="bike-image-upload"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary-dark hover:file:bg-brand-primary/20 disabled:opacity-50"
          disabled={isLoading}
        />
      </div>
      
      {imagePreview && (
        <div className="relative w-40 h-40 mt-2">
          <img src={imagePreview} alt="eBike preview" className="object-cover w-full h-full rounded-md border-2 border-brand-primary"/>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-brand-error text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-700"
            aria-label="Remove image"
            disabled={isLoading}
          >
            &times;
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || (!bikeName && !imageFile)}
        className="w-full px-4 py-3 font-bold text-white bg-brand-primary rounded-md shadow-sm hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating...' : 'Generate Review'}
      </button>
    </form>
  );
};

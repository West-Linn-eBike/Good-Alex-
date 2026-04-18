
import React, { useState, useCallback } from 'react';

interface ArticleFormProps {
  onGenerateOutline: (data: ArticleFormData) => void;
  onGenerateArticle: (outline: string, data: ArticleFormData) => void;
  isLoading: boolean;
  outline: string | null;
}

export interface ArticleFormData {
  topic: string;
  keywords: string;
  domain: string;
  context: string;
  imageFile: File | null;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({ onGenerateOutline, onGenerateArticle, isLoading, outline }) => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [domain, setDomain] = useState('');
  const [context, setContext] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedOutline, setEditedOutline] = useState<string>('');

  // Update local outline state when prop changes
  React.useEffect(() => {
    if (outline) setEditedOutline(outline);
  }, [outline]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const input = document.getElementById('article-image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleSubmitOutline = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      alert('Please provide an article topic.');
      return;
    }
    onGenerateOutline({ topic, keywords, domain, context, imageFile });
  }, [topic, keywords, domain, context, imageFile, onGenerateOutline]);

  const handleSubmitArticle = useCallback(() => {
    onGenerateArticle(editedOutline, { topic, keywords, domain, context, imageFile });
  }, [editedOutline, topic, keywords, domain, context, imageFile, onGenerateArticle]);

  return (
    <div className="space-y-6">
      {!outline ? (
        <form onSubmit={handleSubmitOutline} className="space-y-4">
          <div>
            <label htmlFor="article-topic" className="block text-sm font-medium text-brand-secondary mb-1">
              Article Topic / Title
            </label>
            <input
              type="text"
              id="article-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'Top 5 Commuter eBikes for 2025' or 'Understanding Voltages'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="article-keywords" className="block text-sm font-medium text-brand-secondary mb-1">
              Target Keywords (Silo Support)
            </label>
            <input
              type="text"
              id="article-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., ebike battery care, lithium ion safety"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="article-domain" className="block text-sm font-medium text-brand-secondary mb-1">
              Manufacturer Domain (optional)
            </label>
            <input
              type="text"
              id="article-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., aventon.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="article-context" className="block text-sm font-medium text-brand-secondary mb-1">
              Paste Research / Notes / Context
            </label>
            <textarea
              id="article-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Paste any previous research, specs, or specific points you want included..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="article-image-upload" className="block text-sm font-medium text-brand-secondary mb-1">
              Upload eBike Image (for Photo Journalism analysis)
            </label>
            <input
              type="file"
              id="article-image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary-dark hover:file:bg-brand-primary/20"
              disabled={isLoading}
            />
          </div>

          {imagePreview && (
            <div className="relative w-40 h-40 mt-2">
              <img src={imagePreview} alt="Preview" className="object-cover w-full h-full rounded-md border-2 border-brand-primary"/>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-brand-error text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-700"
                disabled={isLoading}
              >
                &times;
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !topic}
            className="w-full px-4 py-3 font-bold text-white bg-brand-primary rounded-md shadow-sm hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Thinking...' : 'Generate Outline'}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-brand-charcoal">Review & Edit Outline</h3>
             <button 
                onClick={() => setEditedOutline('')} // Reset outline to go back technically only if we cleared prop in parent, but simple text reset works for UI flow mostly
                className="text-sm text-gray-500 hover:text-brand-primary underline"
             >
                Start Over
             </button>
          </div>
          <p className="text-sm text-brand-secondary">Alex has generated this outline. Edit it to guide the final article.</p>
          <textarea
            value={editedOutline}
            onChange={(e) => setEditedOutline(e.target.value)}
            className="w-full h-64 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-brand-bg"
            disabled={isLoading}
          />
           <button
            onClick={handleSubmitArticle}
            disabled={isLoading}
            className="w-full px-4 py-3 font-bold text-white bg-brand-success rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Writing Article (this may take a moment)...' : 'Write Full Article'}
          </button>
        </div>
      )}
    </div>
  );
};

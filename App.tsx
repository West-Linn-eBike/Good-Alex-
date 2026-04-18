
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ReviewForm } from './components/ReviewForm';
import { ArticleForm, ArticleFormData } from './components/ArticleForm';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { FactCheckReport } from './components/FactCheckReport';
import { ReviewOutput } from './components/ReviewOutput';
import { ActionButtons } from './components/ActionButtons';
import { SourceList } from './components/SourceList';
import { MetadataDisplay } from './components/MetadataDisplay';
import { generateReview, factCheckReview, generateMetadata, generateArticleOutline, generateFullArticle, generateEbikeImage } from './services/geminiService';
import type { GroundingMetadata, Metadata } from './types';
import { downloadFile, downloadPdf, getFileNameBase } from './utils/download';
import { markdownToHtml } from './utils/markdown';

type AppMode = 'review' | 'article';

function App() {
  const [mode, setMode] = useState<AppMode>('review');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Review Mode State
  const [reviewMarkdown, setReviewMarkdown] = useState<string | null>(null);
  const [factCheckReport, setFactCheckReport] = useState<string | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Article Mode State
  const [articleOutline, setArticleOutline] = useState<string | null>(null);

  const clearResults = () => {
    setError(null);
    setReviewMarkdown(null);
    setFactCheckReport(null);
    setGroundingMetadata(null);
    setMetadata(null);
    setIsEditing(false);
    setArticleOutline(null);
    setCurrentImage(null);
  };
  
  const handleModeSwitch = (newMode: AppMode) => {
    if (newMode !== mode) {
        setMode(newMode);
        setError(null);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
  };

  const handleGenerateReview = useCallback(async (bikeName: string, imageFile: File | null) => {
    clearResults();
    setIsLoading(true);

    if (!process.env.API_KEY) {
        setError("API_KEY environment variable not set. Please configure it to use the application.");
        setIsLoading(false);
        return;
    }

    if (imageFile) {
        const dataUrl = await fileToDataUrl(imageFile);
        setCurrentImage(dataUrl);
    } else {
        setLoadingMessage('Generating a unique AI feature image for this bike...');
        try {
            const generatedImage = await generateEbikeImage(bikeName);
            if (generatedImage) setCurrentImage(generatedImage);
        } catch (e) {
             console.warn("Failed to generate image", e);
        }
    }

    setLoadingMessage('Researching and writing your review...');

    try {
      const { review, grounding_metadata } = await generateReview(bikeName, imageFile);
      setReviewMarkdown(review);
      setGroundingMetadata(grounding_metadata);
      setLoadingMessage('Generating publishing pack...');
      const generatedMetadata = await generateMetadata(review);
      setMetadata(generatedMetadata);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateOutline = useCallback(async (data: ArticleFormData) => {
      setError(null);
      setIsLoading(true);
      setLoadingMessage('Structuring your article outline...');
      
      try {
          const outline = await generateArticleOutline(data.topic, data.keywords, data.domain, data.context);
          setArticleOutline(outline);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setIsLoading(false);
      }
  }, []);

  const handleWriteArticle = useCallback(async (outline: string, data: ArticleFormData) => {
      setIsLoading(true);

      if (data.imageFile) {
        const dataUrl = await fileToDataUrl(data.imageFile);
        setCurrentImage(dataUrl);
      } else {
         setLoadingMessage('Generating a custom editorial image for your article...');
         try {
            const generatedImage = await generateEbikeImage(`${data.topic} ${data.keywords}`);
            if (generatedImage) setCurrentImage(generatedImage);
            else setCurrentImage(null);
         } catch(e) {
             console.warn("Image generation failed", e);
             setCurrentImage(null);
         }
      }

      setLoadingMessage('Alex is writing your article (researching, checking facts, and optimizing images)...');
      
      try {
          const { article, grounding_metadata } = await generateFullArticle(outline, data.topic, data.domain, data.context, data.imageFile);
          setReviewMarkdown(article); 
          setGroundingMetadata(grounding_metadata);
          setArticleOutline(null); 
          
          setLoadingMessage('Generating publishing pack...');
          const generatedMetadata = await generateMetadata(article);
          setMetadata(generatedMetadata);

      } catch (e: any) {
          setError(e.message);
      } finally {
          setIsLoading(false);
      }
  }, []);

  const handleFactCheck = useCallback(async () => {
    if (!reviewMarkdown) return;
    setIsLoading(true);
    setLoadingMessage('Fact-checking and refining your content...');
    setError(null);
    setFactCheckReport(null);
    setMetadata(null);
    
    try {
      const { report, refinedReview, grounding_metadata } = await factCheckReview(reviewMarkdown);
      setFactCheckReport(report);
      setReviewMarkdown(refinedReview);
      setGroundingMetadata(grounding_metadata);
      setLoadingMessage('Re-generating publishing pack...');
      const generatedMetadata = await generateMetadata(refinedReview);
      setMetadata(generatedMetadata);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [reviewMarkdown]);
  
  const handleEditToggle = () => setIsEditing(prev => !prev);
  
  const handleSaveEdit = async (newMarkdown: string) => {
    setReviewMarkdown(newMarkdown);
    setIsEditing(false);
    setLoadingMessage('Re-generating publishing pack based on your edits...');
    setIsLoading(true);
    try {
      const generatedMetadata = await generateMetadata(newMarkdown);
      setMetadata(generatedMetadata);
    } catch(e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (type: 'pdf' | 'md' | 'json' | 'html') => {
    const fileNameBase = getFileNameBase(reviewMarkdown);
    if (!reviewMarkdown) return;

    switch(type) {
      case 'pdf':
        const reviewElement = document.getElementById('review-output-content');
        if(reviewElement) downloadPdf(reviewElement, fileNameBase);
        break;
      case 'html':
        // Generate expert HTML on the fly for action button
        // Reusing logic from MetadataDisplay to ensure consistency
        if (metadata) {
            const bodyHtml = markdownToHtml(reviewMarkdown);
            const expertHtml = `<!DOCTYPE html><html><head><title>${metadata.meta_title}</title><style>body{font-family:sans-serif;line-height:1.6;max-width:800px;margin:40px auto;padding:20px;background:#faf8f1}.container{background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}h1{color:#E97451;text-align:center}.feature-image{width:100%;border-radius:8px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th,td{padding:12px;border:1px solid #ddd}th{background:#5D737E;color:#fff}</style></head><body><div class="container"><h1>${metadata.meta_title}</h1>${currentImage ? `<img src="${currentImage}" class="feature-image">` : ''}<article>${bodyHtml}</article></div></body></html>`;
            downloadFile(expertHtml, `${fileNameBase}.html`, 'text/html');
        }
        break;
      case 'md':
        downloadFile(reviewMarkdown, `${fileNameBase}.md`, 'text/markdown');
        break;
      case 'json':
        if(metadata) downloadFile(JSON.stringify(metadata, null, 2), `${fileNameBase}.json`, 'application/json');
        break;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        
        <div className="mt-8 flex justify-center border-b border-gray-200">
             <button
                className={`px-6 py-3 font-bold text-sm sm:text-base border-b-2 transition-colors ${mode === 'review' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-brand-charcoal'}`}
                onClick={() => handleModeSwitch('review')}
             >
                Review Generator
             </button>
             <button
                className={`px-6 py-3 font-bold text-sm sm:text-base border-b-2 transition-colors ${mode === 'article' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-brand-charcoal'}`}
                onClick={() => handleModeSwitch('article')}
             >
                Article & Silo Creator
             </button>
        </div>

        <main className="mt-6">
          <section className="bg-brand-surface p-6 rounded-lg shadow-md">
            {mode === 'review' ? (
                <ReviewForm onGenerate={handleGenerateReview} isLoading={isLoading} />
            ) : (
                <ArticleForm 
                    onGenerateOutline={handleGenerateOutline} 
                    onGenerateArticle={handleWriteArticle}
                    isLoading={isLoading} 
                    outline={articleOutline}
                />
            )}
          </section>

          {isLoading && <Loader message={loadingMessage} />}
          {error && <ErrorDisplay message={error} />}

          {(reviewMarkdown || factCheckReport) && !isLoading && !articleOutline && (
            <section className="mt-8 bg-brand-surface p-6 rounded-lg shadow-md">
                {factCheckReport && <FactCheckReport report={factCheckReport} />}
                {reviewMarkdown && (
                    <ReviewOutput 
                        markdown={reviewMarkdown} 
                        isEditing={isEditing} 
                        onSave={handleSaveEdit} 
                        currentImage={currentImage}
                    />
                )}
                <ActionButtons 
                    isReviewGenerated={!!reviewMarkdown}
                    onFactCheck={handleFactCheck}
                    onEdit={handleEditToggle}
                    isEditing={isEditing}
                    onDownload={handleDownload}
                />
                {groundingMetadata && <SourceList metadata={groundingMetadata} />}
                {metadata && <MetadataDisplay metadata={metadata} reviewMarkdown={reviewMarkdown ?? ''} currentImage={currentImage} />}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;


import React from 'react';
import type { Metadata } from '../types';
import { downloadFile, getFileNameBase } from '../utils/download';
import { markdownToHtml } from '../utils/markdown';

interface MetadataDisplayProps {
  metadata: Metadata;
  reviewMarkdown: string;
  currentImage?: string | null;
}

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ 
  textToCopy, 
  label = 'Copy', 
  className = "text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-2 rounded" 
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button onClick={handleCopy} className={className}>
            {copied ? 'Copied!' : label}
        </button>
    );
}

export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ metadata, reviewMarkdown, currentImage }) => {
  if (!metadata) return null;

  const fullMarkdown = metadata.post_markdown_lines?.join('\n') ?? reviewMarkdown;
  const bodyHtml = markdownToHtml(fullMarkdown);

  const reviewSchemaLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
        "@type": "Product",
        "name": metadata.review_schema.itemReviewed.name,
        "description": metadata.review_schema.itemReviewed.description,
        "image": currentImage || metadata.feature_image_url
    },
    "reviewRating": {
        "@type": "Rating",
        "ratingValue": metadata.review_schema.reviewRating.ratingValue,
        "bestRating": metadata.review_schema.reviewRating.bestRating
    },
    "author": {
        "@type": "Person",
        "name": metadata.review_schema.author.name
    },
    "positiveNotes": {
        "@type": "ItemList",
        "itemListElement": metadata.review_schema.positiveNotes.map((note, index) => ({ "@type": "ListItem", "position": index + 1, "name": note }))
    },
    "negativeNotes": {
        "@type": "ItemList",
        "itemListElement": metadata.review_schema.negativeNotes.map((note, index) => ({ "@type": "ListItem", "position": index + 1, "name": note }))
    }
  };

  const faqSchemaLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": metadata.faq_schema.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
          }
      }))
  };

  const jsonLdScript = `<script type="application/ld+json">
${JSON.stringify([reviewSchemaLd, faqSchemaLd], null, 2)}
</script>`;

  const expertHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.meta_title}</title>
    <meta name="description" content="${metadata.meta_description}">
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&family=Philosopher:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #E97451; --secondary: #5D737E; --dark: #333; --bg: #FAF8F1; --success: #28a745; --error: #D9534F; }
        body { font-family: 'Nunito', sans-serif; line-height: 1.6; color: var(--dark); background: var(--bg); margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 40px auto; background: #fff; padding: 40px; border-radius: 12px; shadow: 0 4px 6px rgba(0,0,0,0.1); box-sizing: border-box; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Philosopher', serif; margin-top: 1.5em; font-weight: 700; }
        h1 { font-size: 2.5em; text-align: center; margin-bottom: 0.5em; color: var(--primary); }
        h2 { font-size: 2em; color: var(--primary); }
        h3 { font-size: 1.5em; color: var(--secondary); }
        h4 { font-size: 1.25em; color: var(--secondary); }
        h5 { font-size: 1.1em; color: var(--secondary); }
        h6 { font-size: 1em; color: var(--secondary); text-transform: uppercase; letter-spacing: 1px; }
        .feature-image { width: 100%; border-radius: 8px; margin-bottom: 2em; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .prose p { margin-bottom: 1.5em; }
        .prose ul { padding-left: 20px; margin-bottom: 1.5em; }
        .prose li { margin-bottom: 0.5em; }
        .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 2em 0; }
        @media (max-width: 600px) { .pros-cons { grid-template-columns: 1fr; } .container { padding: 20px; margin: 0; } }
        .pros { color: var(--success); border-left: 4px solid var(--success); padding-left: 15px; background: #f4fff4; border-radius: 0 8px 8px 0; padding-top: 1px; padding-bottom: 1px; }
        .cons { color: var(--error); border-left: 4px solid var(--error); padding-left: 15px; background: #fff4f4; border-radius: 0 8px 8px 0; padding-top: 1px; padding-bottom: 1px; }
        table { width: 100%; border-collapse: collapse; margin: 2em 0; }
        th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
        th { background: var(--secondary); color: #fff; }
        blockquote { border-left: 5px solid var(--primary); background: #fff9f0; padding: 20px; font-style: italic; margin: 2em 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
    ${jsonLdScript}
</head>
<body>
    <div class="container">
        <h1>${metadata.meta_title}</h1>
        ${currentImage ? `<img src="${currentImage}" alt="${metadata.review_schema.itemReviewed.name}" class="feature-image">` : ''}
        <article class="prose">
            ${bodyHtml}
        </article>
        <div class="footer">
            Generated by Alex the AI 🤖 - Expert eBike Reviews
        </div>
    </div>
</body>
</html>`;

  const handleDownloadHtml = () => {
      const fileNameBase = getFileNameBase(reviewMarkdown);
      downloadFile(expertHtml, `${fileNameBase}.html`, 'text/html');
  };

  const allMetadataText = `Meta Title: ${metadata.meta_title}
Meta Description: ${metadata.meta_description}
Slug: ${metadata.slug}
Feature Image: ${metadata.feature_image_url}

${jsonLdScript}`;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-brand-charcoal">Ghost CMS & Export Pack</h3>
        <div className="flex gap-2">
            <CopyButton 
                textToCopy={allMetadataText} 
                label="Copy SEO Data" 
                className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-secondary hover:bg-brand-secondary-dark rounded-md shadow-sm transition-colors"
            />
            <button 
                onClick={handleDownloadHtml}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-dark rounded-md shadow-sm transition-colors"
            >
                Download HTML
            </button>
        </div>
      </div>
      <div className="space-y-6">
        <div>
            <h4 className="font-semibold text-brand-secondary">SEO & Post Data</h4>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                <p><strong>Meta Title:</strong> {metadata.meta_title}</p>
                <p><strong>Meta Description:</strong> {metadata.meta_description}</p>
                <p><strong>Slug:</strong> {metadata.slug}</p>
                <p><strong>Feature Image:</strong> <a href={metadata.feature_image_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Link</a></p>
            </div>
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-brand-secondary">Full Post Expert HTML</h4>
                <div className="flex gap-2">
                    <CopyButton textToCopy={expertHtml} label="Copy HTML" />
                </div>
            </div>
            <textarea
                readOnly
                value={expertHtml}
                className="w-full h-48 p-2 font-mono text-xs border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">This is a standalone HTML file ready for hosting or manual upload.</p>
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-brand-secondary">Full Post Markdown</h4>
                <CopyButton textToCopy={fullMarkdown} />
            </div>
            <textarea
                readOnly
                value={fullMarkdown}
                className="w-full h-48 p-2 font-mono text-xs border border-gray-300 rounded-md bg-gray-50"
            />
        </div>
        
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-brand-secondary">Structured Data (JSON-LD)</h4>
                <CopyButton textToCopy={jsonLdScript} />
            </div>
             <p className="text-xs text-gray-500 mb-2">Paste this into an HTML card in Ghost.</p>
            <textarea
                readOnly
                value={jsonLdScript}
                className="w-full h-48 p-2 font-mono text-xs border border-gray-300 rounded-md bg-gray-50"
            />
        </div>
      </div>
    </div>
  );
};

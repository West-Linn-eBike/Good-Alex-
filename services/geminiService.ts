
import { GoogleGenAI, Type } from "@google/genai";
import { BASE_PROMPT, FACT_CHECK_PROMPT, PUBLISHING_PACK_PROMPT, ARTICLE_OUTLINE_PROMPT, ARTICLE_GENERATION_PROMPT } from '../constants';
import { searchTavily } from './tavilyService';
import type { GroundingMetadata, Metadata } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
// Using gemini-3-flash-preview as requested for optimal search tool usage
const model = 'gemini-2.5-flash'; 

// Helper function to convert a File to a base64 string
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export async function generateEbikeImage(promptContext: string): Promise<string | null> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { 
                        text: `Generate a photorealistic, high-quality image of an e-bike. Context: ${promptContext}. Professional product photography, studio lighting, 4k, detailed. If specific bike model is mentioned, try to match its general style (folding, fat tire, cargo, etc).` 
                    }
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9" 
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;

    } catch (error: any) {
        console.error("Error generating image:", error);
        return null;
    }
}

export async function generateReview(bikeName: string, imageFile: File | null): Promise<{ review: string, grounding_metadata: GroundingMetadata | null }> {
    // 1. Perform Deep Research via Tavily first
    // Added safety keywords to ensure "fact backed research" on fires/safety is retrieved
    const searchQuery = bikeName ? `${bikeName} ebike review specs problems battery fire safety recalls UL2849 youtube` : "ebike analysis safety standards";
    const tavilyContext = await searchTavily(searchQuery);

    const parts: any[] = [
        { text: BASE_PROMPT },
        { text: `\n\n${tavilyContext}` } // Inject Tavily data
    ];

    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        parts.push(imagePart);
        parts.push({text: `\n\nIdentify the e-bike in the image and generate the review. Use the provided research data to ensure accuracy.`});
    } else {
        parts.push({ text: `\n\nE-Bike Model: ${bikeName}` });
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                tools: [{ googleSearch: {} }], // Keep Google Search for grounding links
            }
        });

        const review = response.text;
        const grounding_metadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | null;
        
        return { review, grounding_metadata };
    } catch (error: any) {
        console.error("Error generating review:", error);
        throw new Error(`Failed to generate review: ${error.message}`);
    }
}

export async function factCheckReview(reviewMarkdown: string): Promise<{ report: string, refinedReview: string, grounding_metadata: GroundingMetadata | null }> {
    // Extract bike name attempt (simple heuristic) or just generic search
    const titleMatch = reviewMarkdown.match(/^# (.*?)(?::|\sReview)/);
    const bikeName = titleMatch ? titleMatch[1] : "ebike";
    
    // Fetch fresh data for fact checking, emphasizing safety
    const tavilyContext = await searchTavily(`${bikeName} specs real world range battery safety recalls UL certification`);

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `${FACT_CHECK_PROMPT}\n\n${tavilyContext}\n\nORIGINAL REVIEW:\n${reviewMarkdown}`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const fullText = response.text;
        const separator = "---END-OF-REPORT---";
        const parts = fullText.split(separator);

        if (parts.length < 2) {
            console.warn("Fact-check report separator not found. Treating entire response as review.");
            return { report: "No report generated.", refinedReview: fullText, grounding_metadata: null };
        }
        
        const report = parts[0].trim();
        const refinedReview = parts.slice(1).join(separator).trim();
        const grounding_metadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | null;
        
        return { report, refinedReview, grounding_metadata };
    } catch (error: any) {
        console.error("Error fact-checking review:", error);
        throw new Error(`Failed to fact-check review: ${error.message}`);
    }
}

export async function generateMetadata(reviewMarkdown: string): Promise<Metadata> {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: `${PUBLISHING_PACK_PROMPT}\n\n${reviewMarkdown}`,
            config: {
                responseMimeType: "application/json",
            }
        });

        const jsonText = response.text.trim();
        const metadata = JSON.parse(jsonText) as Metadata;
        return metadata;

    } catch (error: any) {
        console.error("Error generating metadata:", error);
        throw new Error(`Failed to generate metadata: ${error.message}`);
    }
}

export async function generateArticleOutline(topic: string, keywords: string, domain: string, context: string): Promise<string> {
    // Tavily search for high level topic info
    const tavilyContext = await searchTavily(`${topic} ${keywords} ${domain} key facts safety ratings recalls`);

    const prompt = `${ARTICLE_OUTLINE_PROMPT}
    
    Topic: ${topic}
    Keywords: ${keywords}
    Manufacturer Domain: ${domain}
    Context/Research Notes: ${context}
    
    ${tavilyContext}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error: any) {
         console.error("Error generating outline:", error);
        throw new Error(`Failed to generate outline: ${error.message}`);
    }
}

export async function generateFullArticle(outline: string, topic: string, domain: string, context: string, imageFile: File | null): Promise<{ article: string, grounding_metadata: GroundingMetadata | null }> {
    const parts: any[] = [
        { text: ARTICLE_GENERATION_PROMPT }
    ];

    // Deep research for the article body
    const tavilyContext = await searchTavily(`${topic} ${domain} detailed guide statistics safety standards`);

    const inputData = `
    Topic: ${topic}
    Manufacturer Domain: ${domain}
    Additional Context: ${context}
    
    ${tavilyContext}

    APPROVED OUTLINE:
    ${outline}
    `;

    parts.push({ text: inputData });

    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        parts.push(imagePart);
        parts.push({ text: "Use this image for visual analysis and photo journalism description." });
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        return { 
            article: response.text, 
            grounding_metadata: response.candidates?.[0]?.groundingMetadata as GroundingMetadata | null 
        };
    } catch (error: any) {
        console.error("Error generating article:", error);
        throw new Error(`Failed to generate article: ${error.message}`);
    }
}

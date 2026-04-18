
export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
}

export interface ReviewSchema {
  itemReviewed: {
    name: string;
    description: string;
  };
  reviewRating: {
    ratingValue: string;
    bestRating: string;
  };
  author: {
    name: string;
  };
  positiveNotes: string[];
  negativeNotes: string[];
}

export interface FaqSchema {
  question: string;
  answer: string;
}

export interface Metadata {
  meta_title: string;
  meta_description: string;
  slug: string;
  feature_image_url: string;
  post_markdown_lines: string[];
  review_schema: ReviewSchema;
  faq_schema: FaqSchema[];
}

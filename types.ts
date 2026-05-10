export interface ProductConfig {
  productName: string;
  tagline: string;
  targetAudience: string;
  productDetails: string;
  packageStyle: string;
  accentColor: string;
  environmentDetails: string;
  sceneDescription: string;
  labelImageDescription: string;
  referenceImage?: string | null;
  logoImage?: string | null;
}

export type ProductDraft = Omit<ProductConfig, 'referenceImage' | 'logoImage'>;

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  promptUsed: string;
  config: ProductConfig;
  timestamp: number;
  supabaseConceptId?: string;
}

export interface SavedConcept {
  id: string;
  clientId?: string | null;
  productName: string;
  tagline: string;
  targetAudience: string;
  productDetails: string;
  packageStyle: string;
  accentColor: string;
  environmentDetails: string;
  sceneDescription: string;
  labelImageDescription: string;
  referenceImageUrl?: string | null;
  logoImageUrl?: string | null;
  generatedImageUrl?: string | null;
  promptUsed?: string | null;
  generationStatus: 'draft' | 'generating' | 'success' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface LandingFeature {
  title: string;
  body: string;
}

export interface LandingPageContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  featureTitle: string;
  features: LandingFeature[];
  proofPoints: string[];
  galleryTitle: string;
  closingHeadline: string;
  closingBody: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

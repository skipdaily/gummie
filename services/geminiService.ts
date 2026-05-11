import { GoogleGenAI } from "@google/genai";
import { GeneratedImage, LandingPageContent, ProductConfig, ProductDraft } from "../types";

const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';
const TEXT_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

// Base product photography direction provided to keep concepts consistent.
const BASE_THEME = `
The theme is premium product concept photography with tactile realism and a practical, useful feel.
It can flex across categories, audiences, and environments while keeping the product itself clear, inspectable, and believable.
The setting should reinforce the product idea and target audience rather than forcing a single brand, company, or product category.
Visually and conceptually: strong materials, thoughtful details, confident branding, and a finished prototype that feels ready for a pitch deck.
The product should look like a real manufacturable object, not a generic mockup or abstract concept.
`;

const getBase64Data = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid input image data');
  }
  return { mimeType: matches[1], data: matches[2] };
};

const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();

  reader.onloadend = () => {
    const result = String(reader.result || '');
    const base64 = result.split(',')[1];

    if (!base64) {
      reject(new Error('Could not read input image'));
      return;
    }

    resolve(base64);
  };

  reader.onerror = () => reject(new Error('Could not read input image'));
  reader.readAsDataURL(blob);
});

const getInlineImageData = async (source: string) => {
  if (source.startsWith('data:')) {
    return getBase64Data(source);
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error('Could not load saved input image');
  }

  const blob = await response.blob();
  return {
    mimeType: blob.type || 'image/png',
    data: await blobToBase64(blob),
  };
};

const parseDraftJson = (text: string): ProductDraft => {
  const jsonText = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI did not return a product spec draft');
  }

  const data = JSON.parse(match[0]);
  const requiredFields: Array<keyof ProductDraft> = [
    'brandName',
    'productName',
    'tagline',
    'targetAudience',
    'productDetails',
    'packageStyle',
    'accentColor',
    'environmentDetails',
    'sceneDescription',
    'labelImageDescription',
  ];

  for (const field of requiredFields) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`AI draft is missing ${field}`);
    }
  }

  return requiredFields.reduce((draft, field) => {
    draft[field] = data[field].trim();
    return draft;
  }, {} as ProductDraft);
};

const parseLandingJson = (text: string): LandingPageContent => {
  const jsonText = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI did not return landing page content');
  }

  const data = JSON.parse(match[0]);
  const requiredStrings: Array<keyof Omit<LandingPageContent, 'features' | 'proofPoints'>> = [
    'eyebrow',
    'headline',
    'subheadline',
    'ctaPrimary',
    'ctaSecondary',
    'featureTitle',
    'galleryTitle',
    'closingHeadline',
    'closingBody',
  ];

  for (const field of requiredStrings) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`Landing page draft is missing ${field}`);
    }
  }

  if (!Array.isArray(data.features) || data.features.length < 3) {
    throw new Error('Landing page draft needs at least 3 features');
  }

  if (!Array.isArray(data.proofPoints) || data.proofPoints.length < 3) {
    throw new Error('Landing page draft needs at least 3 proof points');
  }

  return {
    eyebrow: data.eyebrow.trim(),
    headline: data.headline.trim(),
    subheadline: data.subheadline.trim(),
    ctaPrimary: data.ctaPrimary.trim(),
    ctaSecondary: data.ctaSecondary.trim(),
    featureTitle: data.featureTitle.trim(),
    features: data.features.slice(0, 4).map((feature: any) => ({
      title: String(feature.title || '').trim(),
      body: String(feature.body || '').trim(),
    })).filter((feature: any) => feature.title && feature.body),
    proofPoints: data.proofPoints.slice(0, 4).map((point: any) => String(point || '').trim()).filter(Boolean),
    galleryTitle: data.galleryTitle.trim(),
    closingHeadline: data.closingHeadline.trim(),
    closingBody: data.closingBody.trim(),
  };
};

export const generateProductDraft = async (idea: string): Promise<ProductDraft> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });
  const promptText = `
You are helping turn a rough product idea into an editable product photography spec.
Use the user's idea as the source of truth, but fill in practical, specific details that will make a strong product concept image.
Do not mention that this was generated by AI.
Return valid JSON only. No markdown, no commentary.

JSON shape:
{
  "brandName": "short brand or company name, distinct from product name",
  "productName": "short brandable product name, all caps if it works",
  "tagline": "short product subtitle",
  "targetAudience": "who this product is for",
  "productDetails": "materials, features, finishes, accessories",
  "packageStyle": "physical product form, container, or packaging style",
  "accentColor": "a specific color name or hex color",
  "environmentDetails": "background props and setting",
  "sceneDescription": "clear product photography scene",
  "labelImageDescription": "label, logo, icon, badge, or graphic direction"
}

User idea:
${idea}
`;

  try {
    let lastError: any = null;

    for (const model of TEXT_MODEL_CANDIDATES) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            responseMimeType: "application/json",
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error("No text draft found in response");
        }

        return parseDraftJson(text);
      } catch (error: any) {
        lastError = error;
      }
    }

    throw lastError || new Error("No text model could draft specs");
  } catch (error: any) {
    const msg = error?.message || error?.toString() || "Unknown error";
    console.error("Gemini Product Draft Error:", msg, error);
    throw new Error(`Product spec draft failed: ${msg}`);
  }
};

export const generateLandingPageContent = async (concepts: GeneratedImage[]): Promise<LandingPageContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });
  const conceptBrief = concepts.map((concept, index) => ({
    order: index + 1,
    brandName: concept.config.brandName,
    productName: concept.config.productName,
    tagline: concept.config.tagline,
    targetAudience: concept.config.targetAudience,
    productDetails: concept.config.productDetails,
    packageStyle: concept.config.packageStyle,
    accentColor: concept.config.accentColor,
    sceneDescription: concept.config.sceneDescription,
    environmentDetails: concept.config.environmentDetails,
    labelImageDescription: concept.config.labelImageDescription,
  }));

  const promptText = `
You are writing concise landing page copy for a product concept page.
Use the selected product concepts as the source of truth. The first concept is the hero product. Additional concepts are supporting visuals or variants.
Write like a polished direct-to-consumer product page: concrete, benefit-led, and easy to scan.
Do not mention AI, generated images, mockups, prompts, or concept IDs.
Return valid JSON only. No markdown, no commentary.

JSON shape:
{
  "eyebrow": "short category or audience line",
  "headline": "clear product landing page headline",
  "subheadline": "1 sentence value proposition",
  "ctaPrimary": "2-4 word primary CTA",
  "ctaSecondary": "2-4 word secondary CTA",
  "featureTitle": "short section heading",
  "features": [
    { "title": "feature title", "body": "short feature body" },
    { "title": "feature title", "body": "short feature body" },
    { "title": "feature title", "body": "short feature body" }
  ],
  "proofPoints": ["short proof or spec point", "short proof or spec point", "short proof or spec point"],
  "galleryTitle": "short gallery section heading",
  "closingHeadline": "short final CTA heading",
  "closingBody": "1 sentence closing pitch"
}

Selected concepts:
${JSON.stringify(conceptBrief, null, 2)}
`;

  try {
    let lastError: any = null;

    for (const model of TEXT_MODEL_CANDIDATES) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            responseMimeType: "application/json",
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error("No landing page content found in response");
        }

        const content = parseLandingJson(text);
        if (content.features.length < 3 || content.proofPoints.length < 3) {
          throw new Error("Landing page content was incomplete");
        }
        return content;
      } catch (error: any) {
        lastError = error;
      }
    }

    throw lastError || new Error("No text model could draft a landing page");
  } catch (error: any) {
    const msg = error?.message || error?.toString() || "Unknown error";
    console.error("Gemini Landing Page Error:", msg, error);
    throw new Error(`Landing page generation failed: ${msg}`);
  }
};

const buildPrompt = (config: ProductConfig): string => {
  const isRef = !!config.referenceImage;
  const hasLogo = !!config.logoImage;

  let prompt = `Create a hyper-realistic, 8k professional product photography image of a product concept.`;

  if (isRef) {
    prompt += `
    REFERENCE IMAGE INSTRUCTIONS:
    The attached image is the "Hero" reference. You MUST generate a new image that mimics the visual style, lighting, composition, color grading, and atmosphere of this reference image.
    The goal is to create a variation of this image for a new product idea, maintaining the same aesthetic quality.
    
    HOWEVER, you must REPLACE the specific product details with the following new specifications:
    `;
  } else {
    prompt += `
    THEME GUIDELINES (STRICT):
    ${BASE_THEME}

    Visual Style: Photorealistic, cinematic depth of field, detailed materials, crisp label or surface graphics, and a believable real-world setting.

    PRODUCT DETAILS:
    `;
  }

  if (hasLogo) {
    if (isRef) {
      prompt += `
    LOGO IMAGE INSTRUCTIONS:
    A second attached image contains the logo/brand mark. Use that logo as the visual source for the product branding, label, badge, or printed mark.
    Preserve the logo's main shapes, proportions, and color character as much as the image model allows while adapting it naturally onto the product.
      `;
    } else {
      prompt += `
    LOGO IMAGE INSTRUCTIONS:
    The attached image contains the logo/brand mark. Use that logo as the visual source for the product branding, label, badge, or printed mark.
    Preserve the logo's main shapes, proportions, and color character as much as the image model allows while adapting it naturally onto the product.
      `;
    }
  }

  // Common Product Specs
  prompt += `
    - Brand Name: "${config.brandName}" (Use this as the maker, brand, or company name. Keep it distinct from the product name).
    - Name on Label: "${config.productName}" (Make the text bold, readable, and appropriate for the product category).
    - Subtitle/Tagline: "${config.tagline}" (Smaller supporting typography that matches the brand direction).
    - Label Artwork/Graphics: "${config.labelImageDescription}" (This MUST be rendered as a high-quality graphic, illustration, or icon printed directly on the product label).
    - Package/Form Style: ${config.packageStyle}.
    - Color Accents: ${config.accentColor} (Used for branding, trim, labels, or key product details).
    - Target Audience: ${config.targetAudience}.
    - Product Details: ${config.productDetails}.
  `;

  if (isRef) {
    // If ref exists, use user inputs as context modifications to the ref
    prompt += `
    - Scene Action/Subject (Adapt reference to this): ${config.sceneDescription}.
    - Environment Context (Adapt reference to this): ${config.environmentDetails}.
    - Specific Product Details or Props to Include: ${config.productDetails}.
    `;
  } else {
    // Standard full description if no ref
    prompt += `
    - Scene Composition/Action: ${config.sceneDescription}.
    - Background Environment: ${config.environmentDetails}.
    - Props and Supporting Details: Include relevant objects from the setting plus these product details: ${config.productDetails}.
    - Lighting: Professional product photography lighting, high contrast where appropriate, with realistic shadows and material highlights.
    `;
  }

  return prompt;
};

export const generateProductImage = async (config: ProductConfig): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });
  const promptText = buildPrompt(config);

  const parts: any[] = [];

  // If there is a reference image, add it as the first part
  if (config.referenceImage) {
    const { mimeType, data } = await getInlineImageData(config.referenceImage);
    parts.push({
      inlineData: {
        mimeType,
        data,
      },
    });
  }

  // If there is a logo image, add it after the style reference image.
  if (config.logoImage) {
    const { mimeType, data } = await getInlineImageData(config.logoImage);
    parts.push({
      inlineData: {
        mimeType,
        data,
      },
    });
  }

  // Add the text prompt
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: parts
      },
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Extract image from response
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response");

  } catch (error: any) {
    const msg = error?.message || error?.toString() || "Unknown error";
    console.error("Gemini Image Generation Error:", msg, error);
    throw new Error(`Image generation failed: ${msg}`);
  }
};

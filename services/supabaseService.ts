import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { GeneratedImage, LandingPageContent, ProductConfig, SavedConcept } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const ASSETS_BUCKET = (import.meta.env.VITE_SUPABASE_STORAGE_ASSETS_BUCKET as string | undefined) || 'product-concept-assets';
const RENDERS_BUCKET = (import.meta.env.VITE_SUPABASE_STORAGE_RENDERS_BUCKET as string | undefined) || 'product-concept-renders';

let supabase: SupabaseClient | null = null;
let runtimeConfig: SupabaseConfig | null = null;
let runtimeConfigPromise: Promise<SupabaseConfig | null> | null = null;

interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

interface SaveOwner {
  userId: string;
  storageFolder: string;
}

const buildTimeConfig = (): SupabaseConfig | null => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  return {
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  };
};

const createSupabase = (config: SupabaseConfig) => {
  if (!supabase) {
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  return supabase;
};

export const getSupabase = () => {
  const config = buildTimeConfig() || runtimeConfig;
  return config ? createSupabase(config) : null;
};

const loadRuntimeConfig = async (): Promise<SupabaseConfig | null> => {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch('/api/supabase-config', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        if (!data?.supabaseUrl || !data?.supabaseAnonKey) {
          return null;
        }

        runtimeConfig = {
          supabaseUrl: data.supabaseUrl,
          supabaseAnonKey: data.supabaseAnonKey,
        };

        return runtimeConfig;
      })
      .catch(() => null);
  }

  return runtimeConfigPromise;
};

const getSupabaseClient = async () => {
  const configuredClient = getSupabase();
  if (configuredClient) {
    return configuredClient;
  }

  const config = await loadRuntimeConfig();
  return config ? createSupabase(config) : null;
};

export const isSupabaseConfigured = () => !!getSupabase();

export const checkSupabaseConfigured = async () => !!(await getSupabaseClient());

export const getSession = async (): Promise<Session | null> => {
  const client = await getSupabaseClient();
  if (!client) return null;

  const result = await client.auth.getSession();
  if (result.error) {
    throw result.error;
  }

  return result.data.session;
};

export const signInWithEmail = async (email: string, password: string) => {
  const client = await getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const client = await getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const result = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (result.error) throw result.error;
  return result.data;
};

export const sendPasswordReset = async (email: string) => {
  const client = await getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const result = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (result.error) throw result.error;
};

export const updatePassword = async (password: string) => {
  const client = await getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const result = await client.auth.updateUser({ password });
  if (result.error) throw result.error;
};

export const signOut = async () => {
  const client = await getSupabaseClient();
  if (!client) return;

  const result = await client.auth.signOut();
  if (result.error) throw result.error;
};

export const onAuthChange = (
  callback: (event: string, session: Session | null) => void
) => getSupabaseClient().then(client => {
  if (!client) {
    return { unsubscribe: () => {} };
  }

  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return data.subscription;
});

const ensureSaveOwner = async (client: SupabaseClient): Promise<SaveOwner> => {
  const sessionResult = await client.auth.getSession();
  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (sessionResult.data.session?.user) {
    return {
      userId: sessionResult.data.session.user.id,
      storageFolder: sessionResult.data.session.user.id,
    };
  }

  throw new Error('Please sign in before saving to Supabase.');
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('jpeg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('svg')) return 'svg';
  return 'png';
};

const uploadDataUrl = async (
  client: SupabaseClient,
  bucket: string,
  pathWithoutExtension: string,
  dataUrl?: string | null
) => {
  if (!dataUrl) {
    return { path: null, url: null };
  }

  const blob = await dataUrlToBlob(dataUrl);
  const extension = extensionForMime(blob.type);
  const path = `${pathWithoutExtension}.${extension}`;

  const uploadResult = await client.storage
    .from(bucket)
    .upload(path, blob, {
      cacheControl: '31536000',
      contentType: blob.type,
      upsert: true,
    });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const publicUrl = client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return { path, url: publicUrl };
};

const sanitizeConfig = (config: ProductConfig) => ({
  productName: config.productName,
  tagline: config.tagline,
  targetAudience: config.targetAudience,
  productDetails: config.productDetails,
  packageStyle: config.packageStyle,
  accentColor: config.accentColor,
  environmentDetails: config.environmentDetails,
  sceneDescription: config.sceneDescription,
  labelImageDescription: config.labelImageDescription,
  hasReferenceImage: !!config.referenceImage,
  hasLogoImage: !!config.logoImage,
});

const savedConceptSelect = `
  id,
  client_id,
  product_name,
  tagline,
  target_audience,
  product_details,
  package_style,
  accent_color,
  environment_details,
  scene_description,
  label_image_description,
  reference_image_url,
  logo_image_url,
  generated_image_url,
  prompt_used,
  generation_status,
  created_at,
  updated_at
`;

const mapSavedConceptRow = (row: any): SavedConcept => ({
  id: row.id,
  clientId: row.client_id,
  productName: row.product_name,
  tagline: row.tagline,
  targetAudience: row.target_audience,
  productDetails: row.product_details,
  packageStyle: row.package_style,
  accentColor: row.accent_color,
  environmentDetails: row.environment_details,
  sceneDescription: row.scene_description,
  labelImageDescription: row.label_image_description,
  referenceImageUrl: row.reference_image_url,
  logoImageUrl: row.logo_image_url,
  generatedImageUrl: row.generated_image_url,
  promptUsed: row.prompt_used,
  generationStatus: row.generation_status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listSavedConcepts = async (): Promise<SavedConcept[]> => {
  const client = await getSupabaseClient();
  if (!client) {
    return [];
  }

  await ensureSaveOwner(client);

  const result = await client
    .from('product_concepts')
    .select(savedConceptSelect)
    .order('created_at', { ascending: false })
    .limit(80);

  if (result.error) {
    throw result.error;
  }

  return (result.data || []).map(mapSavedConceptRow);
};

export const saveAssetDraft = async (config: ProductConfig): Promise<SavedConcept> => {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  if (!config.referenceImage && !config.logoImage) {
    throw new Error('Upload a hero reference image or logo before saving assets.');
  }

  const owner = await ensureSaveOwner(client);
  const conceptId = crypto.randomUUID();
  const basePath = `${owner.storageFolder}/${conceptId}`;

  const [referenceUpload, logoUpload] = await Promise.all([
    uploadDataUrl(client, ASSETS_BUCKET, `${basePath}/reference`, config.referenceImage),
    uploadDataUrl(client, ASSETS_BUCKET, `${basePath}/logo`, config.logoImage),
  ]);

  const insertResult = await client
    .from('product_concepts')
    .insert({
      id: conceptId,
      user_id: owner.userId,
      product_name: config.productName,
      tagline: config.tagline,
      target_audience: config.targetAudience,
      product_details: config.productDetails,
      package_style: config.packageStyle,
      accent_color: config.accentColor,
      environment_details: config.environmentDetails,
      scene_description: config.sceneDescription,
      label_image_description: config.labelImageDescription,
      reference_image_path: referenceUpload.path,
      reference_image_url: referenceUpload.url,
      logo_image_path: logoUpload.path,
      logo_image_url: logoUpload.url,
      prompt_used: null,
      generation_status: 'draft',
      raw_config: sanitizeConfig(config),
      image_metadata: {
        savedAssetDraft: true,
      },
    })
    .select(savedConceptSelect)
    .single();

  if (insertResult.error) {
    throw insertResult.error;
  }

  return mapSavedConceptRow(insertResult.data);
};

export const saveGeneratedConcept = async (image: GeneratedImage): Promise<GeneratedImage> => {
  const client = await getSupabaseClient();
  if (!client) {
    console.warn('Supabase save skipped: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
    return image;
  }

  const owner = await ensureSaveOwner(client);
  const conceptId = crypto.randomUUID();
  const basePath = `${owner.storageFolder}/${conceptId}`;

  const [referenceUpload, logoUpload, renderUpload] = await Promise.all([
    uploadDataUrl(client, ASSETS_BUCKET, `${basePath}/reference`, image.config.referenceImage),
    uploadDataUrl(client, ASSETS_BUCKET, `${basePath}/logo`, image.config.logoImage),
    uploadDataUrl(client, RENDERS_BUCKET, `${basePath}/generated`, image.imageUrl),
  ]);

  const insertResult = await client
    .from('product_concepts')
    .insert({
      id: conceptId,
      user_id: owner.userId,
      client_id: image.id,
      product_name: image.config.productName,
      tagline: image.config.tagline,
      target_audience: image.config.targetAudience,
      product_details: image.config.productDetails,
      package_style: image.config.packageStyle,
      accent_color: image.config.accentColor,
      environment_details: image.config.environmentDetails,
      scene_description: image.config.sceneDescription,
      label_image_description: image.config.labelImageDescription,
      reference_image_path: referenceUpload.path,
      reference_image_url: referenceUpload.url,
      logo_image_path: logoUpload.path,
      logo_image_url: logoUpload.url,
      generated_image_path: renderUpload.path,
      generated_image_url: renderUpload.url,
      prompt_used: image.promptUsed,
      generation_status: 'success',
      raw_config: sanitizeConfig(image.config),
      image_metadata: {
        localTimestamp: image.timestamp,
        localImageUrlWasDataUrl: image.imageUrl.startsWith('data:'),
      },
    })
    .select('id, generated_image_url')
    .single();

  if (insertResult.error) {
    throw insertResult.error;
  }

  return {
    ...image,
    imageUrl: insertResult.data.generated_image_url || image.imageUrl,
    supabaseConceptId: insertResult.data.id,
  };
};

export const saveLandingPage = async (
  content: LandingPageContent,
  concepts: GeneratedImage[]
) => {
  const client = await getSupabaseClient();
  if (!client) {
    console.warn('Supabase landing page save skipped: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
    return null;
  }

  const owner = await ensureSaveOwner(client);
  const savedConcepts = concepts.filter(concept => concept.supabaseConceptId);

  if (savedConcepts.length === 0) {
    throw new Error('Landing page was generated, but no selected concepts have been saved to Supabase yet.');
  }

  const landingInsert = await client
    .from('landing_pages')
    .insert({
      user_id: owner.userId,
      hero_concept_id: savedConcepts[0].supabaseConceptId,
      eyebrow: content.eyebrow,
      headline: content.headline,
      subheadline: content.subheadline,
      cta_primary: content.ctaPrimary,
      cta_secondary: content.ctaSecondary,
      feature_title: content.featureTitle,
      features: content.features,
      proof_points: content.proofPoints,
      gallery_title: content.galleryTitle,
      closing_headline: content.closingHeadline,
      closing_body: content.closingBody,
      selected_concept_snapshot: savedConcepts.map(concept => ({
        id: concept.supabaseConceptId,
        clientId: concept.id,
        productName: concept.config.productName,
        targetAudience: concept.config.targetAudience,
        generatedImageUrl: concept.imageUrl,
      })),
    })
    .select('id')
    .single();

  if (landingInsert.error) {
    throw landingInsert.error;
  }

  const joinRows = savedConcepts.map((concept, index) => ({
    landing_page_id: landingInsert.data.id,
    concept_id: concept.supabaseConceptId,
    display_order: index,
  }));

  const joinInsert = await client.from('landing_page_concepts').insert(joinRows);
  if (joinInsert.error) {
    throw joinInsert.error;
  }

  return landingInsert.data.id as string;
};

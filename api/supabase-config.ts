export default function handler(_request: any, response: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  response.setHeader('Cache-Control', 'no-store');

  if (!supabaseUrl || !supabaseAnonKey) {
    response.status(500).json({
      configured: false,
      missing: {
        supabaseUrl: !supabaseUrl,
        supabaseAnonKey: !supabaseAnonKey,
      },
    });
    return;
  }

  response.status(200).json({
    configured: true,
    supabaseUrl,
    supabaseAnonKey,
  });
}

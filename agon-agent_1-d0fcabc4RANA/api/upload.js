import supabase from './db-client.js';

const bucket = 'product-images';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Admin sign-in required' });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || user?.email?.toLowerCase() !== 'rafnainvestment@gmail.com') return res.status(403).json({ error: 'Admin access required' });
    const { contentType, size } = req.body || {};
    const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    if (!types[contentType] || !Number.isFinite(size) || size <= 0 || size > 8388608) return res.status(400).json({ error: 'Choose a JPG, PNG, WebP or GIF image under 8 MB.' });
    const path = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${types[contentType]}`;
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw error;
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return res.status(200).json({ path, token: data.token, url: publicData.publicUrl });
  } catch (err) {
    console.error('Upload API:', err);
    return res.status(500).json({ error: err.message });
  }
}

import supabase from './db-client.js';

const adminEmail = 'rafnainvestment@gmail.com';
async function removeManagedImage(url) {
  if (!url) return;
  try {
    const parsed = new URL(url);
    const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const prefix = '/storage/v1/object/public/product-images/';
    if (parsed.origin !== project.origin || !parsed.pathname.startsWith(prefix)) return;
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    const { error } = await supabase.storage.from('product-images').remove([path]);
    if (error) console.error('Image cleanup:', error);
  } catch (error) { console.error('Image cleanup:', error); }
}
async function verifyAdmin(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return !error && user?.email?.toLowerCase() === adminEmail;
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('products').select('id,title,category,price,description,image_url,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Admin sign-in required' });
    if (req.method === 'POST' || req.method === 'PUT') {
      const { title, category, price, description, image_url } = req.body || {};
      if (typeof title !== 'string' || title.trim().length < 2 || typeof category !== 'string' || !Number.isFinite(Number(price)) || Number(price) <= 0 || typeof description !== 'string' || typeof image_url !== 'string' || !image_url.trim()) return res.status(400).json({ error: 'Please provide a valid title, category, price, description and image.' });
      const payload = { title: title.trim().slice(0, 120), category: category.trim(), price: Number(price), description: description.trim().slice(0, 1000), image_url: image_url.trim().slice(0, 2000) };
      let previousImage = null;
      if (req.method === 'PUT' && req.body.id) {
        const { data: previous, error: readError } = await supabase.from('products').select('image_url').eq('id', req.body.id).single();
        if (readError) throw readError;
        previousImage = previous.image_url;
      }
      const query = req.method === 'POST' ? supabase.from('products').insert(payload) : supabase.from('products').update(payload).eq('id', req.body.id);
      if (req.method === 'PUT' && !req.body.id) return res.status(400).json({ error: 'Product id required' });
      const { data, error } = await query.select('*').single();
      if (error) throw error;
      if (previousImage && previousImage !== data.image_url) await removeManagedImage(previousImage);
      return res.status(req.method === 'POST' ? 201 : 200).json(data);
    }
    if (req.method === 'DELETE') {
      if (!req.body?.id) return res.status(400).json({ error: 'Product id required' });
      const { data: previous } = await supabase.from('products').select('image_url').eq('id', req.body.id).maybeSingle();
      const { error } = await supabase.from('products').delete().eq('id', req.body.id);
      if (error) throw error;
      if (previous?.image_url) await removeManagedImage(previous.image_url);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Products API:', err);
    return res.status(500).json({ error: err.message });
  }
}

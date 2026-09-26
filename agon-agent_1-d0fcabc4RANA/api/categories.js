import supabase from './db-client.js';

const adminEmail = 'rafnainvestment@gmail.com';
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
      const { data, error } = await supabase.from('categories').select('id,name,created_at').order('name');
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Admin sign-in required' });
    if (req.method === 'POST') {
      const name = req.body?.name?.trim();
      if (!name || name.length < 2) return res.status(400).json({ error: 'Category name required' });
      const { data, error } = await supabase.from('categories').insert({ name }).select('*').single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, name } = req.body || {};
      if (!id || !name?.trim()) return res.status(400).json({ error: 'Category id and new name required' });
      const { data: existing, error: readError } = await supabase.from('categories').select('name').eq('id', id).single();
      if (readError) throw readError;
      const { error: productError } = await supabase.from('products').update({ category: name.trim() }).eq('category', existing.name);
      if (productError) throw productError;
      const { data, error } = await supabase.from('categories').update({ name: name.trim() }).eq('id', id).select('*').single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Category id required' });
      const { data: existing, error: readError } = await supabase.from('categories').select('name').eq('id', id).single();
      if (readError) throw readError;
      const { error: productError } = await supabase.from('products').update({ category: 'Uncategorized' }).eq('category', existing.name);
      if (productError) throw productError;
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Categories API:', err);
    return res.status(500).json({ error: err.message });
  }
}

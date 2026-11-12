import { supabase } from '@/integrations/supabase/client';

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads a banner image to the signed-in user's folder and saves it on the office or institution. */
export async function uploadBanner(kind: 'office' | 'institution', targetId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_BYTES) throw new Error('Image must be under 5 MB.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in first.');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${user.id}/${kind}-banners/${targetId}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('community-assets').upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  const url = supabase.storage.from('community-assets').getPublicUrl(path).data.publicUrl;
  const fn = kind === 'office' ? 'set_office_banner' : 'set_institution_banner';
  const args = kind === 'office' ? { p_position_id: targetId, p_url: url } : { p_institution_id: targetId, p_url: url };
  const { error } = await (supabase as any).rpc(fn, args);
  if (error) throw error;
  return url;
}

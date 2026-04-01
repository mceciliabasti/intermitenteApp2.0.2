// Utilidad para subir PDFs a Supabase Storage desde el frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadPdfToSupabase(file) {
  const bucket = 'pdf';
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  // Obtener URL pública
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
  if (!publicUrl || !publicUrl.publicUrl) throw new Error('No se pudo obtener la URL pública del PDF');
  return publicUrl.publicUrl;
}

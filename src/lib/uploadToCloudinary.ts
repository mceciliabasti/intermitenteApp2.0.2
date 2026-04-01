// Utilidad para subir archivos a Cloudinary desde el frontend
// npm install cloudinary --save (solo si necesitas el SDK, pero usaremos fetch)
export async function uploadToCloudinary(file) {
  // 1. Obtener firma segura del backend
  const sigRes = await fetch('/api/cloudinary-signature', { method: 'POST' });
  const { timestamp, signature, apiKey, cloudName, folder } = await sigRes.json();

  // 2. Preparar formData para Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  // 3. Subir a Cloudinary
  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Error al subir a Cloudinary');
  return uploadData.secure_url;
}

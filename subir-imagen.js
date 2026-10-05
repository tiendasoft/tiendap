import { put } from '@vercel/blob';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFileSize: 4 * 1024 * 1024,
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://tiendap-ten.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido. Usá POST.' });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: 'Falta configurar BLOB_READ_WRITE_TOKEN en Vercel.'
      });
    }

    const { fields, files } = await parseForm(req);
    let uploaded = files.image;
    if (Array.isArray(uploaded)) uploaded = uploaded[0];

    if (!uploaded || !uploaded.filepath) {
      return res.status(400).json({ ok: false, error: 'No se recibió la imagen.' });
    }

    const fs = await import('node:fs/promises');
    const buffer = await fs.readFile(uploaded.filepath);
    const contentType = uploaded.mimetype || 'image/jpeg';
    const originalName = uploaded.originalFilename || 'producto.jpg';
    const safeFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150);

    const blob = await put(`productos/${Date.now()}-${safeFilename}`, buffer, {
      access: 'public',
      contentType,
    });

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'No se pudo subir la imagen.'
    });
  }
}

import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://tiendap-ten.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido. Usá POST."
    });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: "Falta configurar BLOB_READ_WRITE_TOKEN en Vercel."
      });
    }

    const body = req.body || {};
    const image = body.image;
    const filename = body.filename || `imagen-${Date.now()}.jpg`;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        ok: false,
        error: "No se recibió la imagen."
      });
    }

    const match = image.match(/^data:([^;]+);base64,(.+)$/);

    if (!match) {
      return res.status(400).json({
        ok: false,
        error: "El formato de imagen recibido no es válido."
      });
    }

    const contentType = match[1];
    const base64Data = match[2];

    const buffer = Buffer.from(base64Data, "base64");

    const safeFilename = String(filename)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 150);

    const blob = await put(
      `productos/${Date.now()}-${safeFilename}`,
      buffer,
      {
        access: "public",
        contentType
      }
    );

    return res.status(200).json({
      ok: true,
      url: blob.url
    });

  } catch (error) {
    console.error("Error al subir imagen:", error);

    return res.status(500).json({
      ok: false,
error: error?.message || "No se pudo subir la imagen."
    });
  }
}

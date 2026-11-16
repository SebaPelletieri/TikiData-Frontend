/**
 * Achica y comprime una imagen en el navegador antes de guardarla como base64.
 *
 * json-server rechaza cualquier pedido de más de 100 KB (límite de su lector de JSON) y
 * se cae. Una foto de celular en base64 pesa varios MB, así que antes de mandarla se
 * redimensiona (máximo 256 px por lado, alcanza de sobra para un avatar) y se baja la
 * calidad hasta que entre con margen. También evita llenar el localStorage, donde se
 * guarda el usuario de la sesión.
 */

export const MAX_AVATAR_CHARS = 60_000; // ~60 KB de texto, lejos del límite de 100 KB

export class ImageTooLargeError extends Error {
  constructor() {
    super('No se pudo achicar la imagen lo suficiente. Probá con otra.');
    this.name = 'ImageTooLargeError';
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo no es una imagen válida.'));
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  maxSide = 256,
  maxChars = MAX_AVATAR_CHARS,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo tiene que ser una imagen (PNG o JPG).');
  }

  const img = await loadImage(file);
  let side = maxSide;

  // Si con la calidad mínima todavía no entra, se achica un poco más el tamaño
  while (side >= 96) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    // Fondo blanco: los PNG con transparencia quedarían negros al pasar a JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.85, 0.75, 0.65, 0.5]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= maxChars) return dataUrl;
    }
    side = Math.round(side * 0.75);
  }

  throw new ImageTooLargeError();
}

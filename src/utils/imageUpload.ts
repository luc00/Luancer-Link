export function compressImageFileToDataUrl(
  file: File,
  maxDimension = 180,
  maxChars = 28000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere il file immagine.'));
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        reject(new Error('File immagine vuoto.'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl.slice(0, maxChars));
      img.onload = () => {
        const attempts: Array<{ dim: number; quality: number; mime: string }> = [
          { dim: maxDimension, quality: 0.86, mime: 'image/webp' },
          { dim: Math.min(maxDimension, 140), quality: 0.78, mime: 'image/webp' },
          { dim: Math.min(maxDimension, 128), quality: 0.75, mime: 'image/jpeg' },
          { dim: 96, quality: 0.65, mime: 'image/jpeg' },
        ];

        for (const attempt of attempts) {
          const longestSide = Math.max(img.width, img.height) || 1;
          const scale = longestSide > attempt.dim ? attempt.dim / longestSide : 1;
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl.slice(0, maxChars));
            return;
          }
          if (attempt.mime === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);
          const encoded = canvas.toDataURL(attempt.mime, attempt.quality);
          if (encoded.length <= maxChars) {
            resolve(encoded);
            return;
          }
        }

        // Final conservative fallback
        const canvas = document.createElement('canvas');
        canvas.width = 72;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 72, 72);
          ctx.drawImage(img, 0, 0, 72, 72);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } else {
          resolve(rawDataUrl.slice(0, maxChars));
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

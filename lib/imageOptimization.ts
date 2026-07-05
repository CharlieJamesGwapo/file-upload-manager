const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 2048;
const COMPRESSION_QUALITY = 0.8;

export const optimizeImage = async (blob: Blob): Promise<Blob> => {
  // If image is small enough, return as is
  if (blob.size < MAX_IMAGE_SIZE) {
    return blob;
  }

  // For very large images, compress them
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if too large
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (compressedBlob) => {
              // If compression didn't help or made it worse, use original
              if (!compressedBlob || compressedBlob.size >= blob.size) {
                resolve(blob);
              } else {
                resolve(compressedBlob);
              }
            },
            'image/jpeg',
            COMPRESSION_QUALITY
          );
        } else {
          resolve(blob);
        }
      };
      img.onerror = () => resolve(blob);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(blob);
    reader.readAsDataURL(blob);
  });
};

export const createThumbnail = async (blob: Blob): Promise<string | undefined> => {
  if (!blob.type.startsWith('image/')) {
    return undefined;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 100;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.max(size / img.width, size / img.height);
          const x = (size / 2) - (img.width / 2) * scale;
          const y = (size / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(undefined);
        }
      };
      img.onerror = () => resolve(undefined);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(blob);
  });
};

export const isImageFile = (type: string): boolean => {
  return type.startsWith('image/');
};

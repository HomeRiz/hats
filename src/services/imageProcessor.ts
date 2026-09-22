import { rgbToHex } from './colorEngine';

export interface ProcessedImageResult {
  dataUrl: string;
  avgColor: string;
  dominantAccent: string;
  width: number;
  height: number;
}

export async function processBackgroundImage(
  fileOrUrl: File | string,
  targetWidth = 1920,
  targetHeight = 1080,
  darkenFactor = 0.22
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const srcRatio = img.width / img.height;
      const dstRatio = targetWidth / targetHeight;
      let renderW = targetWidth;
      let renderH = targetHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (srcRatio > dstRatio) {
        renderH = targetHeight;
        renderW = Math.round(targetHeight * srcRatio);
        offsetX = (targetWidth - renderW) / 2;
      } else {
        renderW = targetWidth;
        renderH = Math.round(targetWidth / srcRatio);
        offsetY = (targetHeight - renderH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

      if (darkenFactor > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, Math.max(0, darkenFactor))})`;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight).data;
      let totalR = 0;
      let totalG = 0;
      let totalB = 0;
      let count = 0;

      const sampleStep = 16 * 4;
      let maxSat = 0;
      let dominantAccent = '#0A84FF';

      for (let i = 0; i < imgData.length; i += sampleStep) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        totalR += r;
        totalG += g;
        totalB += b;
        count++;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        if (sat > maxSat && max > 50 && max < 240) {
          maxSat = sat;
          dominantAccent = rgbToHex(r, g, b);
        }
      }

      const avgR = count > 0 ? totalR / count : 20;
      const avgG = count > 0 ? totalG / count : 20;
      const avgB = count > 0 ? totalB / count : 25;
      const avgColor = rgbToHex(avgR, avgG, avgB);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

      resolve({
        dataUrl,
        avgColor,
        dominantAccent,
        width: targetWidth,
        height: targetHeight,
      });
    };

    img.onerror = (err) => {
      reject(err);
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(fileOrUrl);
    }
  });
}

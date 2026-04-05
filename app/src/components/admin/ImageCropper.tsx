'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Check, Move, X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File | null;
  aspectRatio?: number; // width / height
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  maxWidth?: number;
}

export default function ImageCropper({
  imageFile,
  aspectRatio = 16 / 9,
  onCrop,
  onCancel,
  maxWidth = 1200,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        const containerWidth = 600; // rough guess for preview
        const containerHeight = 400;
        const cropHeight = containerWidth / aspectRatio;
        const initialScale = Math.max(containerWidth / image.width, cropHeight / image.height);

        setImg(image);
        setScale(initialScale);
        setOffset({
          x: (containerWidth - image.width * initialScale) / 2,
          y: (containerHeight - image.height * initialScale) / 2,
        });
      };
      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  }, [aspectRatio, imageFile]);

  useEffect(() => {
    if (!img || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with scale and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Draw crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    const cropWidth = canvas.width;
    const cropHeight = canvas.width / aspectRatio;
    const cropY = (canvas.height - cropHeight) / 2;

    // Outer shade
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(0, cropY, cropWidth, cropHeight);
    ctx.fill('evenodd');

    // White border for crop area
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, cropY, cropWidth, cropHeight);
  }, [img, scale, offset, aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setLastMousePos({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - lastMousePos.x;
    const dy = clientY - lastMousePos.y;

    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!img || !canvasRef.current) return;

    const cropCanvas = document.createElement('canvas');
    const finalWidth = Math.min(maxWidth, img.width);
    const finalHeight = finalWidth / aspectRatio;
    cropCanvas.width = finalWidth;
    cropCanvas.height = finalHeight;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    // The crop box in canvas coordinates
    const canvas = canvasRef.current;
    const cropBoxHeight = canvas.width / aspectRatio;
    const cropBoxY = (canvas.height - cropBoxHeight) / 2;

    // Calculate source coordinates
    // (sx, sy) = crop center in image space
    const sourceX = (-offset.x) / scale;
    const sourceY = (cropBoxY - offset.y) / scale;
    const sourceWidth = canvas.width / scale;
    const sourceHeight = cropBoxHeight / scale;

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, finalWidth, finalHeight
    );

    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile?.name || 'cropped.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCrop(croppedFile);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/90 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#422523] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <h2 className="font-serif text-xl font-bold text-white">Ajustar Imagem</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              className="w-full cursor-move touch-none"
            />
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setScale(s => s * 0.9)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
              >
                <ZoomOut size={18} />
              </button>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.01"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-32 accent-[#DBA1A2]"
              />
              <button
                onClick={() => setScale(s => s * 1.1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
              >
                <ZoomIn size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
              <Move size={14} />
              Arraste para reposicionar
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 bg-black/20 p-6">
          <button
            onClick={onCancel}
            className="rounded-xl px-6 py-3 font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrop}
            className="flex items-center gap-2 rounded-xl bg-[#DBA1A2] px-8 py-3 font-bold text-white shadow-lg transition hover:bg-[#D48F90]"
          >
            <Check size={20} />
            Aplicar Ajuste
          </button>
        </div>
      </div>
    </div>
  );
}

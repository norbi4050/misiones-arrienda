"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Slider } from './slider';
import { RotateCw, ZoomIn, ZoomOut, Move, Check, X } from 'lucide-react';
import { cn } from "@/utils";

interface ImageCropperProps {
  src: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({
  src,
  onCrop,
  onCancel,
  aspectRatio = 1, // 1:1 por defecto para avatares
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.8
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });

  // Cargar imagen
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    if (imageRef.current) {
      const img = imageRef.current;
      const containerWidth = 400;
      const containerHeight = 400;
      
      // Calcular escala inicial para que la imagen quepa en el contenedor
      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      const initialScale = Math.min(scaleX, scaleY);
      
      setScale(initialScale);
      
      // Centrar imagen
      setPosition({
        x: (containerWidth - img.naturalWidth * initialScale) / 2,
        y: (containerHeight - img.naturalHeight * initialScale) / 2
      });
      
      // Configurar área de crop inicial
      const cropSize = Math.min(containerWidth, containerHeight) * 0.8;
      setCropArea({
        x: (containerWidth - cropSize) / 2,
        y: (containerHeight - cropSize) / 2,
        width: cropSize,
        height: cropSize / aspectRatio
      });
    }
  }, [aspectRatio]);

  // Manejar inicio de drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  // Manejar drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  // Finalizar drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Aplicar crop y generar blob
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Configurar canvas
    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aplicar transformaciones
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Calcular posición de la imagen en el canvas
    const sourceX = (cropArea.x - position.x) / scale;
    const sourceY = (cropArea.y - position.y) / scale;
    const sourceWidth = cropArea.width / scale;
    const sourceHeight = cropArea.height / scale;

    // Dibujar imagen croppeada
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );

    ctx.restore();

    // Convertir a blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
        }
      },
      'image/jpeg',
      quality
    );
  }, [cropArea, position, scale, rotation, maxWidth, maxHeight, quality, onCrop]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Ajustar Imagen</h3>
        
        {/* Área de preview */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
          {/* Imagen */}
          <img
            ref={imageRef}
            src={src}
            alt="Preview"
            className={cn(
              "absolute cursor-move transition-transform",
              isDragging && "cursor-grabbing"
            )}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            draggable={false}
          />
          
          {/* Área de crop */}
          {imageLoaded && (
            <div
              className="absolute border-2 border-white shadow-lg pointer-events-none"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="absolute inset-0 border border-dashed border-white opacity-50" />
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="space-y-4">
          {/* Zoom */}
          <div className="flex items-center space-x-4">
            <ZoomOut className="w-4 h-4" />
            <Slider
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              min={0.1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4" />
            <span className="text-sm text-gray-500 w-12">{Math.round(scale * 100)}%</span>
          </div>

          {/* Rotación */}
          <div className="flex items-center space-x-4">
            <RotateCw className="w-4 h-4" />
            <Slider
              value={[rotation]}
              onValueChange={([value]) => setRotation(value)}
              min={-180}
              max={180}
              step={15}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-12">{rotation}°</span>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setScale(1);
                  setRotation(0);
                  setPosition({ x: 0, y: 0 });
                }}
              >
                Resetear
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleCrop}
                disabled={!imageLoaded}
              >
                <Check className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas oculto para procesamiento */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={maxWidth}
          height={maxHeight}
        />
      </div>
    </div>
  );
}

export default ImageCropper;

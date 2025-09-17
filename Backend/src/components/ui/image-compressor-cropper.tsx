"use client"

import React, { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCompressorCropperProps {
  imageFile: File
  onComplete: (compressedFile: File) => void
  onCancel: () => void
  maxSizePx?: number
  quality?: number
  aspect?: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCompressorCropper({
  imageFile,
  onComplete,
  onCancel,
  maxSizePx = 1024,
  quality = 0.8,
  aspect = 1 // Square by default
}: ImageCompressorCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load image file as data URL
  React.useEffect(() => {
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
    }
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0
  ): Promise<HTMLCanvasElement> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const maxSize = Math.max(pixelCrop.width, pixelCrop.height)
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = maxSize
    canvas.height = maxSize

    ctx.save()

    // Move the crop origin to the canvas origin (0, 0)
    ctx.translate(maxSize / 2, maxSize / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-maxSize / 2, -maxSize / 2)

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      (maxSize - pixelCrop.width) / 2,
      (maxSize - pixelCrop.height) / 2,
      pixelCrop.width,
      pixelCrop.height
    )

    ctx.restore()

    return canvas
  }

  const compressImage = async (canvas: HTMLCanvasElement): Promise<File> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], imageFile.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          }
        },
        'image/jpeg',
        quality
      )
    })
  }

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return

    try {
      const canvas = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)

      // Resize if necessary
      const resizedCanvas = await resizeCanvas(canvas, maxSizePx)

      // Compress
      const compressedFile = await compressImage(resizedCanvas)

      / imageFile.size * 100).toFixed(1) + '%'
      })

      onComplete(compressedFile)
    } catch (error) {
      console.error('Error processing image:', error)
    }
  }

  const resizeCanvas = (canvas: HTMLCanvasElement, maxSize: number): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const resizedCanvas = document.createElement('canvas')
      const ctx = resizedCanvas.getContext('2d')

      if (!ctx) {
        resolve(canvas)
        return
      }

      const { width, height } = canvas
      const maxDimension = Math.max(width, height)

      if (maxDimension <= maxSize) {
        resolve(canvas)
        return
      }

      const scale = maxSize / maxDimension
      resizedCanvas.width = width * scale
      resizedCanvas.height = height * scale

      ctx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height)
      resolve(resizedCanvas)
    })
  }

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90)
  }

  const handleRotateRight = () => {
    setRotation(prev => prev + 90)
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar imagen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper */}
          <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              rotation={rotation}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom */}
            <div className="flex items-center space-x-2">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4" />
              <span className="text-sm text-gray-600 w-12">{zoom.toFixed(1)}x</span>
            </div>

            {/* Rotation */}
            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleRotateLeft}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Girar
              </Button>
              <span className="text-sm text-gray-600">{rotation}°</span>
              <Button variant="outline" size="sm" onClick={handleRotateRight}>
                <RotateCw className="h-4 w-4 mr-1" />
                Girar
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleApplyCrop} disabled={!croppedAreaPixels}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

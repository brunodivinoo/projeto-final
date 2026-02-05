'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Pencil, Crop, Undo2, Redo2, Download, Check, Eraser, Minus, Plus } from 'lucide-react'

interface ImageEditorProps {
  imageBase64: string
  imageType: string
  onSave: (editedBase64: string) => void
  onCancel: () => void
}

type Tool = 'draw' | 'crop' | 'eraser'

interface DrawAction {
  type: 'draw' | 'erase'
  paths: { x: number; y: number }[]
  color: string
  lineWidth: number
}

const COLORS = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF']
const LINE_WIDTHS = [2, 4, 8, 12, 16]

export function ImageEditor({ imageBase64, imageType, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<Tool>('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#FF0000')
  const [lineWidth, setLineWidth] = useState(4)
  const [history, setHistory] = useState<DrawAction[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)

  // Crop state
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null)
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setOriginalImage(img)

      const canvas = canvasRef.current
      if (!canvas) return

      // Calculate canvas size to fit container while maintaining aspect ratio
      const container = containerRef.current
      if (!container) return

      const maxWidth = container.clientWidth - 40
      const maxHeight = container.clientHeight - 200

      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (maxWidth / width) * height
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
      }
    }
    img.src = `data:${imageType};base64,${imageBase64}`
  }, [imageBase64, imageType])

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !originalImage) return

    // Clear and draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height)

    // Replay history up to current index
    for (let i = 0; i <= historyIndex; i++) {
      const action = history[i]
      if (!action) continue

      ctx.beginPath()
      ctx.strokeStyle = action.type === 'erase' ? '#FFFFFF' : action.color
      ctx.lineWidth = action.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (action.type === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      action.paths.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    }

    ctx.globalCompositeOperation = 'source-over'

    // Draw crop overlay if cropping
    if (tool === 'crop' && cropStart && cropEnd) {
      const x = Math.min(cropStart.x, cropEnd.x)
      const y = Math.min(cropStart.y, cropEnd.y)
      const w = Math.abs(cropEnd.x - cropStart.x)
      const h = Math.abs(cropEnd.y - cropStart.y)

      // Salvar o conteúdo da área de recorte antes de desenhar o overlay
      const imageData = ctx.getImageData(x, y, Math.max(1, w), Math.max(1, h))

      // Desenhar overlay escuro
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Restaurar a área de recorte (mostrar imagem original nessa área)
      ctx.putImageData(imageData, x, y)

      // Desenhar borda da seleção
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, w, h)
      ctx.setLineDash([])
    }
  }, [history, historyIndex, originalImage, tool, cropStart, cropEnd])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Get canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  // Drawing handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const coords = getCanvasCoords(e)

    if (tool === 'crop') {
      setIsCropping(true)
      setCropStart(coords)
      setCropEnd(coords)
    } else {
      setIsDrawing(true)
      setCurrentPath([coords])
    }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e)

    if (tool === 'crop' && isCropping) {
      setCropEnd(coords)
    } else if (isDrawing) {
      setCurrentPath(prev => [...prev, coords])

      // Draw live
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      ctx.beginPath()
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      }

      const prev = currentPath[currentPath.length - 1]
      if (prev) {
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(coords.x, coords.y)
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'source-over'
    }
  }

  const handleEnd = () => {
    if (tool === 'crop' && isCropping) {
      setIsCropping(false)
      // Don't apply crop yet, wait for user to confirm
    } else if (isDrawing && currentPath.length > 0) {
      // Add to history
      const newAction: DrawAction = {
        type: tool === 'eraser' ? 'erase' : 'draw',
        paths: currentPath,
        color,
        lineWidth
      }

      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newAction)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      setCurrentPath([])
    }

    setIsDrawing(false)
  }

  // Apply crop
  const applyCrop = () => {
    if (!cropStart || !cropEnd) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !originalImage) return

    const x = Math.min(cropStart.x, cropEnd.x)
    const y = Math.min(cropStart.y, cropEnd.y)
    const w = Math.abs(cropEnd.x - cropStart.x)
    const h = Math.abs(cropEnd.y - cropStart.y)

    if (w < 10 || h < 10) {
      setCropStart(null)
      setCropEnd(null)
      return
    }

    // Primeiro, redesenhar o canvas sem o overlay para ter a imagem limpa
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height)

    // Replay history (desenhos) up to current index
    for (let i = 0; i <= historyIndex; i++) {
      const action = history[i]
      if (!action) continue

      ctx.beginPath()
      ctx.strokeStyle = action.type === 'erase' ? '#FFFFFF' : action.color
      ctx.lineWidth = action.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (action.type === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }

      action.paths.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'

    // Agora copiar a área recortada para um canvas temporário
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = w
    tempCanvas.height = h
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h)

    // Update original image with cropped version
    const croppedImg = new Image()
    croppedImg.onload = () => {
      setOriginalImage(croppedImg)
      canvas.width = w
      canvas.height = h
      ctx.drawImage(croppedImg, 0, 0)

      // Clear history after crop
      setHistory([])
      setHistoryIndex(-1)
      setCropStart(null)
      setCropEnd(null)
      setTool('draw')
    }
    croppedImg.src = tempCanvas.toDataURL(imageType)
  }

  // Undo/Redo
  const undo = () => {
    if (historyIndex >= 0) {
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Save
  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL(imageType)
    const base64 = dataUrl.split(',')[1]
    onSave(base64)
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Editar Imagem</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-200 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setTool('draw')}
              className={`p-2 rounded-md transition-colors ${
                tool === 'draw' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Desenhar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-md transition-colors ${
                tool === 'eraser' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Borracha"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTool('crop')}
              className={`p-2 rounded-md transition-colors ${
                tool === 'crop' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Recortar"
            >
              <Crop className="w-4 h-4" />
            </button>
          </div>

          {/* Color picker (only for draw) */}
          {tool === 'draw' && (
            <div className="flex items-center gap-1 ml-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'border-emerald-500 scale-110' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          {/* Line width (for draw and eraser) */}
          {(tool === 'draw' || tool === 'eraser') && (
            <div className="flex items-center gap-1 ml-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setLineWidth(Math.max(2, lineWidth - 2))}
                className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs text-slate-600 w-6 text-center">{lineWidth}</span>
              <button
                onClick={() => setLineWidth(Math.min(20, lineWidth + 2))}
                className="p-1 text-slate-600 hover:bg-slate-200 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Crop confirm button */}
          {tool === 'crop' && cropStart && cropEnd && (
            <button
              onClick={applyCrop}
              className="ml-2 flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
            >
              <Check className="w-4 h-4" />
              Aplicar recorte
            </button>
          )}

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={undo}
              disabled={historyIndex < 0}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40"
              title="Desfazer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40"
              title="Refazer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-100 min-h-[300px]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="shadow-lg rounded-lg cursor-crosshair touch-none max-w-full"
            style={{ backgroundColor: 'white' }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageEditor

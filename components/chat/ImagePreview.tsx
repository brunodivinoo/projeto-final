'use client'

import { useState, memo} from 'react'
import { Pencil, X } from 'lucide-react'
import { ImageEditor } from './ImageEditor'

interface ImagePreviewProps {
  imageBase64: string
  imageType: string
  onRemove: () => void
  onUpdate: (newBase64: string) => void
}

function ImagePreviewRaw({ imageBase64, imageType, onRemove, onUpdate }: ImagePreviewProps) {
  const [showEditor, setShowEditor] = useState(false)

  const handleSaveEdit = (editedBase64: string) => {
    onUpdate(editedBase64)
    setShowEditor(false)
  }

  return (
    <>
      <div className="relative inline-block group">
        {/* Thumbnail */}
        <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${imageType};base64,${imageBase64}`}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay com ícones */}
        <div className="absolute -top-2 -right-2 flex gap-1">
          {/* Botão editar */}
          <button
            onClick={() => setShowEditor(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 shadow-lg transition-colors"
            title="Editar imagem"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Botão remover */}
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-red-600 shadow-lg transition-colors"
            title="Remover imagem"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor modal */}
      {showEditor && (
        <ImageEditor
          imageBase64={imageBase64}
          imageType={imageType}
          onSave={handleSaveEdit}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </>
  )
}

export const ImagePreview = memo(ImagePreviewRaw)

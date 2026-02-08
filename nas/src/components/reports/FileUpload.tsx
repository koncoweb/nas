"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { IconUpload, IconX, IconFile } from "@tabler/icons-react"

interface FileUploadProps {
  label: string
  accept?: string
  maxSize?: number // in MB
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  currentFile?: File | null
  disabled?: boolean
}

export function FileUpload({
  label,
  accept = "image/*,.pdf",
  maxSize = 5,
  onFileSelect,
  onFileRemove,
  currentFile,
  disabled = false,
}: FileUploadProps) {
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    onFileSelect(file)
  }

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setError("")
    onFileRemove?.()
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {!currentFile ? (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            id="file-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-full"
          >
            <IconUpload className="w-4 h-4 mr-2" />
            Choose File
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
          <IconFile className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(currentFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            <IconX className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <p className="text-xs text-muted-foreground">
        Accepted formats: {accept}. Max size: {maxSize}MB
      </p>
    </div>
  )
}

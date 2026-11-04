"use client";

import { useEffect, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";

export const MAX_TICKET_PHOTOS = 5;
export const MAX_TICKET_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface PhotoAttachmentsProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function PhotoAttachments({ files, onChange, disabled = false }: PhotoAttachmentsProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (selected: FileList | null) => {
    if (!selected) return;
    const next = [...files];
    for (const file of Array.from(selected)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        window.alert(`${file.name} : format non accepté. Choisissez un fichier JPEG, PNG ou WEBP.`);
        continue;
      }
      if (file.size > MAX_TICKET_PHOTO_SIZE) {
        window.alert(`${file.name} dépasse la limite de 5 Mo.`);
        continue;
      }
      if (next.length >= MAX_TICKET_PHOTOS) {
        window.alert(`Vous pouvez joindre au maximum ${MAX_TICKET_PHOTOS} photos.`);
        break;
      }
      next.push(file);
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">Ajouter des photos (facultatif)</p>
        <span className="text-[11px] text-slate-500">{files.length}/{MAX_TICKET_PHOTOS}</span>
      </div>
      <label className={`flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 ${disabled ? "pointer-events-none opacity-50" : ""}`}>
        <ImagePlus className="h-4 w-4 text-emerald-600" />
        <span>Choisir des images ou prendre une photo</span>
        <Camera className="h-4 w-4 text-slate-400" />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          capture="environment"
          multiple
          disabled={disabled || files.length >= MAX_TICKET_PHOTOS}
          onChange={(event) => {
            addFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          className="sr-only"
        />
      </label>
      <p className="text-[11px] text-slate-500">JPEG, JPG, PNG ou WEBP · 5 Mo maximum par photo · 5 photos maximum</p>
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {previews[index] && (
                // Blob URLs are created locally only for previews; uploads are sent to the server.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[index]} alt={`Aperçu de ${file.name}`} className="h-24 w-full object-cover" />
              )}
              <div className="flex items-center justify-between gap-1 p-1.5">
                <span className="truncate text-[10px] text-slate-600" title={file.name}>{file.name}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Supprimer ${file.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

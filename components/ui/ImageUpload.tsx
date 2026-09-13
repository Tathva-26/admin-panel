"use client";

import { useRef, useState, type DragEvent } from "react";
import Button from "./Button";
import { cn } from "@/lib/cn";

export interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null, dataUrl: string | null) => void;
  onError?: (error: string | undefined) => void;
  className?: string;
  maxSizeMb?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export default function ImageUpload({
  value,
  onChange,
  onError,
  className,
  maxSizeMb = 2,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.("Please upload a valid image (JPG, PNG, WebP).");
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      onError?.(`Image must be smaller than ${maxSizeMb}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 800;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.8);
          onError?.(undefined);
          onChange(file, compressed);
        } else {
          onError?.(undefined);
          onChange(file, dataUrl);
        }
      };
      img.onerror = () => {
        onError?.(undefined);
        onChange(file, dataUrl);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      onError?.("The image could not be read.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const clear = () => {
    onChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (value) {
    return (
      <div
        className={cn(
          "relative group overflow-hidden rounded-md border border-border bg-muted/20",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Preview"
          className="h-32 w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              inputRef.current?.click();
            }}
          >
            Replace
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/20 hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              clear();
            }}
          >
            Remove
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <svg
        className="mb-2 h-6 w-6 text-muted-foreground"
        fill="none"
        strokeWidth="1.5"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      <div className="text-sm font-medium text-foreground">
        Click or drag to upload
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        JPG, PNG, WebP up to {maxSizeMb}MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

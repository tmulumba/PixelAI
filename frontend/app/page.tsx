"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Sun,
  Contrast,
  Droplets,
  Sparkles,
  Volume2,
  ImageIcon,
  Loader2,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface EditSettings {
  contrast: number;
  brightness: number;
  saturation: number;
  sharpness: number;
  denoise: number;
}

const defaultSettings: EditSettings = {
  contrast: 1.0,
  brightness: 1.0,
  saturation: 1.0,
  sharpness: 0,
  denoise: 0,
};

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<EditSettings>(defaultSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
      setSettings(defaultSettings);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processImage = useCallback(async () => {
    if (!imageFile) return;

    setIsProcessing(true);

    const operations = [];

    if (settings.contrast !== 1.0) {
      operations.push({
        function: "adjust_contrast",
        params: { factor: settings.contrast },
      });
    }
    if (settings.brightness !== 1.0) {
      operations.push({
        function: "adjust_brightness",
        params: { factor: settings.brightness },
      });
    }
    if (settings.saturation !== 1.0) {
      operations.push({
        function: "adjust_saturation",
        params: { factor: settings.saturation },
      });
    }
    if (settings.sharpness > 0) {
      operations.push({
        function: "sharpen",
        params: { factor: settings.sharpness },
      });
    }
    if (settings.denoise > 0) {
      operations.push({
        function: "denoise",
        params: { strength: Math.round(settings.denoise) },
      });
    }

    if (operations.length === 0) {
      setProcessedImage(originalImage);
      setIsProcessing(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("operations", JSON.stringify(operations));

    try {
      const response = await fetch(`${API_URL}/images/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      const data = await response.json();
      setProcessedImage(data.image);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Make sure the backend is running.");
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, settings, originalImage]);

  // Debounced processing when settings change
  useEffect(() => {
    if (!imageFile) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      processImage();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [settings, imageFile, processImage]);

  const handleDownload = useCallback(() => {
    const imageToDownload = processedImage || originalImage;
    if (!imageToDownload) return;

    const link = document.createElement("a");
    link.href = imageToDownload;
    link.download = "pixelai_edited.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage, originalImage]);

  const handleReset = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const handleClear = useCallback(() => {
    setOriginalImage(null);
    setProcessedImage(null);
    setImageFile(null);
    setSettings(defaultSettings);
  }, []);

  const updateSetting = (key: keyof EditSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const sliderControls = [
    {
      key: "contrast" as const,
      label: "Contrast",
      icon: Contrast,
      min: 0.5,
      max: 2.0,
      step: 0.05,
      default: 1.0,
    },
    {
      key: "brightness" as const,
      label: "Brightness",
      icon: Sun,
      min: 0.5,
      max: 2.0,
      step: 0.05,
      default: 1.0,
    },
    {
      key: "saturation" as const,
      label: "Saturation",
      icon: Droplets,
      min: 0,
      max: 2.0,
      step: 0.05,
      default: 1.0,
    },
    {
      key: "sharpness" as const,
      label: "Sharpen",
      icon: Sparkles,
      min: 0,
      max: 2.0,
      step: 0.1,
      default: 0,
    },
    {
      key: "denoise" as const,
      label: "Denoise",
      icon: Volume2,
      min: 0,
      max: 20,
      step: 1,
      default: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">PixelAI</h1>
                <p className="text-xs text-muted-foreground">
                  AI Image Editor
                </p>
              </div>
            </div>

            {originalImage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!originalImage ? (
          /* Upload Zone */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed
              transition-all duration-300 ease-out
              ${
                isDragging
                  ? "border-primary bg-primary/5 drop-zone-active scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }
            `}
          >
            <div className="flex flex-col items-center justify-center py-32 px-8">
              <div
                className={`
                w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 
                flex items-center justify-center mb-6 transition-transform duration-300
                ${isDragging ? "scale-110" : ""}
              `}
              >
                <Upload
                  className={`w-10 h-10 text-primary transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}
                />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Drop your image here
              </h2>
              <p className="text-muted-foreground mb-6">
                or click to browse from your computer
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 rounded bg-muted">JPG</span>
                <span className="px-2 py-1 rounded bg-muted">PNG</span>
                <span className="px-2 py-1 rounded bg-muted">WebP</span>
                <span className="px-2 py-1 rounded bg-muted">GIF</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>
        ) : (
          /* Editor Layout */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Image Preview */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-card border border-border">
                {/* Close button */}
                <button
                  onClick={handleClear}
                  className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm font-medium">Processing...</span>
                    </div>
                  </div>
                )}

                {/* Image */}
                <div
                  className="relative aspect-video flex items-center justify-center bg-muted/30"
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onMouseLeave={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={showOriginal ? originalImage : (processedImage || originalImage)}
                    alt="Preview"
                    className="max-h-[60vh] w-auto object-contain"
                  />
                </div>

                {/* Hold to compare hint */}
                {processedImage && processedImage !== originalImage && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs">
                    Hold to see original
                  </div>
                )}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-card border border-border p-6">
                <h3 className="text-lg font-semibold mb-6">Adjustments</h3>

                <div className="space-y-6">
                  {sliderControls.map((control) => (
                    <div key={control.key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <control.icon className="w-4 h-4 text-muted-foreground" />
                          <label className="text-sm font-medium">
                            {control.label}
                          </label>
                        </div>
                        <span className="text-sm text-muted-foreground font-mono w-12 text-right">
                          {settings[control.key].toFixed(
                            control.step < 1 ? 2 : 0
                          )}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={settings[control.key]}
                        onChange={(e) =>
                          updateSetting(control.key, parseFloat(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl border border-border hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All
                  </button>
                </div>
              </div>

              {/* Download Card */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 p-6">
                <h3 className="text-lg font-semibold mb-2">Ready to export?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your edited image in PNG format.
                </p>
                <button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            PixelAI — Powered by OpenCV
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useRef } from "react";
import { Plus, Trash2, Video, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PhotoVideoUploadProps {
  images: string[];
  video?: string;
  onImagesChange: (images: string[]) => void;
  onVideoChange: (video: string) => void;
  minPhotos?: number;
  maxPhotos?: number;
}

export function PhotoVideoUpload({
  images,
  video,
  onImagesChange,
  onVideoChange,
  minPhotos = 4,
  maxPhotos = 6,
}: PhotoVideoUploadProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            onImagesChange([...images, ...newImages].slice(0, maxPhotos));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("Video file is too large. Maximum size is 50MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onVideoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    onVideoChange("");
  };

  const canAddMorePhotos = images.length < maxPhotos;
  const hasMinPhotos = images.length >= minPhotos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            Photos ({images.length}/{maxPhotos})
          </h3>
          <p className="text-xs text-gray-500">
            Add at least {minPhotos} photos
            {!hasMinPhotos && (
              <span className="text-red-500 ml-1">
                ({minPhotos - images.length} more required)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-3 gap-3">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="relative aspect-square rounded-2xl overflow-hidden group"
          >
            <img
              src={image}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => removeImage(index)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-pink-500 text-white text-xs rounded-full">
                Primary
              </div>
            )}
          </motion.div>
        ))}

        {/* Add Photo Button */}
        {canAddMorePhotos && (
          <button
            onClick={() => imageInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-pink-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-pink-500"
          >
            <Plus className="w-8 h-8" />
            <span className="text-xs">Add Photo</span>
          </button>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Video Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Video (Optional)</h3>
            <p className="text-xs text-gray-500">
              Add a short video to stand out (Max 50MB)
            </p>
          </div>
        </div>

        {video ? (
          <div className="relative aspect-video rounded-2xl overflow-hidden group">
            <video
              src={video}
              controls
              className="w-full h-full object-cover"
            />
            <button
              onClick={removeVideo}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => videoInputRef.current?.click()}
            className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-300 hover:border-pink-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-pink-500"
          >
            <Video className="w-12 h-12" />
            <span className="text-sm">Add Video</span>
          </button>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Plus, Video, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PhotoVideoUploadProps {
  images: string[];
  video?: string;
  onImagesChange: (images: string[]) => void;
  onVideoChange: (video: string) => void;
  onImageFilesAdded?: (files: File[]) => void;
  onVideoFileChange?: (file: File | null) => void;
  onRemoveImage?: (index: number) => void;
  minPhotos?: number;
  maxPhotos?: number;
}

export function PhotoVideoUpload({
  images,
  video,
  onImagesChange,
  onVideoChange,
  onImageFilesAdded,
  onVideoFileChange,
  onRemoveImage,
  minPhotos = 4,
  maxPhotos = 5,
}: PhotoVideoUploadProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (images.length + files.length > maxPhotos) {
        setError(`You can upload a maximum of ${maxPhotos} photos.`);
        e.target.value = "";
        return;
      }
      setError("");
      onImageFilesAdded?.(Array.from(files));
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            onImagesChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = "";
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Keep this aligned with the server-side multipart limit so a selected
      // video cannot appear saved locally and then fail during upload.
      if (file.size > 20 * 1024 * 1024) {
        alert("Video file is too large. Maximum size is 20MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onVideoFileChange?.(file);
        onVideoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    if (onRemoveImage) onRemoveImage(index);
    else onImagesChange(images.filter((_, i) => i !== index));
    setError("");
  };

  const removeVideo = () => {
    onVideoFileChange?.(null);
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
      {error && <p className="text-sm text-red-500">{error}</p>}

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
            <button type="button" onClick={() => setPreviewImage(image)} className="h-full w-full">
              <img
                src={image}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
            <div className="absolute right-2 top-2 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-2 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="w-4 h-4" />
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
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-pink-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-pink-500"
          >
            <Plus className="w-8 h-8" />
            <span className="text-xs">Add Photo</span>
          </button>
        )}
      </div>
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="Preview" className="max-h-full max-w-full rounded-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

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
              Add a short video to stand out (Max 20MB)
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
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 p-2 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remove video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
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

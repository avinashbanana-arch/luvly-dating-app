import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoLightboxProps {
  images: string[];
  name: string;
  initialIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function PhotoLightbox({ images, name, initialIndex, onClose, onIndexChange }: PhotoLightboxProps) {
  const imageCount = images.length;
  const activeIndex = Math.min(Math.max(initialIndex, 0), Math.max(0, imageCount - 1));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && imageCount > 1) onIndexChange((activeIndex - 1 + imageCount) % imageCount);
      if (event.key === "ArrowRight" && imageCount > 1) onIndexChange((activeIndex + 1) % imageCount);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, imageCount, onClose, onIndexChange]);

  if (!imageCount) return null;

  const showPrevious = () => onIndexChange((activeIndex - 1 + imageCount) % imageCount);
  const showNext = () => onIndexChange((activeIndex + 1) % imageCount);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" aria-label={`${name}'s photos`}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Close photos">
        <X className="h-6 w-6" />
      </button>
      <img src={images[activeIndex]} alt={`${name} photo ${activeIndex + 1}`} className="max-h-full max-w-full object-contain" />
      {imageCount > 1 && (
        <>
          <button type="button" onClick={showPrevious} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white" aria-label="Previous photo">
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button type="button" onClick={showNext} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white" aria-label="Next photo">
            <ChevronRight className="h-7 w-7" />
          </button>
          <div className="absolute bottom-5 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 gap-2 overflow-x-auto rounded-full bg-black/50 p-2">
            {images.map((image, index) => (
              <button type="button" key={`${image}-${index}`} onClick={() => onIndexChange(index)} className={`h-12 w-12 flex-none overflow-hidden rounded-full border-2 ${index === activeIndex ? "border-white" : "border-transparent opacity-65"}`} aria-label={`Show photo ${index + 1}`}>
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
      <p className="absolute bottom-20 rounded-full bg-black/55 px-3 py-1 text-sm text-white">{activeIndex + 1} of {imageCount}</p>
    </div>
  );
}

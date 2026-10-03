import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Maximize2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

export function ImageGallery({ images, alt = "Image gallery" }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mainRef, mainApi] = useEmblaCarousel({ loop: true });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbApi]
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    setSelectedIndex(mainApi.selectedScrollSnap());
    thumbApi.scrollTo(mainApi.selectedScrollSnap());
  }, [mainApi, thumbApi, setSelectedIndex]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
  }, [mainApi, onSelect]);

  const scrollPrev = useCallback(() => mainApi?.scrollPrev(), [mainApi]);
  const scrollNext = useCallback(() => mainApi?.scrollNext(), [mainApi]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-muted flex items-center justify-center rounded-xl border">
        <Package className="h-16 w-16 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image Carousel */}
      <div className="relative group overflow-hidden rounded-xl border bg-muted aspect-[4/3]">
        <div ref={mainRef} className="h-full">
          <div className="flex h-full touch-pan-y">
            {images.map((src, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] min-w-0 relative h-full cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              >
                <img
                  src={src}
                  alt={`${alt} - Image ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={scrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="overflow-hidden" ref={thumbRef}>
          <div className="flex gap-2">
            {images.map((src, index) => (
              <div
                key={index}
                className={`flex-[0_0_20%] min-w-0 aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                  index === selectedIndex ? "border-brand opacity-100" : "border-transparent opacity-50 hover:opacity-100"
                }`}
                onClick={() => onThumbClick(index)}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 border-none bg-black/95 backdrop-blur-md overflow-hidden flex flex-col justify-center gap-0">
          <DialogTitle className="sr-only">Image view</DialogTitle>
          <DialogDescription className="sr-only">Full screen image view</DialogDescription>
          
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
            <img
              src={images[selectedIndex]}
              alt={`${alt} - Full screen`}
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 border-none text-white backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 border-none text-white backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); scrollNext(); }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

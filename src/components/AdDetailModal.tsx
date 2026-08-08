import { useState, useEffect } from "react";
import { X, Edit2, Trash2, MapPin, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdEditModal } from "./AdEditModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { formatDistanceToNow } from "date-fns";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  images: string[];
  userId: number;
  user?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AdDetailModalProps {
  listing: Listing;
  onClose: () => void;
  categoryName: string;
}

export function AdDetailModal({ listing: initialListing, onClose, categoryName }: AdDetailModalProps) {
  const [listing, setListing] = useState(initialListing);
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(false);

  const [permissions, setPermissions] = useState({ canEdit: false, canDelete: false });

  useEffect(() => {
    const checkPermissions = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = Number(payload.sub);
        const role = payload.role;

        const isOwner = userId === listing.userId;
        const isAdmin = role === "admin" || role === "ADMIN";

        setPermissions({
          canEdit: isOwner,
          canDelete: isOwner || isAdmin,
        });
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    };
    checkPermissions();
  }, [listing.userId]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullScreenImage) {
          setFullScreenImage(false);
        } else if (!isEditOpen && !isDeleteOpen) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isEditOpen, isDeleteOpen, fullScreenImage]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleEditSuccess = (updatedAd: any) => {
    setListing(updatedAd);
    setIsEditOpen(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-0 md:p-6 lg:p-12 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-card text-card-foreground md:rounded-3xl border w-full max-w-5xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden min-h-screen md:min-h-0 flex flex-col">
          
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button variant="secondary" size="icon" onClick={onClose} className="rounded-full shadow-md bg-white/80 hover:bg-white text-black backdrop-blur-sm">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 flex-1 h-full">
            
            {/* Gallery Section */}
            <div className="bg-secondary/30 border-r flex flex-col p-4 md:p-6 gap-4 h-full min-h-[400px]">
              <div 
                className="flex-1 bg-accent rounded-2xl overflow-hidden relative group cursor-zoom-in"
                onClick={() => setFullScreenImage(true)}
              >
                {listing.images && listing.images.length > 0 ? (
                  <img 
                    src={listing.images[primaryImageIdx]} 
                    alt={listing.title} 
                    className="absolute inset-0 w-full h-full object-contain" 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Package className="h-16 w-16 opacity-30" />
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {listing.images && listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-1 snap-x">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrimaryImageIdx(idx)}
                      className={`relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border-2 snap-center transition ${
                        primaryImageIdx === idx ? "border-brand shadow-md" : "border-transparent hover:opacity-80"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col p-6 md:p-8 md:max-h-[80vh] overflow-y-auto">
              <div className="flex-1">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-accent text-accent-foreground mb-3">
                  {categoryName}
                </div>
                
                <h1 className="text-3xl font-semibold leading-tight tracking-tight mb-2">
                  {listing.title}
                </h1>
                
                <div className="text-4xl font-bold text-brand my-6">
                  Rs {Number(listing.price).toLocaleString()}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {listing.user ? `${listing.user.firstName} ${listing.user.lastName}` : `Seller #${listing.userId}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5 shrink-0" />
                    <span className="text-sm">
                      Posted {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                      {listing.updatedAt !== listing.createdAt && (
                        <span className="ml-1 opacity-75">(Updated {formatDistanceToNow(new Date(listing.updatedAt), { addSuffix: true })})</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {(permissions.canEdit || permissions.canDelete) && (
                <div className="mt-10 pt-6 border-t flex flex-wrap gap-3">
                  {permissions.canEdit && (
                    <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(true)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit Listing
                    </Button>
                  )}
                  {permissions.canDelete && (
                    <Button variant="destructive" className="flex-1" onClick={() => setIsDeleteOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Listing
                    </Button>
                  )}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Fullscreen Image Overlay */}
      {fullScreenImage && listing.images && listing.images.length > 0 && (
        <div 
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setFullScreenImage(false)}
        >
          <img 
            src={listing.images[primaryImageIdx]} 
            alt={listing.title} 
            className="max-w-full max-h-full object-contain" 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
            onClick={(e) => { e.stopPropagation(); setFullScreenImage(false); }}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Modals */}
      {isEditOpen && (
        <AdEditModal 
          listing={listing} 
          onClose={() => setIsEditOpen(false)} 
          onSuccess={handleEditSuccess} 
        />
      )}
      
      {isDeleteOpen && (
        <DeleteConfirmModal 
          listingId={listing.id} 
          listingTitle={listing.title} 
          onClose={() => setIsDeleteOpen(false)} 
          onSuccess={() => {
            setIsDeleteOpen(false);
            onClose(); // close detail modal too
          }} 
        />
      )}
    </>
  );
}

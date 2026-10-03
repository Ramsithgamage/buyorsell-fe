import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { X, MapPin, Tag } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/image-gallery";
import { AdEditModal } from "@/components/ad-edit-modal";

interface AdDetailsModalProps {
  id: number | null;
  onClose: () => void;
}

export function AdDetailsModal({ id, onClose }: AdDetailsModalProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const { data: ad, isLoading, isError } = useQuery({
    queryKey: ["advertisement", id],
    queryFn: async () => {
      const data = await api(`/advertisements/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api(`/advertisements/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Advertisement deleted");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete advertisement");
    },
  });

  if (!id) return null;

  const isOwner = profile && ad && profile.id === ad.userId;
  const isAdmin = profile && profile.role === "admin";
  const showEdit = isOwner;
  const showDelete = isOwner || isAdmin;

  return (
    <>
      <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-sm border shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-xl">
          <DialogTitle className="sr-only">Advertisement Details</DialogTitle>
          <DialogDescription className="sr-only">View complete details of this advertisement</DialogDescription>
          
          {/* Header */}
          <div className="flex items-center justify-end p-4 border-b bg-background">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8">
              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-8">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-32 w-full mt-8" />
                    <Skeleton className="h-12 w-1/3" />
                  </div>
                </div>
              ) : isError || !ad ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-destructive mb-2">Failed to load advertisement details.</p>
                  <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column - Image Gallery */}
                  <div className="space-y-4">
                    <ImageGallery images={ad.images || []} alt={ad.title} />
                  </div>

                  {/* Right Column - Details */}
                  <div className="flex flex-col h-full">
                    <div className="mb-6">
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{ad.title}</h1>
                      <div className="flex items-center gap-4 text-muted-foreground mt-4 mb-2">
                        {ad.categoryId && (
                          <div className="flex items-center text-sm">
                            <Tag className="mr-1.5 h-4 w-4" />
                            <span>Category: {ad.categoryId}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-1.5 h-4 w-4" />
                          <span>Listed on: {new Date(ad.createdAt || ad.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="mt-6 mb-8">
                        <span className="text-4xl font-bold text-brand">
                          LKR {Number(ad.price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none mb-8 whitespace-pre-wrap">
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{ad.description || "No description provided."}</p>
                    </div>

                    <div className="mt-auto space-y-6">
                      {/* Owner Info placeholder */}
                      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {ad.user ? `${ad.user.firstName.charAt(0)}${ad.user.lastName.charAt(0)}`.toUpperCase() : ad.userId}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{ad.user ? `${ad.user.firstName} ${ad.user.lastName}` : `User ID: ${ad.userId}`}</p>
                          <p className="text-xs text-muted-foreground">Seller on Verdant</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {(showEdit || showDelete) && (
                        <div className="flex gap-3 pt-4 border-t">
                          {showEdit && (
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setIsEditOpen(true)}
                            >
                              Edit details
                            </Button>
                          )}
                          {showDelete && (
                            <Button
                              variant="destructive"
                              className={showEdit ? "flex-1" : "w-full"}
                              onClick={() => setIsDeleteDialogOpen(true)}
                            >
                              Delete advertisement
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Dialogs */}
      {ad && (
        <AdEditModal
          ad={ad}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["advertisement", id] });
          }}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your advertisement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

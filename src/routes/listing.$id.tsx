import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { MapPin, Tag } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageGallery } from "@/components/image-gallery";
import { AdEditModal } from "@/components/ad-edit-modal";
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

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Listing Details — Verdant" },
      { name: "description", content: "View full details for this advertisement." },
    ],
  }),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: ad, isLoading, isError } = useQuery({
    queryKey: ["advertisement", Number(id)],
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
      navigate({ to: "/browse" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete advertisement");
    },
  });

  const isOwner = profile && ad && profile.id === ad.userId;
  const isAdmin = profile && profile.role === "admin";
  const showEdit = isOwner;
  const showDelete = isOwner || isAdmin;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">
        {isLoading ? (
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full mt-8" />
              <Skeleton className="h-12 w-1/3" />
            </div>
          </div>
        ) : isError || !ad ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed rounded-xl">
            <p className="text-xl font-medium text-destructive mb-3">Listing not found</p>
            <p className="text-muted-foreground mb-6">This advertisement may have been deleted or is unavailable.</p>
            <Button onClick={() => navigate({ to: "/browse" })}>Back to Browse</Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16">
            {/* Left Column - Image Gallery */}
            <div>
              <ImageGallery images={ad.images || []} alt={ad.title} />
            </div>

            {/* Right Column - Details */}
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">{ad.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                  {ad.categoryId && (
                    <div className="flex items-center text-sm font-medium">
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
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{ad.description || "No description provided."}</p>
              </div>

              <div className="mt-auto space-y-6 pt-6">
                <div className="flex items-center gap-4 p-5 rounded-xl border bg-card/50 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-medium text-lg">
                    {ad.user ? `${ad.user.firstName.charAt(0)}${ad.user.lastName.charAt(0)}`.toUpperCase() : ad.userId}
                  </div>
                  <div>
                    <p className="font-semibold">{ad.user ? `${ad.user.firstName} ${ad.user.lastName}` : `User ID: ${ad.userId}`}</p>
                    <p className="text-sm text-muted-foreground">Seller on Verdant</p>
                  </div>
                </div>

                {(showEdit || showDelete) && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    {showEdit && (
                      <Button
                        variant="outline"
                        className="flex-1 h-12 text-base"
                        onClick={() => setIsEditOpen(true)}
                      >
                        Edit Details
                      </Button>
                    )}
                    {showDelete && (
                      <Button
                        variant="destructive"
                        className={`h-12 text-base ${showEdit ? "flex-1" : "w-full"}`}
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        Delete Listing
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Nested Modals */}
      {ad && (
        <AdEditModal
          ad={ad}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["advertisement", Number(id)] });
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
    </div>
  );
}

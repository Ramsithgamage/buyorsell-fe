import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface DeleteConfirmModalProps {
  listingId: number;
  listingTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteConfirmModal({ listingId, listingTitle, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await apiFetch(`/advertisements/${listingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete listing.");
      }

      toast.success("Listing deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while deleting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-card text-card-foreground border shadow-xl rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Delete Listing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{listingTitle}</span>? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

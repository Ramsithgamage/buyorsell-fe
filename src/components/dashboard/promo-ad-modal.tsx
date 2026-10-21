import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface PromoAd {
  id: number;
  image: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PromoAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promoToEdit?: PromoAd | null;
  onSuccess?: () => void;
}

function toLocalDatetimeString(isoString?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  } catch {
    return "";
  }
}

export function PromoAdModal({ open, onOpenChange, promoToEdit, onSuccess }: PromoAdModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = Boolean(promoToEdit);

  useEffect(() => {
    if (open) {
      if (promoToEdit) {
        setLinkUrl(promoToEdit.linkUrl || "");
        setStartDate(toLocalDatetimeString(promoToEdit.startDate));
        setEndDate(toLocalDatetimeString(promoToEdit.endDate));
        setIsActive(promoToEdit.isActive ?? true);
        setPreviewUrl(promoToEdit.image || "");
        setSelectedFile(null);
      } else {
        // Defaults for creation: starts now, ends in 7 days
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setLinkUrl("");
        setStartDate(toLocalDatetimeString(now.toISOString()));
        setEndDate(toLocalDatetimeString(nextWeek.toISOString()));
        setIsActive(true);
        setPreviewUrl("");
        setSelectedFile(null);
      }
      setErrorMessage(null);
    }
  }, [open, promoToEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please select a valid image file (PNG, JPG, WebP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("Image file size must be less than 10MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!isEditing && !selectedFile) {
      setErrorMessage("Please upload a banner image for this advertisement.");
      return;
    }

    if (!linkUrl.trim()) {
      setErrorMessage("Please enter a destination URL.");
      return;
    }

    try {
      new URL(linkUrl);
    } catch {
      setErrorMessage("Please enter a valid URL (including https://).");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage("Both start and end dates are required.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setErrorMessage("Invalid date format.");
      return;
    }

    if (end <= start) {
      setErrorMessage("Sale end date must be strictly after the start date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("linkUrl", linkUrl.trim());
      formData.append("startDate", start.toISOString());
      formData.append("endDate", end.toISOString());
      formData.append("isActive", String(isActive));

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (isEditing && promoToEdit) {
        await api(`/promotional-ads/${promoToEdit.id}`, {
          method: "PATCH",
          body: formData,
        });
        toast.success("Promotional advertisement updated successfully");
      } else {
        await api("/promotional-ads", {
          method: "POST",
          body: formData,
        });
        toast.success("Promotional advertisement created successfully");
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["dashboard-admin-promos"] });
      queryClient.invalidateQueries({ queryKey: ["promotional-ads-active"] });

      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save promotional advertisement.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Promotional Advertisement" : "Create Promotional Advertisement"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the banner, link, or campaign duration for this promotional advertisement."
              : "Set up a new promotional banner with active date duration and destination link."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Banner Image Upload */}
          <div className="space-y-2">
            <Label>Banner Image {!isEditing && <span className="text-destructive">*</span>}</Label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
                <img src={previewUrl} alt="Banner preview" className="h-full w-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2 text-xs bg-black/70 text-white hover:bg-black/90 backdrop-blur-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                  Change Image
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center aspect-[16/9] w-full rounded-lg border-2 border-dashed border-border hover:border-brand/50 hover:bg-muted/30 cursor-pointer transition-colors p-4 text-center"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand mb-2">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Click to upload banner image</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  16:9 ratio recommended (PNG, JPG, or WebP)
                </p>
              </div>
            )}
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="linkUrl">
              Destination URL <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://example.com/summer-sale"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Users will be redirected here when clicking "Get Now" on the homepage banner.
            </p>
          </div>

          {/* Campaign Schedule Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date & Time <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 text-xs sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-sm font-medium">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Only active advertisements within the date range are displayed on the homepage.
              </p>
            </div>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Advertisement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

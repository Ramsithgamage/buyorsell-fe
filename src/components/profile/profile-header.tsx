import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useRemoveAvatar,
  useUploadAvatar,
  type UserProfile,
} from "@/hooks/use-profile";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const ROLE_LABEL = { USER: "Member", VENDOR: "Vendor", ADMIN: "Admin" } as const;
const STATUS_VARIANT = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
} as const;

export function ProfileHeader({ user }: { user: UserProfile }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const busy = upload.isPending || remove.isPending;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  const onFile = (file?: File) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return toast.error("Use a JPEG, PNG or WebP image");
    if (file.size > MAX_BYTES) return toast.error("Image must be 2 MB or smaller");
    upload.mutate(file, {
      onSuccess: () => toast.success("Profile picture updated"),
      onError: (e) => toast.error(e.message || "Upload failed"),
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row">
        <Avatar className="h-24 w-24">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="Profile picture" />}
          <AvatarFallback className="bg-brand text-brand-foreground text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
            {user.role !== "USER" && (
              <Badge variant={STATUS_VARIANT[user.approvalStatus]}>{user.approvalStatus}</Badge>
            )}
            {user.createdAt && (
              <span className="text-xs text-muted-foreground self-center">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED.join(",")}
              className="hidden"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Camera className="mr-1.5 h-4 w-4" />
              {upload.isPending ? "Uploading…" : "Change photo"}
            </Button>
            {user.avatarUrl && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  remove.mutate(undefined, {
                    onSuccess: () => toast.success("Profile picture removed"),
                    onError: (e) => toast.error(e.message || "Could not remove picture"),
                  })
                }
              >
                <Trash2 className="mr-1.5 h-4 w-4" />Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 2 MB.</p>
        </div>
      </CardContent>
    </Card>
  );
}

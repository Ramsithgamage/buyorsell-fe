import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, MessageSquare, Package } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderFormModalProps {
  adId: number;
  adTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreateOrderPayload {
  adId: number;
  quantity: number;
  address: string;
  message?: string;
}

export function OrderFormModal({
  adId,
  adTitle,
  isOpen,
  onOpenChange,
  onSuccess,
}: OrderFormModalProps) {
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setQuantity(1);
    setAddress("");
    setMessage("");
    setErrorMessage(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const orderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      api("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Order placed successfully!");
      queryClient.invalidateQueries({ queryKey: ["orders-placed"] });
      handleOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || "Failed to place order. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation mirroring backend constraints
    if (quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
      setErrorMessage("Quantity must be a whole number between 1 and 99.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Shipping address is required.");
      return;
    }

    orderMutation.mutate({
      adId,
      quantity,
      address: address.trim(),
      message: message.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand" />
            Place an Order
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            You are ordering: <span className="font-medium text-foreground">{adTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form id="order-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="order-quantity">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="order-quantity"
                type="number"
                min={1}
                max={99}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="pl-9 w-32"
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Min 1 — Max 99</p>
          </div>

          {/* Shipping Address */}
          <div className="space-y-2">
            <Label htmlFor="order-address">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Shipping Address <span className="text-destructive">*</span>
              </span>
            </Label>
            <Textarea
              id="order-address"
              placeholder="Enter your full shipping address…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="min-h-[80px] resize-none"
              required
            />
          </div>

          {/* Message to Seller */}
          <div className="space-y-2">
            <Label htmlFor="order-message">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Message to Seller{" "}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </span>
            </Label>
            <Textarea
              id="order-message"
              placeholder="Any special instructions for the seller…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[72px] resize-none"
            />
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={orderMutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="order-form"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={orderMutation.isPending}
          >
            {orderMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {orderMutation.isPending ? "Placing order…" : "Confirm Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

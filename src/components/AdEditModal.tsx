import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ImageIcon, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  images: string[];
}

interface AdEditModalProps {
  listing: Listing;
  onClose: () => void;
  onSuccess: (updatedAd: any) => void;
}

type CategoryTree = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: number | null;
  children: CategoryTree[];
};

export function AdEditModal({ listing, onClose, onSuccess }: AdEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(listing.price.toString());
  const [categoryId, setCategoryId] = useState<string>(listing.categoryId.toString());
  
  const [keptImages, setKeptImages] = useState<string[]>(listing.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: categoryTree } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const { data } = await apiClient.get<CategoryTree[]>("/categories");
      return data || [];
    },
  });

  const totalImages = keptImages.length + newFiles.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incomingFiles = Array.from(e.target.files);
      if (totalImages + incomingFiles.length > 5) {
        toast.error("You can upload a maximum of 5 images total.");
        return;
      }
      setNewFiles((prev) => [...prev, ...incomingFiles].slice(0, 5 - keptImages.length));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeKeptImage = (index: number) => {
    setKeptImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !categoryId) {
      return toast.error("Please fill in all required fields.");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("categoryId", categoryId);
      
      keptImages.forEach((img) => {
        formData.append("images", img);
      });
      
      newFiles.forEach((file) => {
        formData.append("images", file); // Appended files will be processed by Multer
      });

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/advertisements/${listing.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update listing");
      }
      
      const updatedAd = await res.json();
      toast.success("Listing updated successfully!");
      onSuccess(updatedAd);
    } catch (err: any) {
      toast.error(err.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="bg-secondary/20 w-full max-w-3xl rounded-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background border-b">
          <h2 className="text-xl font-semibold">Edit Listing</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={submit} className="space-y-6">
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-brand">1</span>
                Item details
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    required 
                    className="mt-1 min-h-[120px] resize-y" 
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-brand">2</span>
                Pricing & Category
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (Rs) <span className="text-red-500">*</span></Label>
                  <Input 
                    id="price" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <div className="mt-1">
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryTree?.map((cat) => (
                          <SelectGroup key={cat.id}>
                            <SelectLabel>{cat.name}</SelectLabel>
                            {cat.children && cat.children.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-brand">3</span>
                Photos
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Add up to 5 photos. The first photo will be the cover of your listing.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {keptImages.map((img, idx) => (
                  <div key={`kept-${idx}`} className="relative aspect-square rounded-xl border overflow-hidden group bg-accent">
                    <img src={img} alt="kept" className="h-full w-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeKeptImage(idx)} 
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] uppercase font-semibold tracking-wider text-center py-1">Cover</div>
                    )}
                  </div>
                ))}

                {newFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl border overflow-hidden group bg-accent">
                    <img src={URL.createObjectURL(file)} alt="new" className="h-full w-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeNewFile(idx)} 
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {keptImages.length === 0 && idx === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] uppercase font-semibold tracking-wider text-center py-1">Cover</div>
                    )}
                  </div>
                ))}
                
                {totalImages < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-brand hover:text-brand hover:bg-brand/5 transition"
                  >
                    <ImageIcon className="h-8 w-8 opacity-50" />
                    <span className="text-xs font-medium">Add Photo</span>
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />
            </section>

            <div className="flex items-center justify-end gap-3 pt-4 pb-8">
              <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" size="lg" className="bg-brand text-brand-foreground hover:opacity-90 min-w-[150px]" disabled={loading}>
                {loading ? "Saving..." : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

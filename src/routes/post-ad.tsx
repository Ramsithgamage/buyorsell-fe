import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, X, LeafyGreen, ImageIcon, Tag, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/post-ad")({
  head: () => ({
    meta: [
      { title: "Post a listing — Verdant" },
      { name: "description", content: "List your item for sale on Verdant." },
    ],
  }),
  component: PostAdPage,
});

type CategoryTree = {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: number | null;
  children: CategoryTree[];
};

function PostAdPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      navigate({ to: "/auth", search: { redirect: "/post-ad" } as any });
    }
  }, [navigate]);

  const { data: categoryTree } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const { data } = await apiClient.get<CategoryTree[]>("/categories");
      return data || [];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        toast.error("You can upload a maximum of 5 images.");
        return;
      }
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    // reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
      
      files.forEach((file) => {
        formData.append("images", file);
      });

      // We use raw fetch here because we need to send multipart/form-data
      // and let the browser set the boundary automatically by omitting Content-Type.
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/advertisements`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create listing");
      }

      toast.success("Listing published successfully!");
      navigate({ to: "/browse" });
    } catch (err: any) {
      toast.error(err.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <SiteHeader />

      {/* Intro Hero */}
      <div className="bg-brand text-brand-foreground py-10 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-white mb-4">
            <Tag className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold">Post a new listing</h1>
          <p className="mt-2 text-brand-foreground/80">List your item in minutes and reach thousands of buyers.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 -mt-8">
        <form onSubmit={submit} className="space-y-6">
          
          {/* Item Details */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-brand">1</span>
              Item details
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input id="title" placeholder="e.g. Vintage Leather Sofa" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the condition, dimensions, and any flaws..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  className="mt-1 min-h-[120px] resize-y" 
                />
              </div>
            </div>
          </section>

          {/* Pricing & Category */}
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
                  placeholder="0.00" 
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

          {/* Images */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-brand">3</span>
              Photos
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Add up to 5 photos. The first photo will be the cover of your listing.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl border overflow-hidden group bg-accent">
                  <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeFile(idx)} 
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] uppercase font-semibold tracking-wider text-center py-1">Cover</div>
                  )}
                </div>
              ))}
              
              {files.length < 5 && (
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

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" className="bg-brand text-brand-foreground hover:opacity-90 min-w-[200px]" disabled={loading}>
              {loading ? "Publishing..." : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Publish Listing
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { UploadCloud, X, Plus, Package } from "lucide-react";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/post-ad")({
  beforeLoad: () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Unauthorized");
    }
  },
  head: () => ({
    meta: [
      { title: "Post an Advertisement — Verdant" },
      { name: "description", content: "Create a new listing on Verdant marketplace." },
    ],
  }),
  component: PostAd,
  errorComponent: () => {
    const navigate = Route.useNavigate();
    useEffect(() => {
      navigate({ to: "/auth" });
    }, [navigate]);
    return null;
  }
});

type Cat = { id: number; name: string; slug: string; parentId: number | null; children?: Sub[] };
type Sub = { id: number; name: string; slug: string; parentId: number | null };

function PostAd() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const data = await api("/categories");
      return (data ?? []) as Cat[];
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 5) {
        toast.error("You can only upload up to 5 images");
        return;
      }
      setImages((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !categoryId) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price.toString());
      formData.append("categoryId", categoryId);
      
      images.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api("/advertisements", {
        method: "POST",
        body: formData,
      });

      if (response && response.id) {
        toast.success("Listing created successfully!");
        navigate({ to: "/listing/$id", params: { id: response.id.toString() } });
      } else {
        throw new Error("Failed to create listing");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Create a Listing</h1>
          <p className="text-muted-foreground mt-2">
            Fill out the details below to publish your item on the marketplace.
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>Provide a clear title and detailed description.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. iPhone 15 Pro Max 256GB" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    maxLength={100}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the condition, features, and reason for selling..." 
                    className="min-h-[120px]"
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    required 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Category</CardTitle>
                <CardDescription>Set your price and choose where this listing belongs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:flex sm:space-x-4 sm:space-y-0">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="price">Price (LKR) <span className="text-red-500">*</span></Label>
                  <Input 
                    id="price" 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="0.00" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((cat) => (
                        <SelectGroup key={cat.id}>
                          {cat.children && cat.children.length > 0 ? (
                            <>
                              <SelectLabel className="bg-muted/50 text-muted-foreground">{cat.name}</SelectLabel>
                              {cat.children.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id.toString()}>
                                  {sub.name}
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <SelectItem value={cat.id.toString()}>{cat.name}</SelectItem>
                          )}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Upload up to 5 images. The first image will be the cover.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 hover:border-brand transition-colors"
                    >
                      <UploadCloud className="h-6 w-6" />
                      <span className="text-xs font-medium">Add Photo</span>
                    </button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange} 
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/browse" })}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand text-brand-foreground hover:opacity-90 min-w-[120px]" disabled={loading}>
                {loading ? "Publishing..." : "Publish Listing"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

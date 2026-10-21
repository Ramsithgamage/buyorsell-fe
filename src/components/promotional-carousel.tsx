import { useQuery } from "@tanstack/react-query";
import { Sparkles, Clock, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export interface PromotionalAdItem {
  id: number;
  image: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

function formatEndDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function PromotionalCarousel() {
  const { data: promos, isLoading } = useQuery<PromotionalAdItem[]>({
    queryKey: ["promotional-ads-active"],
    queryFn: async () => {
      const data = await api("/promotional-ads/active");
      return (data ?? []) as PromotionalAdItem[];
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/9] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // If there are no active promotional advertisements, do not render an empty section
  if (!promos || promos.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
      <Carousel
        opts={{
          align: "start",
          loop: promos.length > 2,
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Promotional Offers
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Exclusive limited-time deals and sponsored campaigns
              </p>
            </div>
          </div>
          {promos.length > 1 && (
            <div className="flex items-center gap-2">
              <CarouselPrevious className="static translate-y-0 h-8 w-8 rounded-md" />
              <CarouselNext className="static translate-y-0 h-8 w-8 rounded-md" />
            </div>
          )}
        </div>

        <CarouselContent className="-ml-3 md:-ml-4">
          {promos.map((promo) => (
            <CarouselItem key={promo.id} className="pl-3 md:pl-4 sm:basis-1/2 lg:basis-1/3">
              <div className="group relative overflow-hidden rounded-lg border bg-muted/20 shadow-xs transition-all duration-300 hover:shadow-md hover:border-brand/30">
                {/* Banner Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={promo.image}
                    alt="Promotional advertisement"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                </div>

                {/* Overlay Footer Details */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 sm:p-4 text-white">
                  <Badge
                    variant="outline"
                    className="border-white/30 bg-black/50 text-white backdrop-blur-md px-2.5 py-1 text-[11px] font-medium"
                  >
                    <Clock className="mr-1 h-3 w-3 text-brand-glow" />
                    Ends {formatEndDate(promo.endDate)}
                  </Badge>

                  <a
                    href={promo.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 bg-brand text-brand-foreground shadow-sm hover:bg-brand/90 transition-transform active:scale-95"
                    >
                      <span>Get Now</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

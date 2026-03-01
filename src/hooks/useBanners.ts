import { useQuery } from "@tanstack/react-query";
import { fetchBanners } from "@/services/bannersService";

// URLs dos banners locais como fallback
const LOCAL_BANNERS = [
  { id: "local-1", url: "/banners/banner1.png", fileName: "banner1.png", displayOrder: 0, isActive: true, createdAt: "" },
  { id: "local-2", url: "/banners/banner2.png", fileName: "banner2.png", displayOrder: 1, isActive: true, createdAt: "" },
  { id: "local-3", url: "/banners/banner3.png", fileName: "banner3.png", displayOrder: 2, isActive: true, createdAt: "" },
];

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn:  async () => {
      try {
        const data = await fetchBanners();
        return data.length > 0 ? data : LOCAL_BANNERS;
      } catch {
        return LOCAL_BANNERS;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

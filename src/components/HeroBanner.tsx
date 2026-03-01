import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/hooks/useBanners";

const INTERVAL = 4000;

const HeroBanner = () => {
  const { data: banners = [] } = useBanners();
  const [current,   setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);

  // Reseta índice se banners mudarem
  useEffect(() => { setCurrent(0); }, [banners.length]);

  const goTo = useCallback((index: number) => {
    if (animating || banners.length === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 400);
  }, [animating, banners.length]);

  const next = useCallback(() => {
    goTo((current + 1) % banners.length);
  }, [current, banners.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length);
  }, [current, banners.length, goTo]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-3">
      <div className="relative rounded-2xl overflow-hidden select-none"
           style={{ aspectRatio: "16/5" }}>

        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              i === current
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-[1.02] z-0"
            }`}
          >
            <img
              src={banner.url}
              alt={`Banner ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Botão anterior */}
        {banners.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20
                       w-9 h-9 rounded-full bg-white/80 hover:bg-white
                       flex items-center justify-center shadow-md
                       transition-all hover:scale-110"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Botão próximo */}
        {banners.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20
                       w-9 h-9 rounded-full bg-white/80 hover:bg-white
                       flex items-center justify-center shadow-md
                       transition-all hover:scale-110"
            aria-label="Próximo banner"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir para banner ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 h-2.5 bg-white shadow"
                    : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;

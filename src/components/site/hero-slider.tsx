"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/site/decorations";
import { cn } from "@/lib/utils";

const slides = [
  {
    eyebrow: "Handmade pencil art",
    title: "Gifts that carry your story",
    body: "Portraits drawn by hand from your favourite photograph, on 300gsm paper.",
    href: "/collections/pencil-art",
    cta: "See pencil portraits",
    art: "/samples/pencil-portrait.svg",
    tone: "from-blush via-cream to-cream",
  },
  {
    eyebrow: "Customised mugs",
    title: "The inside joke, every morning",
    body: "Photos, names and dates printed on ceramic that survives the dishwasher.",
    href: "/collections/customised-mugs",
    cta: "Shop mugs",
    art: "/samples/custom-mug.svg",
    tone: "from-cream via-blush to-cream",
  },
  {
    eyebrow: "Personalised frames",
    title: "One moment, properly kept",
    body: "Engraved wood and collage frames built around the photo that matters.",
    href: "/collections/photo-frames",
    cta: "Shop frames",
    art: "/samples/photo-frame.svg",
    tone: "from-cream via-cream to-blush",
  },
];

const INTERVAL = 6000;

export function HeroSlider() {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const touchStart = React.useRef<number | null>(null);

  const go = React.useCallback((next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }, []);

  React.useEffect(() => {
    if (paused) return;
    // Anyone who asked for reduced motion gets a static first slide.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused, index]);

  const slide = slides[index];

  return (
    <section
      className="relative overflow-hidden border-b border-line"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      tabIndex={0}
    >
      <div className={cn("relative bg-gradient-to-br transition-colors duration-700", slide.tone)}>
        <Confetti count={16} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:gap-10">
          {slides.map((item, i) => (
            <div
              key={item.title}
              // Kept mounted so the height does not jump between slides.
              className={cn(
                "col-start-1 row-start-1 transition-opacity duration-500",
                i === index ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={i !== index}
            >
              <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-brand ring-1 ring-line">
                {item.eyebrow}
              </span>
              <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
                {item.title}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{item.body}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={item.href} tabIndex={i === index ? 0 : -1}>
                  <Button size="lg">
                    {item.cta} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/products" tabIndex={i === index ? 0 : -1}>
                  <Button size="lg" variant="outline">
                    Shop everything
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          <div className="col-start-1 row-start-2 lg:col-start-2 lg:row-start-1">
            <div className="relative mx-auto aspect-square w-full max-w-sm rounded-2xl border border-line bg-white/70 shadow-sm">
              {slides.map((item, i) => (
                /* eslint-disable-next-line @next/next/no-img-element -- inline
                   SVG art, already tiny; the optimizer adds a round trip. */
                <img
                  key={item.art}
                  src={item.art}
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 h-full w-full rounded-2xl object-contain p-6 transition-opacity duration-500",
                    i === index ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex max-w-6xl items-center gap-2 px-4 pb-6">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="rounded-full border border-line bg-white/80 p-2 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="rounded-full border border-line bg-white/80 p-2 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="ml-2 flex">
            {slides.map((item, i) => (
              // Padding gives a 24px+ hit area on a phone while the visible
              // dot inside stays small.
              <button
                key={item.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}: ${item.eyebrow}`}
                aria-current={i === index}
                className="flex h-11 w-7 items-center justify-center"
              >
                <span
                  className={cn(
                    "block h-2.5 rounded-full transition-all",
                    i === index ? "w-6 bg-brand" : "w-2.5 bg-brand/30 hover:bg-brand/50",
                  )}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume slideshow" : "Pause slideshow"}
            className="ml-auto rounded-full border border-line bg-white/80 p-2 hover:bg-white"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export interface HomeSlide {
  id: string;
  title: string;
  description: string;
  linkPath: string;
  imageUrl: string | null;
}

const INTERVAL_MS = 7000;

export function HomeSlider({ slides }: Readonly<{ slides: HomeSlide[] }>) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, slides.length]);

  if (slides.length === 0) return null;
  const current = slides[index]!;

  return (
    <section
      className="slider"
      aria-roledescription="carousel"
      aria-label="نمایش ویژه"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="slider-track" aria-live="off">
        {slides.map((s, i) => (
          <article
            key={s.id}
            className={`slide${i === index ? " is-active" : ""}`}
            aria-hidden={i === index ? undefined : true}
            aria-roledescription="slide"
            aria-label={`${i + 1} از ${slides.length}`}
          >
            {s.imageUrl && (
              <div className="slide-media" key={i === index ? `active-${s.id}` : `idle-${s.id}`}>
                {/* Plain img: media host is operator-configured (MEDIA_BASE_URL) and outside Next optimizer allowlist by design. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.imageUrl}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className={i === index ? "kenburns" : undefined}
                />
                {i === index && slides.length > 1 && !paused && (
                  <span key={`progress-${index}`} className="slide-progress" aria-hidden="true" />
                )}
              </div>
            )}
            <div className="slide-copy">
              <p className="eyebrow">نمایش ویژه</p>
              <h2>{s.title}</h2>
              <p className="lead">{s.description}</p>
              <Link className="button-ghost" href={s.linkPath}>
                مشاهده
              </Link>
            </div>
          </article>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="slider-controls">
          <button type="button" className="slider-btn" onClick={() => go(index - 1)} aria-label="اسلاید قبلی">
            ‹
          </button>
          <div className="slider-dots" role="tablist" aria-label="انتخاب اسلاید">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`اسلاید ${i + 1}: ${s.title}`}
                className={`dot${i === index ? " is-active" : ""}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button type="button" className="slider-btn" onClick={() => go(index + 1)} aria-label="اسلاید بعدی">
            ›
          </button>
          <span className="slider-status" aria-hidden="true">
            {index + 1} / {slides.length} · {paused ? "متوقف" : "خودکار"}
          </span>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {current.title}
      </span>
    </section>
  );
}

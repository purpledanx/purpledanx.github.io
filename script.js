document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const heroImage = document.querySelector(".hero-scene > img");
  if (heroImage && !reducedMotion.matches) {
    heroImage.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 1100, easing: "ease-out" });
  }
  const hero = document.querySelector(".hero");
  if (hero && heroImage) {
    let frame = 0;
    const renderParallax = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const travel = reducedMotion.matches ? 0 : Math.min(Math.max(-bounds.top, 0), bounds.height) * .18;
      hero.style.setProperty("--hero-drift", `${travel}px`);
    };
    const queueParallax = () => {
      if (!frame) frame = requestAnimationFrame(renderParallax);
    };
    addEventListener("scroll", queueParallax, { passive: true });
    addEventListener("resize", queueParallax);
    reducedMotion.addEventListener("change", queueParallax);
    queueParallax();
  }

  if ("IntersectionObserver" in window) {
    const entrances = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        entrances.unobserve(target);
        if (reducedMotion.matches) return;
        target.animate([
          { opacity: .25, transform: "translateY(20px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 620, easing: "cubic-bezier(.2,.7,.2,1)" });
      });
    }, { threshold: .12 });
    document.querySelectorAll("[data-enter]").forEach((element) => entrances.observe(element));
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) document.getAnimations().forEach((animation) => animation.cancel());
    });
  }

  document.querySelectorAll("video").forEach((video) => {
    video.addEventListener("play", () => {
      document.querySelectorAll("video").forEach((other) => { if (other !== video) other.pause(); });
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) document.querySelectorAll("video").forEach((video) => video.pause());
  });

  document.querySelectorAll(".gallery-slide img, .gallery-slide video, .project-visual img, .project-visual video, .hero-scene img, .wiki-frames img").forEach((media) => {
    const status = document.createElement("p");
    status.className = "media-status";
    status.setAttribute("role", "status");
    status.hidden = true;
    media.after(status);
    const ready = () => { status.hidden = true; };
    const loading = () => {
      status.textContent = "Loading video…";
      status.hidden = false;
    };
    const failed = () => {
      status.hidden = false;
      status.textContent = "This preview couldn't load. ";
      if (media.closest("a")) {
        status.append("Open the project for details.");
      } else {
        const link = document.createElement("a");
        link.href = media.currentSrc || media.src || media.querySelector("source")?.src;
        link.textContent = "Open the media file";
        status.append(link);
      }
    };
    media.addEventListener("load", ready);
    media.addEventListener("loadeddata", ready);
    media.addEventListener("canplay", ready);
    media.addEventListener("error", failed);
    media.querySelector("source")?.addEventListener("error", failed);
    if (media.tagName === "IMG") {
      if (media.complete) { if (!media.naturalWidth) failed(); }
      else { status.textContent = "Loading image…"; status.hidden = false; }
    } else {
      media.addEventListener("waiting", loading);
      media.addEventListener("playing", ready);
      if (media.error) failed();
    }
  });

  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const track = gallery.querySelector(".gallery-track");
    const slides = [...track.querySelectorAll(".gallery-slide")];
    const previous = gallery.querySelector("[data-previous]");
    const next = gallery.querySelector("[data-next]");
    const count = gallery.querySelector(".gallery-count");
    if (!slides.length) {
      const empty = document.createElement("p");
      empty.textContent = "No previews have been added for this project yet.";
      gallery.replaceChildren(empty);
      return;
    }
    if (slides.length === 1) {
      gallery.querySelector(".gallery-controls").hidden = true;
      gallery.querySelector(".gallery-hint").textContent = "Press play to watch the demo. Video controls include volume and fullscreen.";
      track.removeAttribute("tabindex");
      track.setAttribute("aria-label", "Project demo");
    }
    let current = 0;
    const update = () => {
      const index = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (index !== current) {
        slides[current].querySelectorAll("video").forEach((video) => video.pause());
        current = index;
        if (!reducedMotion.matches) {
          slides[current].animate([{ opacity: .4 }, { opacity: 1 }], { duration: 800, easing: "ease-out" });
        }
      }
      count.textContent = `Example ${current + 1} of ${slides.length}`;
      previous.disabled = current === 0;
      next.disabled = current === slides.length - 1;
    };
    const move = (delta) => {
      const destination = Math.max(0, Math.min(slides.length - 1, current + delta));
      track.scrollTo({ left: destination * track.clientWidth, behavior: reducedMotion.matches ? "instant" : "smooth" });
    };
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (event.target !== track) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    let trackWidth = track.clientWidth;
    new ResizeObserver(() => {
      if (track.clientWidth === trackWidth) return;
      trackWidth = track.clientWidth;
      track.scrollTo({ left: current * track.clientWidth, behavior: "instant" });
      update();
    }).observe(track);
    update();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const filters = document.querySelector(".work-filters");
  if (filters) {
    const works = [...document.querySelectorAll(".archive-list > li")];
    const count = document.querySelector("#work-count");
    const empty = document.querySelector(".work-empty");
    filters.hidden = false;
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      let total = 0;
      works.forEach((work) => {
        work.hidden = button.dataset.filter !== "all" && work.dataset.category !== button.dataset.filter;
        if (!work.hidden) total++;
      });
      count.textContent = `${total} ${total === 1 ? "project" : "projects"}`;
      empty.hidden = total > 0;
    });
  }

  const copyButton = document.querySelector("#copy-discord");
  const discordHandle = document.querySelector("#discord-handle");
  const copyStatus = document.querySelector("#copy-status");
  if (copyButton && discordHandle && copyStatus) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(discordHandle.textContent.trim());
        copyStatus.textContent = "Copied purpledanx.";
      } catch {
        const handle = document.createElement("span");
        handle.textContent = discordHandle.textContent.trim();
        copyStatus.replaceChildren("Copy unavailable. Copy this handle manually: ", handle);
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(handle);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }

  if ("IntersectionObserver" in window) {
    const activeEntrances = new Map();
    const visibleEntrances = new Set();
    const entrances = new IntersectionObserver((entries) => {
      const groups = new Map();
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) {
          visibleEntrances.delete(target);
          activeEntrances.get(target)?.cancel();
          return;
        }
        if (visibleEntrances.has(target)) return;
        visibleEntrances.add(target);
        if (reducedMotion.matches || target.contains(document.activeElement)) return;
        activeEntrances.get(target)?.cancel();
        const group = target.closest("header, section, footer") || target.parentElement;
        const order = groups.get(group) || 0;
        groups.set(group, order + 1);
        const isRow = target.matches(".work-feature, .archive-list > li, .profile-portrait");
        const isName = target.matches(".contact-name");
        const isHeading = target.matches("h1, h2");
        const from = isName ? "translateY(36px) scale(.98)"
          : isRow ? "translateY(32px)"
          : isHeading ? "translateY(24px)"
          : "translateY(12px)";
        const animation = target.animate([
          { opacity: .35, transform: from },
          { opacity: 1, transform: "none" },
        ], {
          duration: isHeading ? 900 : isRow ? 800 : 700,
          delay: Math.min(order, 3) * 65,
          easing: "cubic-bezier(.19,1,.22,1)",
          fill: "backwards",
        });
        activeEntrances.set(target, animation);
        const release = () => {
          if (activeEntrances.get(target) === animation) activeEntrances.delete(target);
        };
        animation.addEventListener("finish", release, { once: true });
        animation.addEventListener("cancel", release, { once: true });
      });
    }, { threshold: .12, rootMargin: "0px 0px -24px 0px" });
    document.querySelectorAll("[data-enter]").forEach((element) => entrances.observe(element));
    document.addEventListener("focusin", (event) => {
      for (const [element, animation] of activeEntrances) {
        if (element.contains(event.target)) animation.cancel();
      }
    });
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

  document.querySelectorAll(".gallery-slide img, .gallery-slide video, .work-image img, .profile-portrait img").forEach((media) => {
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

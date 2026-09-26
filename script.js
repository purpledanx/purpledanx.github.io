try {
  const preference = localStorage.getItem("darkMode");
  document.documentElement.classList.toggle(
    "dark",
    preference !== "0",
  );
} catch (_) {
  /* Storage is optional. */
}
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".theme-toggle");
  const updateTheme = () => {
    const dark = document.documentElement.classList.contains("dark");
    const icon = toggle.querySelector("img");
    if (icon) {
      icon.src = new URL(
        `${dark ? "light-mode" : "dark-mode"}.svg`,
        icon.src,
      ).href;
    }
    toggle.setAttribute(
      "aria-label",
      `Switch to ${dark ? "light" : "dark"} mode`,
    );
  };
  if (toggle) {
    updateTheme();
    toggle.addEventListener("click", () => {
      const dark = document.documentElement.classList.toggle("dark");
      try {
        localStorage.setItem("darkMode", dark ? "1" : "0");
      } catch (_) {}
      updateTheme();
    });
  }
  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const track = gallery.querySelector(".gallery-track");
    const slides = [...track.querySelectorAll(".gallery-slide")];
    const previous = gallery.querySelector("[data-previous]");
    const next = gallery.querySelector("[data-next]");
    const count = gallery.querySelector(".gallery-count");
    let current = 0;
    const update = () => {
      const index = Math.max(
        0,
        Math.min(
          slides.length - 1,
          Math.round(track.scrollLeft / track.clientWidth),
        ),
      );
      if (index !== current) {
        slides[current]
          .querySelectorAll("video")
          .forEach((video) => video.pause());
        current = index;
      }
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      previous.disabled = current === 0;
      next.disabled = current === slides.length - 1;
    };
    const move = (delta) => {
      const destination = Math.max(
        0,
        Math.min(slides.length - 1, current + delta),
      );
      track.scrollTo({
        left: destination * track.clientWidth,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
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
    new ResizeObserver(() => {
      track.scrollTo({
        left: current * track.clientWidth,
        behavior: "instant",
      });
      update();
    }).observe(track);
    update();
  });
});

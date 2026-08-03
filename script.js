function scrollToContent() {
    const target = document.getElementById('projects');
    if (!target) return;

    target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function initMediaSlideshow() {
    const images = Array.from(document.querySelectorAll('.media-card:not(.media-card--stack-carousel) img'));
    if (images.length < 2) return;

    const overlay = document.createElement('div');
    overlay.className = 'media-lightbox';
    overlay.innerHTML = [
        '<button class="lightbox-close" aria-label="Close slideshow">x</button>',
        '<button class="lightbox-nav lightbox-prev" aria-label="Previous image">&#10094;</button>',
        '<figure class="lightbox-figure">',
        '  <img class="lightbox-image" alt="Fullscreen media preview">',
        '  <figcaption class="lightbox-caption"></figcaption>',
        '</figure>',
        '<button class="lightbox-nav lightbox-next" aria-label="Next image">&#10095;</button>'
    ].join('');

    document.body.appendChild(overlay);

    const lightboxImage = overlay.querySelector('.lightbox-image');
    const lightboxCaption = overlay.querySelector('.lightbox-caption');
    const closeBtn = overlay.querySelector('.lightbox-close');
    const prevBtn = overlay.querySelector('.lightbox-prev');
    const nextBtn = overlay.querySelector('.lightbox-next');

    let currentIndex = 0;
    let intervalId = null;

    function captionFor(index) {
        const card = images[index].closest('.media-card');
        const captionEl = card ? card.querySelector('figcaption') : null;
        return captionEl ? captionEl.textContent.trim() : '';
    }

    function render(index) {
        const bounded = (index + images.length) % images.length;
        currentIndex = bounded;
        const source = images[bounded].currentSrc || images[bounded].src || images[bounded].getAttribute('src');
        lightboxImage.removeAttribute('src');
        if (source) {
            lightboxImage.src = source;
        }
        lightboxImage.alt = images[bounded].alt || 'Fullscreen media preview';
        lightboxCaption.textContent = captionFor(bounded);
    }

    function stopAutoSlide() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function startAutoSlide() {
        stopAutoSlide();
        if (images.length < 2) return;
        intervalId = setInterval(function() {
            render(currentIndex + 1);
        }, 3500);
    }

    function open(index) {
        render(index);
        overlay.classList.add('open');
        document.body.classList.add('lightbox-open');
        startAutoSlide();
    }

    function close() {
        overlay.classList.remove('open');
        document.body.classList.remove('lightbox-open');
        stopAutoSlide();
    }

    images.forEach(function(img, idx) {
        img.classList.add('slideshow-trigger');
        img.addEventListener('click', function() {
            open(idx);
        });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function() {
        render(currentIndex - 1);
    });
    nextBtn.addEventListener('click', function() {
        render(currentIndex + 1);
    });

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            close();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (!overlay.classList.contains('open')) return;
        if (event.key === 'Escape') close();
        if (event.key === 'ArrowLeft') render(currentIndex - 1);
        if (event.key === 'ArrowRight') render(currentIndex + 1);
    });
}

function initStackCarousels() {
    const carousels = Array.from(document.querySelectorAll('[data-stack-carousel]'));
    if (!carousels.length) return;

    carousels.forEach(function(carousel) {
        const slides = Array.from(carousel.querySelectorAll('.stack-carousel-image'));
        if (slides.length < 2) return;

        let currentIndex = 0;

        function render(index) {
            currentIndex = (index + slides.length) % slides.length;

            slides.forEach(function(slide, slideIndex) {
                const offset = (slideIndex - currentIndex + slides.length) % slides.length;
                slide.classList.toggle('is-active', offset === 0);
                slide.classList.toggle('is-back', offset === 1);
                slide.classList.toggle('is-hidden', offset > 1);
            });
        }

        carousel.addEventListener('click', function() {
            render(currentIndex + 1);
        });

        render(0);
    });
}

function initVideoCarousels() {
    const carousels = Array.from(document.querySelectorAll('[data-video-carousel]'));
    if (!carousels.length) return;

    carousels.forEach(function(carousel) {
        const video = carousel.querySelector('.project-video');
        const caption = carousel.querySelector('.video-carousel-caption');
        const prevBtn = carousel.querySelector('.video-carousel-prev');
        const nextBtn = carousel.querySelector('.video-carousel-next');

        let slides = [];
        try {
            slides = JSON.parse(carousel.dataset.videoSlides || '[]');
        } catch (error) {
            slides = [];
        }

        if (!video || slides.length < 1) return;

        let currentIndex = 0;

        function render(index) {
            currentIndex = (index + slides.length) % slides.length;
            const slide = slides[currentIndex];

            if (video.src !== slide.src) {
                video.pause();
                video.removeAttribute('src');
                video.src = slide.src;
                video.load();
            }

            if (slide.poster) {
                video.poster = slide.poster;
            } else {
                video.removeAttribute('poster');
            }

            if (caption) {
                caption.textContent = slide.caption || '';
            }

            if (prevBtn) prevBtn.disabled = slides.length < 2;
            if (nextBtn) nextBtn.disabled = slides.length < 2;
        }

        function move(delta) {
            render(currentIndex + delta);
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                move(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                move(1);
            });
        }

        carousel.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                move(-1);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                move(1);
            }
        });

        carousel.addEventListener('click', function() {
            carousel.focus();
        });

        render(0);
    });
}

/* ── Dark Mode ────────────────────────────────────── */

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function setDarkPreference(value) {
    try {
        localStorage.setItem('darkMode', value);
    } catch (e) {
        // ignore storage errors
    }
    setCookie('darkMode', value, 365);
}

function getDarkPreference() {
    try {
        const localValue = localStorage.getItem('darkMode');
        if (localValue === '1' || localValue === '0') {
            return localValue;
        }
    } catch (e) {
        // ignore storage errors
    }
    return getCookie('darkMode');
}

function setDarkClass(on) {
    document.documentElement.classList.toggle('dark', on);
}

function updateToggleButton() {
    const btn = document.querySelector('.dark-toggle');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkClass(!isDark);
    updateToggleButton();
    setDarkPreference(!isDark ? '1' : '0');
}

function initSharedFooter() {
    if (!document.body || document.body.dataset.noSharedFooter === '1') return;

    const footerUrl = window.location.pathname.indexOf('/projects/') !== -1 ? '../footer.html' : 'footer.html';

    fetch(footerUrl)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load shared footer');
            }

            return response.text();
        })
        .then(function(html) {
            document.body.insertAdjacentHTML('beforeend', html);
        })
        .catch(function() {
            // Footer is optional; leave the page usable if it cannot be loaded.
        });
}

if (getDarkPreference() === '1') {
    setDarkClass(true);
}

document.addEventListener('DOMContentLoaded', function() {
    updateToggleButton();
    initMediaSlideshow();
    initStackCarousels();
    initVideoCarousels();
    initSharedFooter();
});
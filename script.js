function scrollToContent() {
    const target = document.getElementById('projects');
    if (!target) return;

    target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function initMediaSlideshow() {
    const images = Array.from(document.querySelectorAll('.media-card img'));
    if (!images.length) return;

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
        lightboxImage.src = images[bounded].src;
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

if (getDarkPreference() === '1') {
    setDarkClass(true);
}

document.addEventListener('DOMContentLoaded', function() {
    updateToggleButton();
    initMediaSlideshow();
});
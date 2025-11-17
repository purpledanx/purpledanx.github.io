function scrollToContent() {
    $('html, body').animate({
        scrollTop: $('#projects').offset().top
    }, 800, 'easeInOutCubic');
}

window.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    const heroHeight = hero.offsetHeight;
    const scrollPercent = (scrolled / heroHeight) * 100;
    
    hero.style.backgroundPosition = scrollPercent + '% 50%';
});
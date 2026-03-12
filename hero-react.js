import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Warp } from '@paper-design/shaders-react';

function useDarkModeClass() {
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    useEffect(function() {
        const root = document.documentElement;
        const observer = new MutationObserver(function() {
            setIsDark(root.classList.contains('dark'));
        });

        observer.observe(root, {
            attributes: true,
            attributeFilter: ['class']
        });

        return function() {
            observer.disconnect();
        };
    }, []);

    return isDark;
}

function HeroWarpIsland() {
    const isDark = useDarkModeClass();

    const warpProps = {
        speed: 1,
        scale: 1,
        softness: 1,
        proportion: 0.5,
        swirl: 0.79,
        swirlIterations: 10,
        shape: 'checks',
        distortion: 0.2,
        shapeScale: 0.1,
        style: {
            width: '100%',
            height: '100%',
            flexShrink: '0'
        }
    };

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'div',
            {
                className: 'hero-shader-layer hero-shader-light' + (isDark ? ' is-hidden' : '')
            },
            React.createElement(Warp, {
                ...warpProps,
                colors: ['#516DEA', '#F5F5F5', '#764BA2']
            })
        ),
        React.createElement(
            'div',
            {
                className: 'hero-shader-layer hero-shader-dark' + (isDark ? '' : ' is-hidden')
            },
            React.createElement(Warp, {
                ...warpProps,
                colors: ['#4B2A6E', '#181A20', '#2A3276']
            })
        ),
        React.createElement('div', { className: 'hero-shader-overlay' })
    );
}

const mount = document.getElementById('hero-react-bg');
if (mount) {
    try {
        createRoot(mount).render(React.createElement(HeroWarpIsland));
    } catch (error) {
        console.error('Hero React island failed to render:', error);
    }
}

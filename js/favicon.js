// Les navigateurs n'animent pas les favicons SVG ou GIF de façon fiable : on précalcule des images et on les fait défiler.
import { createSunTexture, renderSunIcon } from './sun-icon.js';

const SIZE = 64;
const FRAMES = 48;
const FRAME_MS = 100;

const icon = document.querySelector('link[rel="icon"]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Chaque image est calculée au premier passage puis mise en cache, pour ne pas bloquer la scène d'un seul coup
function createFrames() {
    const texture = createSunTexture();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const cache = [];
    return (i) => {
        if (!cache[i]) {
            const pixels = renderSunIcon(SIZE, texture, (i / FRAMES) * Math.PI * 2);
            ctx.putImageData(new ImageData(pixels, SIZE, SIZE), 0, 0);
            cache[i] = canvas.toDataURL('image/png');
        }
        return cache[i];
    };
}

if (icon) {
    const staticHref = icon.href;
    let frame;
    let timer;

    const update = () => {
        clearInterval(timer);
        if (reducedMotion.matches) {
            icon.href = staticHref;
            return;
        }
        frame ??= createFrames();
        let index = 0;
        timer = setInterval(() => {
            icon.href = frame(index);
            index = (index + 1) % FRAMES;
        }, FRAME_MS);
    };

    reducedMotion.addEventListener('change', update);
    // Après le chargement, pour ne pas retarder l'initialisation de la scène
    if (document.readyState === 'complete') update();
    else window.addEventListener('load', update, { once: true });
}

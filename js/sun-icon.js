// Rendu sans DOM du Soleil de la scène (texture + halo additif), partagé par le favicon animé et le script qui génère favicon.ico
import { BODIES } from './data.js';
import { createBodyTexture } from './textures.js';

const TAU = Math.PI * 2;
const SUPERSAMPLE = 3;
// Rayon du disque rapporté à la demi-taille de l'icône ; le halo occupe le reste
const DISK_FILL = 0.62;
// Le sprite du halo mesure 6 rayons dans la scène
const GLOW_EXTENT = 3;

const SUN = BODIES.find((body) => body.id === 'soleil');

const parseRgba = (color) => color.match(/[\d.]+/g).map(Number);
const GLOW = SUN.glow.map(([offset, color]) => [offset, parseRgba(color)]);

function glowAt(t, out) {
    if (t >= 1) return out.fill(0);
    let i = 0;
    while (GLOW[i + 1][0] < t) i++;
    const [o0, c0] = GLOW[i], [o1, c1] = GLOW[i + 1];
    const k = (t - o0) / (o1 - o0);
    for (let j = 0; j < 4; j++) out[j] = c0[j] + (c1[j] - c0[j]) * k;
    return out;
}

export function createSunTexture() {
    return createBodyTexture({ ...SUN.texture, size: 256 });
}

// rotation en radians, appliquée autour de l'axe vertical comme le mesh de la scène
export function renderSunIcon(size, texture, rotation = 0) {
    const { width, height, pixels: tex } = texture;
    const out = new Uint8ClampedArray(size * size * 4);
    const half = size / 2;
    const radius = half * DISK_FILL;
    const glow = [0, 0, 0, 0];
    const samples = SUPERSAMPLE * SUPERSAMPLE;

    for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
            let r = 0, g = 0, b = 0, a = 0;
            for (let sy = 0; sy < SUPERSAMPLE; sy++) {
                for (let sx = 0; sx < SUPERSAMPLE; sx++) {
                    const x = (px + (sx + 0.5) / SUPERSAMPLE - half) / radius;
                    const y = (half - py - (sy + 0.5) / SUPERSAMPLE) / radius;
                    const d2 = x * x + y * y;
                    glowAt(Math.sqrt(d2) / GLOW_EXTENT, glow);
                    const ga = glow[3];
                    if (d2 <= 1) {
                        const z = Math.sqrt(1 - d2);
                        const lon = (((Math.atan2(x, z) + rotation) % TAU) + TAU) % TAU;
                        const lat = Math.asin(y);
                        const tx = Math.min(width - 1, Math.floor((lon / TAU) * width));
                        const ty = Math.min(height - 1, Math.floor((lat / Math.PI + 0.5) * height));
                        const i = (ty * width + tx) * 4;
                        r += Math.min(255, tex[i] + glow[0] * ga);
                        g += Math.min(255, tex[i + 1] + glow[1] * ga);
                        b += Math.min(255, tex[i + 2] + glow[2] * ga);
                        a += 1;
                    } else if (ga > 0) {
                        r += glow[0] * ga;
                        g += glow[1] * ga;
                        b += glow[2] * ga;
                        a += ga;
                    }
                }
            }
            // Couleurs prémultipliées par l'alpha, d'où la division pour revenir en RGBA classique
            const o = (py * size + px) * 4;
            if (a > 0) {
                out[o] = r / a;
                out[o + 1] = g / a;
                out[o + 2] = b / a;
                out[o + 3] = (a / samples) * 255;
            }
        }
    }
    return out;
}

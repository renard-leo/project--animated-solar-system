// Générateurs sans DOM, exécutés dans des workers : ils renvoient des pixels RGBA, la ligne 0 étant le pôle sud
const TAU = Math.PI * 2;
const DEG = 180 / Math.PI;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
};
const fade = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function mix(a, b, t, out) {
    out[0] = a[0] + (b[0] - a[0]) * t;
    out[1] = a[1] + (b[1] - a[1]) * t;
    out[2] = a[2] + (b[2] - a[2]) * t;
    return out;
}

function gradient(stops, t, out) {
    const scaled = clamp(t) * (stops.length - 1);
    const index = Math.min(Math.floor(scaled), stops.length - 2);
    return mix(stops[index], stops[index + 1], scaled - index, out);
}

function mulberry32(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function createNoise(seed) {
    const random = mulberry32(seed);
    const perm = new Uint8Array(512);
    const values = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
        perm[i] = i;
        values[i] = random();
    }
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    perm.copyWithin(256, 0, 256);

    function noise(x, y, z) {
        const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
        const x0 = fx & 255, y0 = fy & 255, z0 = fz & 255;
        const y1 = (y0 + 1) & 255, z1 = (z0 + 1) & 255;
        const u = fade(x - fx), v = fade(y - fy), w = fade(z - fz);
        const a = perm[x0], b = perm[(x0 + 1) & 255];
        const aa = perm[a + y0], ab = perm[a + y1], ba = perm[b + y0], bb = perm[b + y1];
        return lerp(
            lerp(lerp(values[perm[aa + z0]], values[perm[ba + z0]], u), lerp(values[perm[ab + z0]], values[perm[bb + z0]], u), v),
            lerp(lerp(values[perm[aa + z1]], values[perm[ba + z1]], u), lerp(values[perm[ab + z1]], values[perm[bb + z1]], u), v),
            w
        );
    }

    // Les octaves de bruit de valeur se resserrent autour de 0,5 : on étire le résultat
    return function fbm(x, y, z, octaves = 4) {
        let sum = 0, amplitude = 0.5, frequency = 1, total = 0;
        for (let i = 0; i < octaves; i++) {
            sum += noise(x * frequency, y * frequency, z * frequency) * amplitude;
            total += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return clamp((sum / total - 0.5) * 2.4 + 0.5);
    };
}

// Échantillonne le bruit sur la sphère pour une texture équirectangulaire sans couture ni pincement aux pôles
function paint(width, height, shader) {
    const pixels = new Uint8ClampedArray(width * height * 4);
    const cosLon = new Float32Array(width);
    const sinLon = new Float32Array(width);
    for (let x = 0; x < width; x++) {
        const lon = ((x + 0.5) / width) * TAU;
        cosLon[x] = Math.cos(lon);
        sinLon[x] = Math.sin(lon);
    }
    const out = [0, 0, 0, 255];
    for (let y = 0; y < height; y++) {
        const lat = ((y + 0.5) / height - 0.5) * Math.PI;
        const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
        for (let x = 0; x < width; x++) {
            out[3] = 255;
            shader(cosLat * cosLon[x], sinLat, -cosLat * sinLon[x], lat, ((x + 0.5) / width) * TAU, out);
            const i = (y * width + x) * 4;
            pixels[i] = out[0];
            pixels[i + 1] = out[1];
            pixels[i + 2] = out[2];
            pixels[i + 3] = out[3];
        }
    }
    return { width, height, pixels };
}

const SHADERS = {
    sun(spec, fbm, colors) {
        return (x, y, z, lat, lon, out) => {
            const cells = fbm(x * 18, y * 18, z * 18, 3);
            const flares = fbm(x * 4, y * 4, z * 4, 3);
            gradient(colors, 0.62 + (cells - 0.5) * 0.5 + (flares - 0.5) * 0.45, out);
        };
    },

    rocky(spec, fbm, colors) {
        return (x, y, z, lat, lon, out) => {
            const base = fbm(x * 2.5, y * 2.5, z * 2.5);
            const craters = Math.abs(fbm(x * 14 + 5, y * 14, z * 14, 3) - 0.5) * 2;
            gradient(colors, base * 0.7 + craters * 0.35 - 0.05 + (spec.split || 0) * x, out);
        };
    },

    ice(spec, fbm, colors) {
        return (x, y, z, lat, lon, out) => {
            gradient(colors, 0.45 + fbm(x * 3, y * 3, z * 3, 3) * 0.55, out);
            const crack = 1 - smoothstep(0, 0.05, Math.abs(fbm(x * 5 + 9, y * 5, z * 5, 3) - 0.5));
            mix(out, colors[0], crack * 0.8, out);
        };
    },

    mars(spec, fbm, colors) {
        const ice = hexToRgb('#f1ece6');
        return (x, y, z, lat, lon, out) => {
            const regions = fbm(x * 2, y * 2, z * 2);
            const detail = fbm(x * 9 + 3, y * 9, z * 9, 3);
            gradient(colors, regions * 0.75 + detail * 0.3 - 0.05, out);
            mix(out, ice, smoothstep(72, 80, Math.abs(lat * DEG) + (detail - 0.5) * 12), out);
        };
    },

    clouds(spec, fbm, colors) {
        return (x, y, z, lat, lon, out) => {
            const warp = fbm(x * 2, y * 2, z * 2);
            const bands = 0.5 + 0.5 * Math.sin((y * spec.bands + (warp - 0.5) * spec.turbulence * 3) * Math.PI);
            const detail = fbm(x * 7, y * 7, z * 7, 3);
            gradient(colors, bands * 0.55 + detail * 0.45, out);
        };
    },

    gas(spec, fbm, colors) {
        const spot = spec.spot && { ...spec.spot, rgb: hexToRgb(spec.spot.color) };
        return (x, y, z, lat, lon, out) => {
            const warp = fbm(x * 3, y * 3, z * 3, 3);
            const bands = 0.5 + 0.5 * Math.sin((y * spec.bands + (warp - 0.5) * spec.turbulence * 2) * Math.PI);
            const detail = fbm(x * 8, y * 24, z * 8, 2);
            gradient(colors, bands * 0.85 + detail * 0.15, out);
            if (!spot) return;
            const dLon = ((lon * DEG - spot.lon + 540) % 360) - 180;
            const dLat = lat * DEG - spot.lat;
            const distance = Math.hypot(dLon / spot.width, dLat / spot.height) + (warp - 0.5) * 0.3;
            mix(out, spot.rgb, smoothstep(1, 0.45, distance), out);
        };
    },

    earth(spec, fbm) {
        const deep = hexToRgb('#08214a'), shallow = hexToRgb('#1f64ad');
        const land = ['#2f6b34', '#5b8a3c', '#8c8250', '#7a6a58'].map(hexToRgb);
        const sand = hexToRgb('#c8a56a'), ice = hexToRgb('#eef4f8');
        return (x, y, z, lat, lon, out) => {
            const height = fbm(x * 1.6 + 11, y * 1.6, z * 1.6, 5);
            const latitude = Math.abs(lat * DEG);
            const detail = fbm(x * 6, y * 6, z * 6, 2);
            if (height < 0.6) {
                mix(deep, shallow, smoothstep(0.3, 0.6, height), out);
            } else {
                gradient(land, (height - 0.6) / 0.35, out);
                const desert = smoothstep(14, 22, latitude) * smoothstep(38, 28, latitude) * smoothstep(0.35, 0.65, detail);
                mix(out, sand, desert * 0.8, out);
            }
            mix(out, ice, smoothstep(68, 74, latitude + (detail - 0.5) * 14), out);
        };
    }
};

const TEXTURE_SIZES = { earth: 1024, gas: 1024 };

export function createBodyTexture(spec) {
    const fbm = createNoise(spec.seed);
    const colors = (spec.colors || []).map(hexToRgb);
    const width = spec.size || TEXTURE_SIZES[spec.kind] || 512;
    return paint(width, width / 2, SHADERS[spec.kind](spec, fbm, colors));
}

export function createCloudTexture(seed) {
    const fbm = createNoise(seed);
    return paint(1024, 512, (x, y, z, lat, lon, out) => {
        out[0] = out[1] = out[2] = 255;
        out[3] = smoothstep(0.5, 0.78, fbm(x * 2.5, y * 4, z * 2.5)) * 230;
    });
}

export function createRingTexture(ring) {
    const fbm = createNoise(42);
    const colors = ring.colors.map(hexToRgb);
    const width = 1024;
    const pixels = new Uint8ClampedArray(width * 4);
    const color = [0, 0, 0];
    for (let x = 0; x < width; x++) {
        const t = x / (width - 1);
        const density = fbm(t * 60, 0.5, 0.5);
        let alpha = 0.35 + density * 0.6;
        alpha *= smoothstep(0, 0.2, t) * 0.65 + 0.35;
        // Division de Cassini puis division d'Encke
        alpha *= 1 - smoothstep(0.685, 0.7, t) * (1 - smoothstep(0.745, 0.76, t)) * 0.92;
        alpha *= 1 - smoothstep(0.935, 0.94, t) * (1 - smoothstep(0.95, 0.955, t)) * 0.7;
        alpha *= 1 - smoothstep(0.97, 1, t);
        gradient(colors, density * 0.6 + t * 0.4, color);
        pixels.set([color[0], color[1], color[2], alpha * 255], x * 4);
    }
    return { width, height: 1, pixels };
}

export const GENERATORS = { body: createBodyTexture, clouds: createCloudTexture, ring: createRingTexture };

import { GENERATORS } from './textures.js';

self.addEventListener('message', ({ data: { id, type, spec } }) => {
    const { width, height, pixels } = GENERATORS[type](spec);
    self.postMessage({ id, width, height, pixels }, [pixels.buffer]);
});

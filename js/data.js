// Sources : NASA Planetary Fact Sheet. Une période de rotation négative indique une rotation rétrograde.
export const BODIES = [
    {
        id: 'soleil', name: 'Soleil', type: 'Étoile naine jaune', color: '#ffb547',
        description: 'Étoile au centre du système solaire, elle concentre 99,86 % de sa masse. Sa lumière met environ 8 minutes à atteindre la Terre.',
        massKg: 1.989e30, diameterKm: 1392700, gravity: 274, rotationHours: 609.12, tiltDeg: 7.25, meanTempC: 5500,
        galactic: { periodYears: 230e6, speedKms: 220, distanceLy: 26000 },
        texture: { kind: 'sun', seed: 1, colors: ['#8a2400', '#e8590c', '#ffb547', '#fff3c4'] }
    },
    {
        id: 'mercure', name: 'Mercure', type: 'Planète tellurique', color: '#b5aca3',
        description: 'La plus petite planète et la plus proche du Soleil. Sans atmosphère pour retenir la chaleur, sa surface passe de −180 °C la nuit à 430 °C le jour.',
        massKg: 3.301e23, diameterKm: 4879, gravity: 3.7, rotationHours: 1407.6, tiltDeg: 0.034, meanTempC: 167,
        orbitDays: 87.969, orbitSpeedKms: 47.4, distanceMkm: 57.9, longitudeJ2000: 252.25,
        texture: { kind: 'rocky', seed: 2, colors: ['#4a4541', '#857d76', '#b5aca3', '#d8d0c8'] }
    },
    {
        id: 'venus', name: 'Vénus', type: 'Planète tellurique', color: '#e8c68a',
        description: 'Enveloppée d’épais nuages d’acide sulfurique, c’est la planète la plus chaude. Elle tourne sur elle-même à l’envers et si lentement que son jour dure plus que son année.',
        massKg: 4.867e24, diameterKm: 12104, gravity: 8.9, rotationHours: -5832.5, tiltDeg: 177.4, meanTempC: 464,
        orbitDays: 224.701, orbitSpeedKms: 35.0, distanceMkm: 108.2, longitudeJ2000: 181.98,
        texture: { kind: 'clouds', seed: 3, bands: 5, turbulence: 1.1, colors: ['#a8783e', '#d9ae6c', '#ecd2a0', '#f6e7c6'] }
    },
    {
        id: 'terre', name: 'Terre', type: 'Planète tellurique', color: '#4f9cff',
        description: 'Seule planète connue à abriter la vie. Ses océans d’eau liquide couvrent 71 % de sa surface et la Lune, son unique satellite, stabilise son axe.',
        massKg: 5.972e24, diameterKm: 12756, gravity: 9.8, rotationHours: 23.9345, tiltDeg: 23.44, meanTempC: 15,
        orbitDays: 365.256, orbitSpeedKms: 29.8, distanceMkm: 149.6, longitudeJ2000: 100.46,
        texture: { kind: 'earth', seed: 4 }
    },
    {
        id: 'mars', name: 'Mars', type: 'Planète tellurique', color: '#e2734a',
        description: 'La planète rouge doit sa couleur à l’oxyde de fer de son sol. Elle abrite Olympus Mons, le plus haut volcan connu, culminant à environ 22 km.',
        massKg: 6.417e23, diameterKm: 6792, gravity: 3.7, rotationHours: 24.6229, tiltDeg: 25.19, meanTempC: -65,
        orbitDays: 686.98, orbitSpeedKms: 24.1, distanceMkm: 227.9, longitudeJ2000: 355.45,
        texture: { kind: 'mars', seed: 5, colors: ['#5a2414', '#9c4325', '#c8653a', '#e2955f'] }
    },
    {
        id: 'jupiter', name: 'Jupiter', type: 'Géante gazeuse', color: '#d9a066',
        description: 'La plus grande planète, deux fois et demie plus massive que toutes les autres réunies. Sa Grande Tache rouge est une tempête plus large que la Terre.',
        massKg: 1.898e27, diameterKm: 142984, gravity: 23.1, rotationHours: 9.925, tiltDeg: 3.13, meanTempC: -110,
        orbitDays: 4332.59, orbitSpeedKms: 13.1, distanceMkm: 778.5, longitudeJ2000: 34.40,
        texture: { kind: 'gas', seed: 6, bands: 14, turbulence: 0.55, colors: ['#7a5236', '#b98455', '#e3c49a', '#f4e6cf'], spot: { lat: -22, lon: 80, width: 22, height: 11, color: '#c0573a' } }
    },
    {
        id: 'saturne', name: 'Saturne', type: 'Géante gazeuse', color: '#e6cf8f',
        description: 'Célèbre pour ses anneaux de glace et de roche : près de 270 000 km de diamètre pour une épaisseur souvent inférieure au kilomètre. Sa densité est plus faible que celle de l’eau.',
        massKg: 5.683e26, diameterKm: 120536, gravity: 9.0, rotationHours: 10.656, tiltDeg: 26.73, meanTempC: -140,
        orbitDays: 10759.22, orbitSpeedKms: 9.7, distanceMkm: 1432.0, longitudeJ2000: 49.94,
        texture: { kind: 'gas', seed: 7, bands: 10, turbulence: 0.25, colors: ['#9c8251', '#c9ae74', '#e6d3a1', '#f3e8c8'] },
        ring: { inner: 1.24, outer: 2.27, colors: ['#8c7a5c', '#d9c49a', '#efe2c0'] }
    },
    {
        id: 'uranus', name: 'Uranus', type: 'Géante de glace', color: '#8fd8e0',
        description: 'Géante de glace couchée sur le côté : son axe est incliné de 98°, si bien que chaque pôle connaît 42 ans de jour puis 42 ans de nuit.',
        massKg: 8.681e25, diameterKm: 51118, gravity: 8.7, rotationHours: -17.24, tiltDeg: 97.77, meanTempC: -195,
        orbitDays: 30688.5, orbitSpeedKms: 6.8, distanceMkm: 2867.0, longitudeJ2000: 313.23,
        texture: { kind: 'gas', seed: 8, bands: 6, turbulence: 0.08, colors: ['#5fb3c2', '#86cfd9', '#a8e1e6', '#c4eef0'] }
    },
    {
        id: 'neptune', name: 'Neptune', type: 'Géante de glace', color: '#5b7cf0',
        description: 'La planète la plus éloignée du Soleil, d’un bleu profond dû au méthane. Elle est balayée par les vents les plus rapides du système, à plus de 2 000 km/h.',
        massKg: 1.024e26, diameterKm: 49528, gravity: 11.0, rotationHours: 16.11, tiltDeg: 28.32, meanTempC: -200,
        orbitDays: 60182, orbitSpeedKms: 5.4, distanceMkm: 4515.0, longitudeJ2000: 304.88,
        texture: { kind: 'gas', seed: 9, bands: 8, turbulence: 0.3, colors: ['#1f3a9e', '#3557d1', '#5b7cf0', '#8ea6f7'], spot: { lat: -20, lon: 200, width: 14, height: 8, color: '#172a78' } }
    }
];

// Principaux satellites de chaque planète (NASA / JPL). Une période orbitale négative indique une révolution rétrograde.
const SATELLITES = {
    mercure: { of: 'de Mercure', knownMoons: 'Aucune', moons: [] },
    venus: { of: 'de Vénus', knownMoons: 'Aucune', moons: [] },
    terre: {
        of: 'de la Terre', knownMoons: '1', moons: [
            {
                id: 'lune', name: 'Lune', color: '#b9b4ad', plane: 'ecliptic', phaseDeg: 218.32,
                description: 'Seul satellite naturel de la Terre, elle lui montre toujours la même face et s’en éloigne d’environ 3,8 cm par an.',
                massKg: 7.342e22, diameterKm: 3474.8, orbitDays: 27.3217, distanceKm: 384400, meanTempC: -20,
                texture: { kind: 'rocky', seed: 21, size: 512, colors: ['#3d3d40', '#6e6c6a', '#9c9893', '#c9c4bd'] }
            }
        ]
    },
    mars: {
        of: 'de Mars', knownMoons: '2', moons: [
            {
                id: 'phobos', name: 'Phobos', color: '#8a7b6c',
                description: 'Le plus grand satellite de Mars se rapproche lentement de la planète : il devrait se disloquer d’ici quelques dizaines de millions d’années.',
                massKg: 1.0659e16, diameterKm: 22.5, orbitDays: 0.31891, distanceKm: 9376,
                texture: { kind: 'rocky', seed: 22, colors: ['#3a332d', '#5e544a', '#7d7064', '#9a8c7e'] }
            },
            {
                id: 'deimos', name: 'Deimos', color: '#a19282',
                description: 'Minuscule satellite de forme irrégulière, dont l’origine (astéroïde capturé ou débris d’un impact) reste débattue.',
                massKg: 1.4762e15, diameterKm: 12.4, orbitDays: 1.263, distanceKm: 23463,
                texture: { kind: 'rocky', seed: 23, colors: ['#4a4038', '#6e6256', '#8f8172', '#b0a191'] }
            }
        ]
    },
    jupiter: {
        of: 'de Jupiter', knownMoons: 'Plus de 90', moons: [
            {
                id: 'io', name: 'Io', color: '#e3c25a',
                description: 'Le corps le plus volcanique du système solaire : chauffé par les marées de Jupiter, il compte plus de 400 volcans actifs.',
                massKg: 8.932e22, diameterKm: 3643.2, orbitDays: 1.769, distanceKm: 421700,
                texture: { kind: 'rocky', seed: 24, colors: ['#8a5a1c', '#d1a33a', '#efd56a', '#f6f0b0'] }
            },
            {
                id: 'europe', name: 'Europe', color: '#d9cdb8',
                description: 'Sous sa croûte de glace se cache un océan d’eau salée, l’un des endroits les plus prometteurs pour chercher la vie.',
                massKg: 4.8e22, diameterKm: 3121.6, orbitDays: 3.551, distanceKm: 671034,
                texture: { kind: 'ice', seed: 25, colors: ['#7a5a3e', '#c9b8a0', '#e8e0d2', '#f7f4ee'] }
            },
            {
                id: 'ganymede', name: 'Ganymède', color: '#a89a88',
                description: 'Le plus grand satellite du système solaire, plus grand que Mercure, et le seul à posséder son propre champ magnétique.',
                massKg: 1.4819e23, diameterKm: 5268.2, orbitDays: 7.155, distanceKm: 1070412,
                texture: { kind: 'rocky', seed: 26, colors: ['#4f463d', '#7c7062', '#a89a88', '#d2c8ba'] }
            },
            {
                id: 'callisto', name: 'Callisto', color: '#7a6e60',
                description: 'L’un des objets les plus cratérisés du système solaire : sa surface a très peu changé depuis plus de 4 milliards d’années.',
                massKg: 1.0759e23, diameterKm: 4820.6, orbitDays: 16.689, distanceKm: 1882709,
                texture: { kind: 'rocky', seed: 27, colors: ['#2e2822', '#4d443b', '#6e6356', '#968a7b'] }
            }
        ]
    },
    saturne: {
        of: 'de Saturne', knownMoons: 'Plus de 270', moons: [
            {
                id: 'mimas', name: 'Mimas', color: '#bdbab6',
                description: 'Son cratère Herschel, large d’environ 130 km, couvre près d’un tiers de son diamètre.',
                massKg: 3.75e19, diameterKm: 396.4, orbitDays: 0.942, distanceKm: 185539,
                texture: { kind: 'ice', seed: 28, colors: ['#7d7b78', '#a9a6a2', '#cfccc8', '#ecebe8'] }
            },
            {
                id: 'encelade', name: 'Encelade', color: '#e4eef3',
                description: 'Des geysers d’eau jaillissent de son pôle sud et alimentent l’anneau E de Saturne.',
                massKg: 1.08e20, diameterKm: 504.2, orbitDays: 1.37, distanceKm: 237948,
                texture: { kind: 'ice', seed: 29, colors: ['#a9c4d4', '#dfeaf0', '#f5f9fb', '#ffffff'] }
            },
            {
                id: 'tethys', name: 'Téthys', color: '#cfcbc5',
                description: 'Composée presque entièrement de glace d’eau, elle est balafrée par Ithaca Chasma, un canyon long d’environ 2 000 km.',
                massKg: 6.17e20, diameterKm: 1062, orbitDays: 1.888, distanceKm: 294619,
                texture: { kind: 'ice', seed: 30, colors: ['#8f8c88', '#bdb9b3', '#ddd9d3', '#f3f1ed'] }
            },
            {
                id: 'dione', name: 'Dioné', color: '#bcb8b2',
                description: 'Satellite de glace et de roche parcouru de longues falaises de glace brillantes.',
                massKg: 1.095e21, diameterKm: 1122.8, orbitDays: 2.737, distanceKm: 377396,
                texture: { kind: 'ice', seed: 31, colors: ['#807d79', '#aaa6a0', '#d0ccc6', '#efece8'] }
            },
            {
                id: 'rhea', name: 'Rhéa', color: '#b5b0a9',
                description: 'Deuxième plus grand satellite de Saturne, une boule de glace et de roche couverte de cratères.',
                massKg: 2.307e21, diameterKm: 1527.6, orbitDays: 4.518, distanceKm: 527108,
                texture: { kind: 'ice', seed: 32, colors: ['#77736d', '#a29d96', '#c9c4bd', '#e6e2dc'] }
            },
            {
                id: 'titan', name: 'Titan', color: '#d9a95a',
                description: 'Seul satellite doté d’une atmosphère épaisse ; des lacs de méthane et d’éthane liquides parsèment ses régions polaires.',
                massKg: 1.3452e23, diameterKm: 5149.5, orbitDays: 15.945, distanceKm: 1221870, meanTempC: -179,
                texture: { kind: 'clouds', seed: 33, size: 512, bands: 3, turbulence: 0.4, colors: ['#8a5a1e', '#c08a3a', '#d9a95a', '#e8c27a'] }
            },
            {
                id: 'japet', name: 'Japet', color: '#8c847a',
                description: 'Ses deux hémisphères contrastent fortement : l’un est aussi sombre que du charbon, l’autre brillant comme la neige.',
                massKg: 1.806e21, diameterKm: 1468.6, orbitDays: 79.32, distanceKm: 3560820,
                texture: { kind: 'rocky', seed: 34, split: 0.55, colors: ['#1e1a16', '#4a4036', '#b8b0a4', '#e8e4dc'] }
            }
        ]
    },
    uranus: {
        of: 'd’Uranus', knownMoons: 'Près de 30', moons: [
            {
                id: 'miranda', name: 'Miranda', color: '#a9a5a0',
                description: 'Sa surface chaotique abrite Verona Rupes, l’une des plus hautes falaises connues du système solaire (environ 20 km).',
                massKg: 6.4e19, diameterKm: 471.6, orbitDays: 1.413, distanceKm: 129390,
                texture: { kind: 'ice', seed: 35, colors: ['#6f6c69', '#9a9692', '#bfbbb6', '#dedad5'] }
            },
            {
                id: 'ariel', name: 'Ariel', color: '#c4c0ba',
                description: 'La plus brillante des lunes d’Uranus, à la surface relativement jeune et sillonnée de vallées.',
                massKg: 1.251e21, diameterKm: 1157.8, orbitDays: 2.52, distanceKm: 190900,
                texture: { kind: 'ice', seed: 36, colors: ['#87847f', '#b3afa9', '#d6d2cc', '#efece8'] }
            },
            {
                id: 'umbriel', name: 'Umbriel', color: '#5f5b56',
                description: 'La plus sombre des grandes lunes d’Uranus, couverte de cratères anciens.',
                massKg: 1.275e21, diameterKm: 1169.4, orbitDays: 4.144, distanceKm: 266000,
                texture: { kind: 'rocky', seed: 37, colors: ['#2f2d2b', '#46433f', '#5f5b56', '#7a756f'] }
            },
            {
                id: 'titania', name: 'Titania', color: '#a69c91',
                description: 'La plus grande lune d’Uranus, marquée par d’immenses canyons.',
                massKg: 3.4e21, diameterKm: 1576.8, orbitDays: 8.706, distanceKm: 436300,
                texture: { kind: 'rocky', seed: 38, colors: ['#6b625a', '#8f857b', '#b2a89d', '#d0c7bc'] }
            },
            {
                id: 'oberon', name: 'Obéron', color: '#8f8378',
                description: 'La plus éloignée des grandes lunes d’Uranus, ancienne et très cratérisée.',
                massKg: 3.076e21, diameterKm: 1522.8, orbitDays: 13.463, distanceKm: 583500,
                texture: { kind: 'rocky', seed: 39, colors: ['#5a514a', '#7b7067', '#9b8f84', '#bcb0a4'] }
            }
        ]
    },
    neptune: {
        of: 'de Neptune', knownMoons: '16', moons: [
            {
                id: 'protee', name: 'Protée', color: '#706b67',
                description: 'L’un des plus grands corps de forme irrégulière connus, à peine assez massif pour s’arrondir sous sa propre gravité.',
                massKg: 4.4e19, diameterKm: 420, orbitDays: 1.122, distanceKm: 117647,
                texture: { kind: 'rocky', seed: 40, colors: ['#3b3836', '#55514e', '#706b67', '#8c8682'] }
            },
            {
                id: 'triton', name: 'Triton', color: '#d9bfb2',
                description: 'Il tourne autour de Neptune en sens inverse de la rotation de la planète, signe qu’il a sans doute été capturé. Des geysers d’azote jaillissent de sa surface gelée.',
                massKg: 2.139e22, diameterKm: 2706.8, orbitDays: -5.877, distanceKm: 354759, meanTempC: -235,
                texture: { kind: 'ice', seed: 41, colors: ['#9c7f74', '#c9ada0', '#e6d2c6', '#f5ebe4'] }
            }
        ]
    }
};

const G = 6.674e-11;
const GOLDEN_ANGLE = 137.5;

for (const planet of BODIES) {
    const satellites = SATELLITES[planet.id];
    if (!satellites) continue;
    Object.assign(planet, satellites);
    planet.moons.forEach((moon, index) => {
        const radiusM = (moon.diameterKm / 2) * 1000;
        moon.parent = planet;
        moon.type = `Satellite naturel ${planet.of}`;
        moon.synchronous = true;
        moon.rotationHours = Math.abs(moon.orbitDays) * 24;
        moon.gravity = (G * moon.massKg) / (radiusM * radiusM);
        moon.orbitSpeedKms = (2 * Math.PI * moon.distanceKm) / (Math.abs(moon.orbitDays) * 86400);
        moon.phaseDeg ??= (index + 1) * GOLDEN_ANGLE;
        moon.texture.size ??= 256;
    });
}

export const EARTH = BODIES.find((body) => body.id === 'terre');

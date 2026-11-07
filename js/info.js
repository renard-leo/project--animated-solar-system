import { EARTH } from './data.js';
import { formatDuration, formatNumber, formatRatio, formatScientific } from './format.js';

const REFERENCE_WEIGHT_KG = 70;
const KM_PER_AU = 149.6;

// Les couleurs passent par data-color puis le CSSOM : la CSP interdit les attributs style
const fact = (label, value, note) => `
    <div class="key-fact">
        <dt class="eyebrow">${label}</dt>
        <dd class="key-fact-value">${value}</dd>
        <dd class="key-fact-note">${note}</dd>
    </div>`;

const stat = (label, value, note = '') => `
    <div class="info-stat">
        <dt>${label}</dt>
        <dd>${value}${note ? `<span class="info-stat-note">${note}</span>` : ''}</dd>
    </div>`;

const section = (title, stats, extra = '') => `
    <section class="info-section">
        <h3 class="eyebrow">${title}</h3>
        <dl>${stats.join('')}</dl>
        ${extra}
    </section>`;

const compareToEarth = (value, reference) => (value === reference ? 'Référence' : `${formatRatio(value / reference)} × la Terre`);
const direction = (retrograde) => (retrograde ? 'Rétrograde' : 'Prograde');

function orbitStats(body) {
    if (body.galactic) {
        const { periodYears, speedKms, distanceLy } = body.galactic;
        return section('Révolution autour du centre de la Voie lactée', [
            stat('Durée d’un tour', `≈ ${formatNumber(periodYears / 1e6)} millions d’années`),
            stat('Vitesse orbitale', `≈ ${formatNumber(speedKms)} km/s`, `≈ ${formatNumber(speedKms * 3600)} km/h`),
            stat('Distance au centre galactique', `≈ ${formatNumber(distanceLy)} années-lumière`)
        ]);
    }
    if (body.parent) {
        const retrograde = body.orbitDays < 0;
        return section(`Révolution autour ${body.parent.of}`, [
            stat('Durée d’un tour', formatDuration(body.orbitDays * 24)),
            stat('Vitesse orbitale moyenne', `${formatNumber(body.orbitSpeedKms, 2)} km/s`, `${formatNumber(body.orbitSpeedKms * 3600)} km/h`),
            stat(`Distance moyenne à ${body.parent.name}`, `${formatNumber(body.distanceKm)} km`, `${formatNumber(body.distanceKm / (body.parent.diameterKm / 2), 1)} rayons planétaires`),
            stat('Sens de révolution', direction(retrograde), retrograde ? 'inverse de la rotation de la planète' : '')
        ]);
    }
    const inYears = body.orbitDays >= 1000;
    return section('Révolution autour du Soleil', [
        stat('Durée d’un tour', formatDuration(body.orbitDays * 24), inYears ? `${formatNumber(body.orbitDays)} jours terrestres` : ''),
        stat('Vitesse orbitale moyenne', `${formatNumber(body.orbitSpeedKms, 1)} km/s`, `${formatNumber(body.orbitSpeedKms * 3600)} km/h`),
        stat('Distance moyenne au Soleil', `${formatNumber(body.distanceMkm, 1)} millions de km`, `${formatNumber(body.distanceMkm / KM_PER_AU, 2)} UA`)
    ]);
}

function rotationStats(body, equatorKmh) {
    const retrograde = body.rotationHours < 0;
    return section('Rotation sur elle-même', [
        stat('Période de rotation sidérale', formatDuration(body.rotationHours)),
        stat('Vitesse à l’équateur', `${formatNumber(equatorKmh, equatorKmh < 100 ? 1 : 0)} km/h`, `${formatNumber(equatorKmh / 3600, 3)} km/s`),
        body.synchronous
            ? stat('Rotation synchrone', 'Oui', 'montre toujours la même face à sa planète')
            : stat('Sens de rotation', direction(retrograde), retrograde ? 'd’est en ouest' : 'd’ouest en est'),
        body.synchronous ? '' : stat('Inclinaison de l’axe', `${formatNumber(body.tiltDeg, 1)}°`)
    ]);
}

function moonList(body) {
    if (!body.moons) return '';
    const buttons = body.moons.map((moon) => `
        <li>
            <button class="moon-btn" type="button" data-focus="${moon.id}" data-color="${moon.color}">
                <span class="planet-dot is-small"></span>
                <span class="moon-name">${moon.name}</span>
                <span class="moon-note">Ø ${formatNumber(moon.diameterKm)} km</span>
            </button>
        </li>`).join('');
    const stats = [stat('Lunes connues', body.knownMoons, body.moons.length && String(body.moons.length) !== body.knownMoons ? `${body.moons.length} principales affichées` : '')];
    return section('Satellites naturels', stats, buttons ? `<ul class="moon-list">${buttons}</ul>` : '');
}

export function renderInfo(body) {
    const equatorKmh = (Math.PI * body.diameterKm) / Math.abs(body.rotationHours);
    const gasGiant = body.type.startsWith('Géante');
    let orbitFact;
    if (body.galactic) orbitFact = fact('Révolution', `≈ ${formatNumber(body.galactic.periodYears / 1e6)} Ma`, 'autour de la Voie lactée');
    else if (body.parent) orbitFact = fact('Révolution', formatDuration(body.orbitDays * 24), `à ${formatNumber(body.orbitSpeedKms, 1)} km/s autour ${body.parent.of}`);
    else orbitFact = fact('Révolution', formatDuration(body.orbitDays * 24), `à ${formatNumber(body.orbitSpeedKms, 1)} km/s en moyenne`);
    const back = body.parent
        ? `<button class="btn info-back" type="button" data-focus="${body.parent.id}" data-color="${body.parent.color}"><span class="planet-dot is-small"></span>Retour à ${body.parent.name}</button>`
        : '';

    return `
        ${back}
        <p class="info-description">${body.description}</p>
        <dl class="key-facts">
            ${fact('Rotation', formatDuration(body.rotationHours), body.synchronous ? 'synchrone avec sa révolution' : `${formatNumber(equatorKmh)} km/h à l’équateur`)}
            ${orbitFact}
            ${fact('Gravité', `${formatRatio(body.gravity)} m/s²`, compareToEarth(body.gravity, EARTH.gravity))}
            ${fact('Masse', formatScientific(body.massKg, 'kg'), compareToEarth(body.massKg, EARTH.massKg))}
        </dl>
        ${rotationStats(body, equatorKmh)}
        ${orbitStats(body)}
        ${moonList(body)}
        ${section('Gravité et masse', [
            stat('Gravité de surface', `${formatRatio(body.gravity)} m/s²`, gasGiant ? 'mesurée à 1 bar de pression' : ''),
            stat(`Poids ressenti pour ${REFERENCE_WEIGHT_KG} kg sur Terre`, `${formatRatio(REFERENCE_WEIGHT_KG * body.gravity / EARTH.gravity)} kg`),
            stat('Masse', formatScientific(body.massKg, 'kg'), compareToEarth(body.massKg, EARTH.massKg)),
            stat('Diamètre', `${formatNumber(body.diameterKm, body.diameterKm < 100 ? 1 : 0)} km`, compareToEarth(body.diameterKm, EARTH.diameterKm)),
            body.meanTempC === undefined ? '' : stat(body.galactic ? 'Température de surface' : 'Température moyenne', `${formatNumber(body.meanTempC)} °C`)
        ])}`;
}

const LOCALE = 'fr-FR';
const HOURS_PER_YEAR = 24 * 365.25;

const numberFormats = new Map();
const significant = new Intl.NumberFormat(LOCALE, { maximumSignificantDigits: 3 });
const mantissaFormat = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const SUPERSCRIPTS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

export function formatNumber(value, digits = 0) {
    if (!numberFormats.has(digits)) numberFormats.set(digits, new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }));
    return numberFormats.get(digits).format(value);
}

export const formatRatio = (value) => (value < 1e-3 ? formatScientific(value) : significant.format(value));

const plural = (value, word) => `${formatNumber(value, value < 10 ? 1 : 0)} ${word}${value >= 2 ? 's' : ''}`;

export function formatDuration(hours) {
    const abs = Math.abs(hours);
    if (abs < 48) {
        const totalMinutes = Math.round(abs * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return m ? `${h} h ${String(m).padStart(2, '0')} min` : `${h} h`;
    }
    const days = abs / 24;
    if (days < 1000) return `${formatNumber(days, 2)} jours`;
    return `${formatNumber(abs / HOURS_PER_YEAR, 2)} ans`;
}

export function formatScientific(value, unit = '') {
    const exponent = Math.floor(Math.log10(value));
    const mantissa = value / 10 ** exponent;
    const power = String(exponent).replace(/./g, (char) => SUPERSCRIPTS[char]);
    return `${mantissaFormat.format(mantissa)} × 10${power}${unit ? ` ${unit}` : ''}`;
}

export function formatRate(daysPerSecond) {
    const seconds = daysPerSecond * 86400;
    if (seconds < 1.5) return 'Temps réel';
    let span;
    if (seconds < 60) span = `${formatNumber(seconds, 0)} s`;
    else if (seconds < 3600) span = `${formatNumber(seconds / 60, seconds < 600 ? 1 : 0)} min`;
    else if (seconds < 86400) span = `${formatNumber(seconds / 3600, seconds < 36000 ? 1 : 0)} h`;
    else if (daysPerSecond < 60) span = plural(daysPerSecond, 'jour');
    else if (daysPerSecond < 365) span = `${formatNumber(daysPerSecond / 30.44, 1)} mois`;
    else span = plural(daysPerSecond / 365.25, 'an');
    return `1 s = ${span}`;
}

export const formatDate = (date, withTime) => (withTime ? dateTimeFormat : dateFormat).format(date);

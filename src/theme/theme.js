const primary = '#3b82f6';

function oscurecerColor(hex, porcentaje = 0.2) {
    const valor = hex.replace('#', '');

    const r = parseInt(valor.substring(0, 2), 16);
    const g = parseInt(valor.substring(2, 4), 16);
    const b = parseInt(valor.substring(4, 6), 16);

    const factor = 1 - porcentaje;

    const nuevoR = Math.round(r * factor);
    const nuevoG = Math.round(g * factor);
    const nuevoB = Math.round(b * factor);

    return `#${nuevoR.toString(16).padStart(2, '0')}${nuevoG
        .toString(16)
        .padStart(2, '0')}${nuevoB.toString(16).padStart(2, '0')}`;
}

export const theme = {
    colors: {
        primary,
        primaryDark: oscurecerColor(primary),
        primaryLight: '#3B82F6',
        primarySoft: '#E0E7FF',
        primaryBg: '#EEF2FF',

        background: '#ffffff',
        white: '#ffffff',
        textDark: '#0f172a',
        textMuted: '#64748b',
        border: '#cbd5e1',
        inputBg: '#f9fafad5',
        errorBg: '#fee2e2',
        errorText: '#ef4444',
        disabled: '#94a3b8',
        successBg: '#dcfce7',
        successText: '#16a34a',
        successBorder: '#86efac',
        warningBg: '#fef3c7',
        warningText: '#92400e',
        warningBorder: '#fcd34d',
        infoBg: '#dbeafe',
        infoText: '#1d4ed8',
        neutralBg: '#f1f5f9',
        neutralText: '#475569',
        neutralBorder: '#e2e8f0',
        finalizedBg: '#bfdbfe',
        finalizedText: '#1e3a8a',
    },

    sizes: {
        title: 28,
        subtitle: 16,
        body: 14,
        input: 16,
    },

    spacing: {
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        headerTop: 1,
    }
};
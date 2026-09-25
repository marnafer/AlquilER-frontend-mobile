const primary = '#0d9488';

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

        background: '#ffffff',
        textDark: '#0f172a',
        textMuted: '#64748b',
        border: '#cbd5e1',
        inputBg: '#f9fafad5',
        errorBg: '#fee2e2',
        errorText: '#ef4444',
        disabled: '#94a3b8',
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
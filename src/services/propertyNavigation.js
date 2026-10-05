import { guardarPropiedadVista } from './recentProperties';

export const abrirPropiedad = async (router, propiedad) => {
    await guardarPropiedadVista(propiedad.id);

    router.push(`/propiedad/${propiedad.id}`);
};
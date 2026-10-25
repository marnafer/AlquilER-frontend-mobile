import type { ApiResponse } from './api';

export type PropertyCategory = {
  id: number;
  nombre: string;
};

export type PropertyLocation = {
  id: number;
  nombre: string;
  codigo_postal: string;
  provincia_id: number;
};

export type PropertyService = {
  id: number;
  nombre: string;
  pivot?: {
    propiedad_id: number;
    servicio_id: number;
  };
};

export type PropertyImage = {
  id: number;
  propiedad_id?: number;
  ruta: string;
  descripcion?: string | null;
  es_principal: boolean | 0 | 1;
};

export type Property = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  expensas: number;
  direccion: string;
  cantidad_ambientes: number;
  cantidad_dormitorios: number;
  cantidad_banos: number;
  capacidad: number | null;
  acepta_mascotas: boolean;
  acepta_hijos: boolean;
  disponible: boolean;
  destacada: boolean;
  categoria_id: number;
  usuario_id: number;
  localidad_id: number;
  fecha_publicacion: string;
  requisitos_interesados: PropertyRequirements | null;
  imagen_url?: string | null;
  categoria?: PropertyCategory;
  localidad?: PropertyLocation;
  servicios?: PropertyService[];
  imagenes?: PropertyImage[];
  imagen_principal?: PropertyImage | null;
};
export type PropertyRequirements = {
  fecha_disponible_desde?: string | null;
  max_ocupantes?: number | string | null;
  garantias_aceptadas?: (
    | 'recibo_sueldo'
    | 'garantia_propietaria'
    | 'seguro_caucion'
    | 'garante'
  )[];
};
export type PropertyFilters = {
  categoria_id: string[];
  localidad_id: string[];
  servicio_id: string[];
  precio_min: string;
  precio_max: string;
  cantidad_ambientes: string;
  cantidad_dormitorios: string;
  cantidad_banos: string;
  capacidad: string;
  acepta_mascotas: string;
  acepta_hijos: string;
};
export type PropertyOrder =
  | 'antiguedad_desc'
  | 'antiguedad_asc'
  | 'precio_asc'
  | 'precio_desc';

export type PropertyCatalog<T> = {
  items: T[];
  total: number;
};

export type PropertySearchResult = PropertyCatalog<Property> & {
  pagination: {
    current_page: number;
    per_page: number;
    last_page: number;
  };
};

export type PropertyCatalogResponse<T> = ApiResponse<PropertyCatalog<T>>;
export type PropertySearchResponse = ApiResponse<PropertySearchResult>;
import type { ApiResponse } from './api';
import type { Property } from './property';

export type Favorite = {
  id: number;
  usuario_id: number;
  propiedad_id: number;
  propiedad: Property;
};

export type AddFavoriteRequest = {
  propiedad_id: number;
};

export type AddFavoriteResponseData = {
  propiedad_id: number;
  es_favorito: true;
};

export type FavoritesResponse = ApiResponse<Favorite[]>;
export type AddFavoriteResponse = ApiResponse<AddFavoriteResponseData>;
export type RemoveFavoriteResponse = ApiResponse<null>;
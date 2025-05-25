// types/gasStation.ts
export interface GasStation {
  id: number;
  opinet_id: string;
  name: string;
  brand?: {
    code: string;
    name: string;
  };
  gas_brand?: {
    code: string;
    name: string;
  };
  address?: string;
  phone?: string;
  type?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  prices?: {
    gasoline: number;
    premium_gasoline: number;
    diesel: number;
    lpg: number;
    updated_at?: Date;
  };
  is_lowest_price?: boolean;
}

export interface GasStationSearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  fuel?: string;
}

export interface GasStationSearchResponse {
  success: boolean;
  items: GasStation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search?: string;
    brand?: string;
    type?: string;
    fuel?: string;
    location?: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    sortBy: string;
    sortOrder: string;
  };
  stats: {
    total_in_radius?: number;
    lowest_price_count: number;
    lowest_price_stations: string[];
  };
}

export interface FuelType {
  value: string;
  label: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface SearchStats {
  total_in_radius: number;
  lowest_price_count: number;
  lowest_price_stations: readonly string[];
}

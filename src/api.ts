// Replace with your local machine IP if running on a physical phone with Expo Go
const API_BASE_URL = 'http://localhost:5000/api/v1';

export interface Kitchen {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  logoImage: string;
  address: string;
  city: string;
  type: 'RESTAURANT' | 'HOME_KITCHEN' | 'CLOUD_KITCHEN';
  cuisines: string;
  rating: number;
  ratingCount: number;
  priceForTwo: number;
  isOpen: boolean;
  acceptsPreOrders: boolean;
  acceptsInstantOrders: boolean;
  orderLeadTimeMinutes: number;
  maxBatchCapacity: number;
  hygieneScore: number;
  verifiedBadge: boolean;
  storyText?: string;
  distanceKm?: number;
  estimatedDeliveryMins?: number;
}

export const fetchNearbyKitchens = async (
  lat: number = 12.9304,
  lng: number = 77.6784,
  maxRadiusKm: number = 5,
  type?: string
): Promise<Kitchen[]> => {
  try {
    let url = `${API_BASE_URL}/kitchens?lat=${lat}&lng=${lng}&maxRadiusKm=${maxRadiusKm}`;
    if (type) {
      url += `&type=${type}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch kitchens:', error);
    return [];
  }
};

export const fetchKitchenDetails = async (id: string, lat?: number, lng?: number) => {
  try {
    let url = `${API_BASE_URL}/kitchens/${id}`;
    if (lat && lng) {
      url += `?lat=${lat}&lng=${lng}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch kitchen details:', error);
    return null;
  }
};

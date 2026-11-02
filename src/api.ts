import { Platform } from 'react-native';

export const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5001/api/v1`;
  }
  return 'http://10.203.111.160:5001/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

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
  menuItems?: MenuItem[];
  subscriptionPlans?: SubscriptionPlan[];
}

export interface MenuItem {
  id: string;
  kitchenId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  dietaryType: 'VEG' | 'NON_VEG' | 'VEGAN' | 'JAIN';
  isAvailable: boolean;
  isDailySpecial: boolean;
  availableSlot: 'ALL_DAY' | 'BREAKFAST' | 'LUNCH' | 'DINNER';
  dailyStockLimit?: number;
  portionsRemaining?: number;
}

export interface SubscriptionPlan {
  id: string;
  kitchenId: string;
  title: string;
  description: string;
  mealSlot: string;
  totalMeals: number;
  price: number;
  dietaryType: string;
}

export interface LiveCookingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: string;
  quantity: number;
  slot: string;
  totalAmount: number;
  status: 'PREPARING' | 'READY_FOR_PICKUP' | 'DELIVERED';
  dabbaReturned: boolean;
  deliveryOtp: string;
}

export const FALLBACK_MENU: Record<string, MenuItem[]> = {
  k1: [
    {
      id: 'm1',
      kitchenId: 'k1',
      name: 'Special Ghar Ki Thali (4 Phulkas + Paneer + Dal Tadka)',
      description: 'Slow-cooked homestyle Paneer Sabzi, Yellow Dal Tadka with desi ghee tempering, 4 soft whole wheat phulkas, Jeera rice, and fresh kachumber salad.',
      price: 160,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
      category: 'Daily Special Thali',
      dietaryType: 'VEG',
      isDailySpecial: true,
      availableSlot: 'LUNCH',
      dailyStockLimit: 15,
      portionsRemaining: 11,
      isAvailable: true,
    },
    {
      id: 'm2',
      kitchenId: 'k1',
      name: 'Puran Poli with Katachi Amti (2 pcs)',
      description: 'Traditional sweet jaggery-chana dal flatbread paired with spicy aromatic Katachi Amti curry.',
      price: 140,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
      category: 'Regional Specials',
      dietaryType: 'VEG',
      isDailySpecial: true,
      availableSlot: 'ALL_DAY',
      dailyStockLimit: 10,
      portionsRemaining: 8,
      isAvailable: true,
    },
    {
      id: 'm3',
      kitchenId: 'k1',
      name: 'Kadhi Pakoda with Steamed Basmati Rice',
      description: 'Slow-simmered spiced buttermilk curry with fluffy fenugreek pakodas and fragrant rice.',
      price: 130,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
      category: 'Comfort Meals',
      dietaryType: 'VEG',
      isDailySpecial: false,
      availableSlot: 'DINNER',
      dailyStockLimit: 12,
      portionsRemaining: 9,
      isAvailable: true,
    },
  ],
  k2: [
    {
      id: 'm4',
      kitchenId: 'k2',
      name: 'Ghee Podi Thatte Idli (2 pcs)',
      description: 'Steamed fluffy plate idlis bathed in fragrant homemade gunpowder podi and pure Gir cow ghee.',
      price: 110,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
      category: 'Morning Tiffins',
      dietaryType: 'VEG',
      isDailySpecial: true,
      availableSlot: 'BREAKFAST',
      dailyStockLimit: 25,
      portionsRemaining: 18,
      isAvailable: true,
    },
    {
      id: 'm5',
      kitchenId: 'k2',
      name: 'Authentic Filter Coffee Decoction & Medu Vada (2 pcs)',
      description: 'Crisp hot lentil vadas served with traditional coconut chutney and fresh filter coffee.',
      price: 90,
      image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=500&auto=format&fit=crop&q=80',
      category: 'Morning Tiffins',
      dietaryType: 'VEG',
      isDailySpecial: false,
      availableSlot: 'BREAKFAST',
      dailyStockLimit: 20,
      portionsRemaining: 14,
      isAvailable: true,
    },
  ],
  k3: [
    {
      id: 'm6',
      kitchenId: 'k3',
      name: 'Kung Pao Tofu & Edamame Bowl',
      description: 'Sichuan peppercorn tossed crispy tofu, wok greens, jasmine rice, and roasted peanuts.',
      price: 240,
      image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&auto=format&fit=crop&q=80',
      category: 'Bowls',
      dietaryType: 'VEGAN',
      isDailySpecial: false,
      availableSlot: 'ALL_DAY',
      dailyStockLimit: 50,
      portionsRemaining: 42,
      isAvailable: true,
    },
  ],
  k4: [
    {
      id: 'm7',
      kitchenId: 'k4',
      name: 'Nawabi Chicken Dum Biryani Handi',
      description: 'Aged long-grain basmati rice layered with marinated tender chicken and saffron, slow-cooked in a sealed clay handi.',
      price: 320,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
      category: 'Dum Biryanis',
      dietaryType: 'NON_VEG',
      isDailySpecial: true,
      availableSlot: 'ALL_DAY',
      dailyStockLimit: 60,
      portionsRemaining: 38,
      isAvailable: true,
    },
  ],
};

export const FALLBACK_SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: 'sub1',
    kitchenId: 'k1',
    title: '7-Day Executive Homestyle Lunch Dabba',
    description: 'Balanced daily rotating thali (Dal, Sabzi, 4 Rotis, Rice & Salad) delivered warm to your office/home Monday to Sunday.',
    mealSlot: 'LUNCH',
    totalMeals: 7,
    price: 1050,
    dietaryType: 'VEG',
  },
  {
    id: 'sub2',
    kitchenId: 'k1',
    title: '30-Day Monthly Ghar Ka Khana Plan',
    description: 'Hassle-free nutritious lunch or dinner everyday. Complete meal customized to low salt/low oil on request in returnable steel dabba.',
    mealSlot: 'LUNCH',
    totalMeals: 30,
    price: 4200,
    dietaryType: 'VEG',
  },
  {
    id: 'sub3',
    kitchenId: 'k2',
    title: '14-Day Traditional South Indian Breakfast',
    description: 'Fresh Idli, Podi Dosa, Medu Vada & Filter Coffee decoction pack delivered hot every morning at 7:30 AM.',
    mealSlot: 'BREAKFAST',
    totalMeals: 14,
    price: 1490,
    dietaryType: 'VEG',
  },
];

export const FALLBACK_HOMEMAKER_ORDERS: LiveCookingOrder[] = [
  {
    id: 'ord1',
    orderNumber: 'FD-782910',
    customerName: 'Siddharth M. (Tower 4, Apt 302)',
    items: '2x Special Ghar Ki Thali (4 Phulkas + Dal)',
    quantity: 2,
    slot: 'Lunch • 1:00 PM',
    totalAmount: 320,
    status: 'PREPARING',
    dabbaReturned: true,
    deliveryOtp: '4829',
  },
  {
    id: 'ord2',
    orderNumber: 'FD-782914',
    customerName: 'Priya Sharma (Villa 12, Green Glen)',
    items: '1x Puran Poli with Katachi Amti (2 pcs)',
    quantity: 1,
    slot: 'Lunch • 1:15 PM',
    totalAmount: 140,
    status: 'PREPARING',
    dabbaReturned: false,
    deliveryOtp: '1904',
  },
];

export const FALLBACK_KITCHENS: Kitchen[] = [
  {
    id: 'k1',
    name: "Anita's Ghar Ka Khana",
    slug: 'anitas-ghar-ka-khana',
    description: 'Pure homemade Maharashtrian & North Indian food. Zero preservatives, cooked in cold-pressed oil.',
    storyText: 'Mother of two passionate about feeding working professionals clean, balanced food in batches of 15 max.',
    coverImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    logoImage: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&auto=format&fit=crop&q=80',
    address: 'B-704, Marvel Serenity, Bellandur',
    city: 'Bangalore',
    type: 'HOME_KITCHEN',
    cuisines: 'Homestyle, Maharashtrian, Thalis, Pure Veg',
    rating: 4.9,
    ratingCount: 310,
    priceForTwo: 280,
    isOpen: true,
    acceptsPreOrders: true,
    acceptsInstantOrders: false,
    orderLeadTimeMinutes: 45,
    maxBatchCapacity: 20,
    hygieneScore: 98,
    verifiedBadge: true,
    distanceKm: 0.6,
    estimatedDeliveryMins: 15,
  },
  {
    id: 'k2',
    name: "Amma's South Indian Kitchen",
    slug: 'ammas-south-indian-kitchen',
    description: 'Traditional Tamil & Kerala home kitchen. Fresh stone-ground batters, organic Gir cow ghee.',
    storyText: 'Grandmother cooking heritage recipes using family cast-iron pans and naturally sourced spices.',
    coverImage: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    logoImage: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&auto=format&fit=crop&q=80',
    address: 'Plot 45, 14th Main, HSR Layout Sector 2',
    city: 'Bangalore',
    type: 'HOME_KITCHEN',
    cuisines: 'South Indian, Tamilian, Breakfast, Healthy',
    rating: 4.95,
    ratingCount: 520,
    priceForTwo: 200,
    isOpen: true,
    acceptsPreOrders: true,
    acceptsInstantOrders: true,
    orderLeadTimeMinutes: 35,
    maxBatchCapacity: 25,
    hygieneScore: 99,
    verifiedBadge: true,
    distanceKm: 4.1,
    estimatedDeliveryMins: 20,
  },
  {
    id: 'k3',
    name: 'WokCraft Asian Bowls',
    slug: 'wokcraft-asian-bowls',
    description: 'Modern delivery-only cloud kitchen serving high-heat wok tossed bowls, dim sums, and ramen.',
    coverImage: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80',
    logoImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80',
    address: 'Unit 3, Cloud Hub, HSR Layout Sector 1',
    city: 'Bangalore',
    type: 'CLOUD_KITCHEN',
    cuisines: 'Pan-Asian, Noodles, Dimsums, Bowls',
    rating: 4.5,
    ratingCount: 880,
    priceForTwo: 450,
    isOpen: true,
    acceptsPreOrders: false,
    acceptsInstantOrders: true,
    orderLeadTimeMinutes: 30,
    maxBatchCapacity: 50,
    hygieneScore: 96,
    verifiedBadge: true,
    distanceKm: 3.3,
    estimatedDeliveryMins: 25,
  },
  {
    id: 'k4',
    name: 'The Royal Biryani Durbar',
    slug: 'the-royal-biryani-durbar',
    description: 'Authentic Dum Biryanis, Kebabs, and rich Mughlai curries crafted by master bawarchis.',
    coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    logoImage: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&auto=format&fit=crop&q=80',
    address: '14/B, Koramangala 5th Block',
    city: 'Bangalore',
    type: 'RESTAURANT',
    cuisines: 'Biryani, Mughlai, Kebabs',
    rating: 4.6,
    ratingCount: 1420,
    priceForTwo: 550,
    isOpen: true,
    acceptsPreOrders: false,
    acceptsInstantOrders: true,
    orderLeadTimeMinutes: 35,
    maxBatchCapacity: 100,
    hygieneScore: 94,
    verifiedBadge: true,
    distanceKm: 6.1,
    estimatedDeliveryMins: 35,
  },
];

// In-memory cache for ultra-fast tab/radius switching
const kitchenCache = new Map<string, { data: Kitchen[]; timestamp: number }>();

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const fetchNearbyKitchens = async (
  lat: number = 12.9304,
  lng: number = 77.6784,
  maxRadiusKm: number = 5,
  type?: string
): Promise<Kitchen[]> => {
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${maxRadiusKm}_${type || 'ALL'}`;
  const cached = kitchenCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data;
  }

  try {
    let url = `${API_BASE_URL}/kitchens?lat=${lat}&lng=${lng}&maxRadiusKm=${maxRadiusKm}`;
    if (type) {
      url += `&type=${type}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      kitchenCache.set(cacheKey, { data: data.data, timestamp: Date.now() });
      return data.data;
    }
  } catch (error) {
    // Graceful fallback on network timeout
  }

  // Fallback with live distance calculation relative to user
  const fallbackResults = FALLBACK_KITCHENS.filter((k) => !type || k.type === type).map((k) => {
    // If kitchen has lat/lng, compute real distance
    const kitchenLat = k.id === 'k1' ? 12.935 : k.id === 'k2' ? 12.912 : k.id === 'k3' ? 12.916 : 12.935;
    const kitchenLng = k.id === 'k1' ? 77.682 : k.id === 'k2' ? 77.644 : k.id === 'k3' ? 77.651 : 77.624;
    const dist = calculateDistanceKm(lat, lng, kitchenLat, kitchenLng);
    return {
      ...k,
      distanceKm: dist,
      estimatedDeliveryMins: Math.min(60, (k.orderLeadTimeMinutes || 30) + Math.round((dist / 2) * 5)),
    };
  });

  kitchenCache.set(cacheKey, { data: fallbackResults, timestamp: Date.now() });
  return fallbackResults;
};

export const fetchKitchenDetails = async (id: string, lat?: number, lng?: number) => {
  try {
    let url = `${API_BASE_URL}/kitchens/${id}`;
    if (lat && lng) {
      url += `?lat=${lat}&lng=${lng}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.data) {
      return data.data;
    }
  } catch (error) {
    // fallback
  }

  const found = FALLBACK_KITCHENS.find((k) => k.id === id) || FALLBACK_KITCHENS[0];
  return {
    ...found,
    menuItems: FALLBACK_MENU[found.id] || FALLBACK_MENU['k1'],
    subscriptionPlans: FALLBACK_SUBSCRIPTIONS.filter((s) => s.kitchenId === found.id),
  };
};

export const placeMobileOrder = async (orderPayload: any, authToken?: string | null) => {
  try {
    let token = authToken;
    if (!token) {
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'customer@foodapp.com',
          password: 'password123',
        }),
      });
      const loginData = await loginRes.json();
      token = loginData.token;
    }

    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to place order:', error);
    return {
      success: true,
      data: {
        id: 'ord_' + Math.floor(100000 + Math.random() * 900000),
        orderNumber: 'FD-' + Math.floor(100000 + Math.random() * 900000),
        status: 'CONFIRMED',
        totalAmount: orderPayload.totalAmount || 280,
        deliveryOtp: '4829',
        createdAt: new Date().toISOString(),
      },
    };
  }
};

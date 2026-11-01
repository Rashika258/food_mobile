import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from './api';

export interface UserAddress {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'KITCHEN_OWNER' | 'DELIVERY_PARTNER' | 'ADMIN';
  avatar?: string;
  kitchen?: any;
  addresses?: UserAddress[];
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: 'CUSTOMER' | 'KITCHEN_OWNER' | 'DELIVERY_PARTNER';
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchDemoPersona: (
    personaKey: 'customer' | 'homemaker_anita' | 'homemaker_amma' | 'rider' | 'admin'
  ) => Promise<void>;
}

export const DEMO_PROFILES: Record<
  'customer' | 'homemaker_anita' | 'homemaker_amma' | 'rider' | 'admin',
  { email: string; user: AuthUser }
> = {
  customer: {
    email: 'customer@foodapp.com',
    user: {
      id: 'usr_customer_1',
      name: 'Rahul Sharma',
      email: 'customer@foodapp.com',
      phone: '+91 98765 43210',
      role: 'CUSTOMER',
      addresses: [
        {
          id: 'addr_1',
          label: 'Apartment',
          addressLine: 'Apt 402, Green Glen Layout, Bellandur',
          city: 'Bangalore',
          postalCode: '560103',
          isDefault: true,
        },
      ],
    },
  },
  homemaker_anita: {
    email: 'anita@foodapp.com',
    user: {
      id: 'usr_anita_2',
      name: 'Anita Deshmukh',
      email: 'anita@foodapp.com',
      phone: '+91 98123 45678',
      role: 'KITCHEN_OWNER',
      kitchen: {
        id: 'k1',
        name: "Anita's Ghar Ka Khana",
        cuisines: 'Homestyle, Maharashtrian, Thalis',
      },
    },
  },
  homemaker_amma: {
    email: 'meenakshi@foodapp.com',
    user: {
      id: 'usr_amma_3',
      name: 'Meenakshi Sundaram',
      email: 'meenakshi@foodapp.com',
      phone: '+91 98450 11223',
      role: 'KITCHEN_OWNER',
      kitchen: {
        id: 'k2',
        name: "Amma's South Indian Kitchen",
        cuisines: 'South Indian, Tiffins',
      },
    },
  },
  rider: {
    email: 'rider@foodapp.com',
    user: {
      id: 'usr_rider_4',
      name: 'Vikram Singh',
      email: 'rider@foodapp.com',
      phone: '+91 99887 76655',
      role: 'DELIVERY_PARTNER',
    },
  },
  admin: {
    email: 'admin@foodapp.com',
    user: {
      id: 'usr_admin_5',
      name: 'Platform Operations Admin',
      email: 'admin@foodapp.com',
      phone: '+91 90000 00001',
      role: 'ADMIN',
    },
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  switchDemoPersona: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(DEMO_PROFILES.customer.user);
  const [token, setToken] = useState<string | null>('demo_jwt_customer_token');
  const [loading, setLoading] = useState<boolean>(false);

  const login = async (
    email: string,
    password: string = 'password123'
  ): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        setUser(data.user);
        setToken(data.token);
        setLoading(false);
        return { success: true };
      }
      // If server returned error message
      if (!res.ok) {
        // Check if demo user matches
        const matched = Object.values(DEMO_PROFILES).find(
          (p) => p.email.toLowerCase() === email.toLowerCase()
        );
        if (matched) {
          setUser(matched.user);
          setToken(`demo_jwt_${matched.user.id}`);
          setLoading(false);
          return { success: true };
        }
        setLoading(false);
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (err: any) {
      // Backend not running / offline: check demo accounts or create session
      const matched = Object.values(DEMO_PROFILES).find(
        (p) => p.email.toLowerCase() === email.toLowerCase()
      );
      if (matched) {
        setUser(matched.user);
        setToken(`demo_jwt_${matched.user.id}`);
        setLoading(false);
        return { success: true };
      }
      // Allow generic login in offline demo mode
      const dummyUser: AuthUser = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        role: 'CUSTOMER',
      };
      setUser(dummyUser);
      setToken('demo_token_' + Date.now());
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, message: 'Login failed' };
  };

  const register = async (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: 'CUSTOMER' | 'KITCHEN_OWNER' | 'DELIVERY_PARTNER';
  }): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password || 'password123',
          phone: data.phone || '',
          role: data.role || 'CUSTOMER',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const resData = await res.json();
      if (res.ok && resData.token && resData.user) {
        setUser(resData.user);
        setToken(resData.token);
        setLoading(false);
        return { success: true };
      }
      if (!res.ok) {
        setLoading(false);
        return { success: false, message: resData.message || 'Registration failed' };
      }
    } catch (err) {
      // Offline fallback registration
      const newUser: AuthUser = {
        id: 'usr_' + Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role || 'CUSTOMER',
      };
      setUser(newUser);
      setToken('demo_token_' + Date.now());
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, message: 'Registration failed' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const switchDemoPersona = async (
    personaKey: 'customer' | 'homemaker_anita' | 'homemaker_amma' | 'rider' | 'admin'
  ) => {
    const demo = DEMO_PROFILES[personaKey];
    if (demo) {
      setUser(demo.user);
      setToken(`demo_jwt_${demo.user.id}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

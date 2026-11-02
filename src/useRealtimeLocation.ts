import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationState {
  coords: {
    latitude: number;
    longitude: number;
  };
  addressName: string;
  subAddress?: string;
  loadingLocation: boolean;
  permissionGranted: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

// Default fallback coordinates (Bellandur, Bangalore) if GPS is denied or unavailable
const DEFAULT_COORDS = {
  latitude: 12.9304,
  longitude: 77.6784,
};
const DEFAULT_ADDRESS = 'Bellandur, Bangalore';

// Helper to resolve human-readable neighborhood quickly
const resolveLocalArea = (lat: number, lng: number): { primary: string; secondary: string } => {
  if (lat >= 12.85 && lat <= 13.15 && lng >= 77.45 && lng <= 77.85) {
    if (lat > 12.96 && lng < 77.59) {
      return { primary: 'Rajajinagar / Central', secondary: 'Bangalore, Karnataka' };
    }
    if (lat >= 12.95 && lng >= 77.59 && lng < 77.65) {
      return { primary: 'Indiranagar / MG Road', secondary: 'Bangalore, Karnataka' };
    }
    if (lat <= 12.94 && lng >= 77.65) {
      return { primary: 'Bellandur Outer Ring Rd', secondary: 'Bangalore, Karnataka' };
    }
    if (lat <= 12.94 && lng < 77.65) {
      return { primary: 'Koramangala / HSR', secondary: 'Bangalore, Karnataka' };
    }
    return { primary: 'Bangalore Urban', secondary: 'Karnataka' };
  }
  return { primary: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, secondary: 'Live GPS Location' };
};

export function useRealtimeLocation(): LocationState {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(DEFAULT_COORDS);
  const [addressName, setAddressName] = useState<string>(DEFAULT_ADDRESS);
  const [subAddress, setSubAddress] = useState<string>('Bangalore, Karnataka');
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Race geocoding with 1200ms timeout to prevent UI lag
      const geocodePromise = Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      const timeoutPromise = new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error('Geocode timeout')), 1200)
      );

      const places = await Promise.race([geocodePromise, timeoutPromise]);

      if (places && places.length > 0) {
        const p = places[0];
        const primary =
          p.name ||
          p.street ||
          p.subregion ||
          p.district ||
          p.city ||
          'Current Location';
        const secondary = [p.subregion || p.district, p.city || p.region]
          .filter(Boolean)
          .join(', ');

        const formattedPrimary = `${primary}${p.city && primary !== p.city ? ', ' + p.city : ''}`;
        setAddressName(formattedPrimary || 'Current Location');
        if (secondary) setSubAddress(secondary);
        return;
      }
    } catch (err) {
      // Fallback quickly to local area resolver
    }
    const resolved = resolveLocalArea(lat, lng);
    setAddressName(resolved.primary);
    setSubAddress(resolved.secondary);
  };

  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setError('Location permission denied. Using default area.');
        setCoords(DEFAULT_COORDS);
        setAddressName(DEFAULT_ADDRESS);
        setLoadingLocation(false);
        return;
      }

      setPermissionGranted(true);

      // Get position with 2500ms timeout
      const posPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('GPS timeout')), 2500)
      );

      const position = await Promise.race([posPromise, timeoutPromise]);

      const newCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(newCoords);

      // Reverse geocode with timeout
      await reverseGeocode(newCoords.latitude, newCoords.longitude);
    } catch (err: any) {
      // Fast fallback to default coords or previous coords without freezing
      setError(null);
      const resolved = resolveLocalArea(coords.latitude, coords.longitude);
      setAddressName(resolved.primary);
      setSubAddress(resolved.secondary);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();

    // On Web, skip aggressive background watching to prevent constant GPS jitter refetches
    if (Platform.OS === 'web') {
      return;
    }

    // Start background watcher for native mobile device
    let isMounted = true;
    const startWatcher = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted' && isMounted) {
          watcherRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 300, // Update only if moved > 300 meters
              timeInterval: 30000, // Or every 30s
            },
            async (loc) => {
              if (!isMounted) return;
              const newCoords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              };
              setCoords(newCoords);
              await reverseGeocode(newCoords.latitude, newCoords.longitude);
            }
          );
        }
      } catch (e) {
        // Fallback gracefully
      }
    };

    startWatcher();

    return () => {
      isMounted = false;
      if (watcherRef.current) {
        watcherRef.current.remove();
      }
    };
  }, []);

  return {
    coords,
    addressName,
    subAddress,
    loadingLocation,
    permissionGranted,
    error,
    refreshLocation: fetchCurrentLocation,
  };
}

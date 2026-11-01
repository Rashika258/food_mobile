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

export function useRealtimeLocation(): LocationState {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(DEFAULT_COORDS);
  const [addressName, setAddressName] = useState<string>(DEFAULT_ADDRESS);
  const [subAddress, setSubAddress] = useState<string>('Bangalore, Karnataka');
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

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
      // Reverse geocoding failed, keep previous or default
    }
    setAddressName(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
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

      // Get accurate current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(newCoords);

      // Reverse geocode to human-friendly street / neighborhood
      await reverseGeocode(newCoords.latitude, newCoords.longitude);
    } catch (err: any) {
      setError(err?.message || 'Failed to get current location');
      setCoords(DEFAULT_COORDS);
      setAddressName(DEFAULT_ADDRESS);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();

    // Start background watcher for real-time location tracking
    let isMounted = true;
    const startWatcher = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted' && isMounted) {
          watcherRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 100, // Update if moved > 100 meters
              timeInterval: 15000, // Or every 15s
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

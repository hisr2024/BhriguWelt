/**
 * Offline city database for location lookup
 * Uses local data for 100% offline functionality
 */

export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

let citiesCache: City[] | null = null;

/**
 * Load cities from local JSON file
 */
export async function loadCities(): Promise<City[]> {
  if (citiesCache) {
    return citiesCache;
  }

  try {
    const response = await fetch('/data/cities.json');
    if (!response.ok) {
      throw new Error('Failed to load cities');
    }
    citiesCache = await response.json();
    return citiesCache || [];
  } catch (error) {
    console.error('Error loading cities:', error);
    return [];
  }
}

/**
 * Search cities by name (fuzzy search)
 */
export async function searchCities(query: string, limit: number = 10): Promise<City[]> {
  const cities = await loadCities();
  
  if (!query || query.trim().length === 0) {
    return cities.slice(0, limit);
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  // Score-based search
  const scored = cities.map((city) => {
    const cityName = city.name.toLowerCase();
    const countryName = city.country.toLowerCase();
    
    let score = 0;
    
    // Exact match
    if (cityName === normalizedQuery) {
      score += 100;
    }
    // Starts with query
    else if (cityName.startsWith(normalizedQuery)) {
      score += 50;
    }
    // Contains query
    else if (cityName.includes(normalizedQuery)) {
      score += 25;
    }
    
    // Country match (bonus)
    if (countryName.includes(normalizedQuery)) {
      score += 10;
    }
    
    // Boost popular cities (optional)
    const popularCities = ['mumbai', 'delhi', 'bangalore', 'new york', 'london', 'tokyo'];
    if (popularCities.includes(cityName)) {
      score += 5;
    }
    
    return { city, score };
  });
  
  // Filter and sort by score
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ city }) => city);
}

/**
 * Get city by exact name
 */
export async function getCityByName(name: string, country?: string): Promise<City | null> {
  const cities = await loadCities();
  
  const normalizedName = name.toLowerCase().trim();
  const normalizedCountry = country?.toLowerCase().trim();
  
  return cities.find((city) => {
    const matches = city.name.toLowerCase() === normalizedName;
    if (!normalizedCountry) {
      return matches;
    }
    return matches && city.country.toLowerCase() === normalizedCountry;
  }) || null;
}

/**
 * Get cities by country
 */
export async function getCitiesByCountry(country: string): Promise<City[]> {
  const cities = await loadCities();
  const normalizedCountry = country.toLowerCase().trim();
  
  return cities.filter((city) => city.country.toLowerCase() === normalizedCountry);
}

/**
 * Get nearest city to coordinates
 */
export async function getNearestCity(
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 100
): Promise<City | null> {
  const cities = await loadCities();
  
  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };
  
  // Find nearest city within max distance
  let nearestCity: City | null = null;
  let minDistance = maxDistanceKm;
  
  for (const city of cities) {
    const distance = calculateDistance(latitude, longitude, city.latitude, city.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }
  
  return nearestCity;
}

/**
 * Get all unique countries
 */
export async function getCountries(): Promise<string[]> {
  const cities = await loadCities();
  const countries = new Set(cities.map((city) => city.country));
  return Array.from(countries).sort();
}

/**
 * Seed cities into IndexedDB for faster access
 */
export async function seedCitiesDB(): Promise<void> {
  const cities = await loadCities();
  
  // Store in IndexedDB for offline access
  const dbName = 'BhriguWeltDB';
  const storeName = 'cities';
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => reject(new Error('Failed to open database'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: 'name' });
        store.createIndex('country', 'country', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing data
      store.clear();
      
      // Add all cities
      cities.forEach((city) => {
        store.add(city);
      });
      
      transaction.oncomplete = () => {
        console.log(`[Cities] Seeded ${cities.length} cities into IndexedDB`);
        resolve();
      };
      
      transaction.onerror = () => reject(new Error('Failed to seed cities'));
    };
  });
}

/**
 * React hook for city search with debouncing
 */
import { useState, useEffect } from 'react';

export function useCitySearch(query: string, debounceMs: number = 300) {
  const [results, setResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const cities = await searchCities(query, 10);
        setResults(cities);
      } catch (error) {
        console.error('Error searching cities:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [query, debounceMs]);

  return { results, isLoading };
}

/**
 * Get user's current location (requires permission)
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      }
    );
  });
}

/**
 * Get nearest city to user's current location
 */
export async function getNearestCityToUser(): Promise<City | null> {
  const location = await getCurrentLocation();
  if (!location) {
    return null;
  }

  return getNearestCity(location.latitude, location.longitude);
}

import { useCallback, useEffect, useRef, useState } from "react";

export type LocationPermissionState =
  | "unknown"
  | "unsupported"
  | "prompt"
  | "granted"
  | "denied";

export interface DetectedLocation {
  label: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "US". Empty string if it couldn't be resolved. */
  country: string;
  latitude: number;
  longitude: number;
}

interface UseDeviceLocationResult {
  /** The most recent successfully detected location, or null if none. */
  detectedLocation: DetectedLocation | null;
  /** Current browser/OS geolocation permission state. */
  permissionState: LocationPermissionState;
  /** True while a detection request is in flight. */
  isDetecting: boolean;
  /** Human readable error from the most recent failed attempt, if any. */
  error: string | null;
  /** Manually (re-)trigger a detection attempt. */
  detect: () => void;
}

/**
 * Reverse-geocodes coordinates into a human readable "City, Region" string.
 * Falls back to raw coordinates if the lookup fails, so the caller always
 * gets *some* usable label to lock the field to once permission is granted.
 */
async function reverseGeocode(lat: number, lon: number): Promise<{ label: string; country: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("Reverse geocoding request failed");
    const data = await res.json();
    const addr = data?.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.suburb;
    const region = addr.state || addr.region || addr.country;
    const country = String(addr.country_code || "").toUpperCase();
    const label = [city, region].filter(Boolean).join(", ");
    return { label: label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`, country };
  } catch {
    return { label: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, country: "" };
  }
}

/**
 * Detects the user's current location via the device's geolocation
 * permission, re-checking whenever that permission changes. Callers should
 * treat `detectedLocation` as the single source of truth for a "locked"
 * location field — see ProfileSetup's location step for the usage pattern.
 */
export function useDeviceLocation(): UseDeviceLocationResult {
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>("unknown");
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const detect = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermissionState("unsupported");
      setError("Location detection isn't supported on this device.");
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { label, country } = await reverseGeocode(latitude, longitude);
        // Ignore stale responses from a request that's been superseded.
        if (requestId !== requestIdRef.current) return;
        setDetectedLocation({ label, country, latitude, longitude });
        setPermissionState("granted");
        setIsDetecting(false);
      },
      (geoError) => {
        if (requestId !== requestIdRef.current) return;
        setIsDetecting(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermissionState("denied");
          setDetectedLocation(null);
          setError("Location permission denied.");
        } else {
          setError("Couldn't detect your location. Please try again.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Watch the Permissions API (where supported) so the app reacts when the
  // user grants/revokes location access from browser or device settings,
  // without requiring another manual trigger.
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (!permissionStatus) return;
      const state = permissionStatus.state as LocationPermissionState;
      setPermissionState(state);
      if (state === "granted") {
        detect();
      } else if (state === "denied") {
        setDetectedLocation(null);
      }
    };

    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          permissionStatus = status;
          setPermissionState(status.state as LocationPermissionState);
          status.addEventListener("change", handleChange);
          if (status.state === "granted") {
            detect();
          }
        })
        .catch(() => {
          // Permissions API not fully supported here; the caller can still
          // trigger `detect()` on demand, which will surface the native
          // permission prompt itself.
          setPermissionState("prompt");
        });
    } else {
      setPermissionState(
        typeof navigator !== "undefined" && navigator.geolocation ? "prompt" : "unsupported"
      );
    }

    return () => {
      permissionStatus?.removeEventListener("change", handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { detectedLocation, permissionState, isDetecting, error, detect };
}

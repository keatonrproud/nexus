import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Mobile utility functions for Capacitor features
 */

// Device detection
export const isMobile = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === "ios";
export const isAndroid = () => Capacitor.getPlatform() === "android";
export const isWeb = () => Capacitor.getPlatform() === "web";

// Camera functions
export const takePicture = async () => {
  if (!isMobile()) {
    console.warn("Camera not available in web browser");
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
    return image;
  } catch (error) {
    console.error("Error taking picture:", error);
    throw error;
  }
};

export const selectFromGallery = async () => {
  if (!isMobile()) {
    console.warn("Gallery not available in web browser");
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });
    return image;
  } catch (error) {
    console.error("Error selecting from gallery:", error);
    throw error;
  }
};

// Geolocation functions
export const getCurrentLocation = async (options = {}) => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      ...options,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    throw error;
  }
};

export const watchLocation = (
  callback: (position: any) => void,
  options = {},
) => {
  const watchId = Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 10000,
      ...options,
    },
    callback,
  );
  return watchId;
};

export const clearLocationWatch = (watchId: string) => {
  Geolocation.clearWatch({ id: watchId });
};

// Status bar functions
export const setStatusBarStyle = (style: "light" | "dark") => {
  if (isMobile()) {
    StatusBar.setStyle({
      style: style === "light" ? Style.Light : Style.Dark,
    });
  }
};

export const setStatusBarColor = (color: string) => {
  if (isAndroid()) {
    StatusBar.setBackgroundColor({ color });
  }
};

// Share functionality (if you want to add sharing)
export const shareContent = async (
  title: string,
  text: string,
  url?: string,
) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
    } catch (error) {
      console.error("Error sharing content:", error);
    }
  } else {
    // Fallback for web
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(
        `${title}\n${text}${url ? "\n" + url : ""}`,
      );
      alert("Content copied to clipboard!");
    }
  }
};

// Haptic feedback (you might want to add @capacitor/haptics)
export const hapticFeedback = (
  type: "light" | "medium" | "heavy" = "light",
) => {
  if (isMobile() && "vibrate" in navigator) {
    const duration = type === "light" ? 50 : type === "medium" ? 100 : 200;
    navigator.vibrate(duration);
  }
};

// Network status
export const getNetworkStatus = () => {
  return {
    online: navigator.onLine,
    connection: (navigator as any)?.connection?.effectiveType || "unknown",
  };
};

// Device info
export const getDeviceInfo = () => {
  return {
    platform: Capacitor.getPlatform(),
    isNative: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
  };
};

export default {
  // Device detection
  isMobile,
  isIOS,
  isAndroid,
  isWeb,

  // Camera
  takePicture,
  selectFromGallery,

  // Location
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,

  // Status bar
  setStatusBarStyle,
  setStatusBarColor,

  // Utilities
  shareContent,
  hapticFeedback,
  getNetworkStatus,
  getDeviceInfo,
};

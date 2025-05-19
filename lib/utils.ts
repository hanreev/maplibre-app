import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cast<T>(value: unknown) {
  return value as T;
}

export function metersPerPixel(latitude: number, zoomLevel: number) {
  const earthCircumference = 40_075_016.686; // meters
  const latitudeRadians = latitude * (Math.PI / 180);
  return (earthCircumference * Math.cos(latitudeRadians)) / Math.pow(2, zoomLevel + 8);
}

export function meterToPixel(latitude: number, meters: number, zoomLevel: number) {
  return meters / metersPerPixel(latitude, zoomLevel);
}

import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface Coordenadas {
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocalizacionService {
  async obtenerPosicion(): Promise<Coordenadas> {
    if (!Capacitor.isNativePlatform()) {
      return this.obtenerPosicionWeb();
    }

    try {
      const permiso = await Geolocation.checkPermissions();
      if (permiso.location !== 'granted') {
        const solicitado = await Geolocation.requestPermissions();
        if (solicitado.location !== 'granted') throw new Error('Permiso de ubicación rechazado');
      }
      const posicion = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      return { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
    } catch (error) {
      throw error;
    }
  }

  async iniciarSeguimiento(onChange: (posicion: Coordenadas) => void): Promise<() => Promise<void>> {
    if (Capacitor.isNativePlatform()) {
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000 },
        (posicion, error) => {
          if (error || !posicion) return;
          onChange({ lat: posicion.coords.latitude, lng: posicion.coords.longitude });
        }
      );

      return () => Geolocation.clearWatch({ id });
    }

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      return () => Promise.resolve();
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return () => Promise.resolve();
    }

    const id = navigator.geolocation.watchPosition(
      (posicion) => onChange({ lat: posicion.coords.latitude, lng: posicion.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return async () => navigator.geolocation.clearWatch(id);
  }

  private obtenerPosicionWeb(): Promise<Coordenadas> {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      return Promise.reject(new Error('La ubicación web requiere HTTPS o localhost'));
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return Promise.reject(new Error('Este navegador no soporta geolocalización'));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (posicion) => resolve({ lat: posicion.coords.latitude, lng: posicion.coords.longitude }),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }
}

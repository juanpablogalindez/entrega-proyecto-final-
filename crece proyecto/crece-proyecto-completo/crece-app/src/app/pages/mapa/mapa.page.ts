import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import * as L from 'leaflet';
import { Negocio } from '../../core/models';
import { NegociosService } from '../../core/services/negocios.service';
import { Coordenadas, GeolocalizacionService } from '../../core/services/geolocalizacion.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './mapa.page.html',
  styleUrl: './mapa.page.scss'
})
export class MapaPage implements OnInit, OnDestroy {
  private negociosService = inject(NegociosService);
  private geo = inject(GeolocalizacionService);
  private toast = inject(ToastController);
  private mapa: L.Map | null = null;
  private marcadores: L.Marker[] = [];
  private detenerSeguimiento?: () => Promise<void>;
  private iconoNegocio = L.divIcon({
    className: 'crece-business-marker-icon',
    html: '<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true"><path d="M16 1C7.8 1 1.5 7.3 1.5 15.2 1.5 25.4 16 39 16 39s14.5-13.6 14.5-23.8C30.5 7.3 24.2 1 16 1Z" fill="#0f6e56" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="#d84315" stroke="#fff" stroke-width="2"/></svg>',
    iconSize: [32, 40],
    iconAnchor: [16, 39],
    popupAnchor: [0, -36]
  });

  negocios: Negocio[] = [];
  posicion: Coordenadas | null = null;

  async ngOnInit() {
    await this.activarUbicacion(false);
    this.cargarNegocios();
    setTimeout(() => this.inicializarMapa(), 0);
    this.detenerSeguimiento = await this.geo.iniciarSeguimiento((posicion) => {
      const cambioDePosicion = !this.posicion
        || Math.abs(this.posicion.lat - posicion.lat) > 0.00001
        || Math.abs(this.posicion.lng - posicion.lng) > 0.00001;
      if (!cambioDePosicion) return;

      this.posicion = posicion;
      this.mapa?.setView([posicion.lat, posicion.lng], this.mapa.getZoom());
      this.cargarNegocios();
    });
  }

  async activarUbicacion(mostrarAviso = true) {
    try {
      this.posicion = await this.geo.obtenerPosicion();
      if (this.mapa) {
        this.mapa.setView([this.posicion.lat, this.posicion.lng], 14);
      }
      this.cargarNegocios();
    } catch {
      if (!mostrarAviso) return;
      const aviso = await this.toast.create({
        message: 'Permite la ubicación en Google o Safari. En iPhone por Wi-Fi necesitas HTTPS.',
        duration: 4500,
        color: 'warning'
      });
      await aviso.present();
    }
  }

  ngOnDestroy() {
    void this.detenerSeguimiento?.();
    this.mapa?.remove();
  }

  private cargarNegocios() {
    const filtros = this.posicion ? { lat: this.posicion.lat, lng: this.posicion.lng, radio: 30 } : {};
    this.negociosService.buscar(filtros).subscribe((lista) => {
      this.negocios = lista;
      this.actualizarMarcadores();
    });
  }

  private inicializarMapa() {
    const elemento = document.getElementById('mapa-principal');
    if (!elemento || this.mapa) return;
    const centro = this.posicion ? [this.posicion.lat, this.posicion.lng] as [number, number] : [2.9273, -75.2819] as [number, number];
    this.mapa = L.map(elemento).setView(centro, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(this.mapa);
    if (this.posicion) L.circleMarker([this.posicion.lat, this.posicion.lng], { radius: 8, color: '#ff5500', fillColor: '#ff7a1a', fillOpacity: 0.9 }).addTo(this.mapa).bindPopup('Tu ubicación');
    this.actualizarMarcadores();
  }

  private actualizarMarcadores() {
    if (!this.mapa) return;
    this.marcadores.forEach((marcador) => marcador.remove());
    this.marcadores = [];
    for (const negocio of this.negocios) {
      if (negocio.latitud == null || negocio.longitud == null) continue;
      const latitud = Number(negocio.latitud);
      const longitud = Number(negocio.longitud);
      if (!Number.isFinite(latitud) || !Number.isFinite(longitud)
        || latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) continue;

      const marcador = L.marker([latitud, longitud], {
        icon: this.iconoNegocio,
        title: negocio.nombre_negocio,
        alt: `Ubicación de ${negocio.nombre_negocio}`
      })
        .addTo(this.mapa)
        .bindPopup(`<strong>${negocio.nombre_negocio}</strong><br>${negocio.categoria_nombre || ''}`);
      this.marcadores.push(marcador);
    }

    if (!this.posicion && this.marcadores.length) {
      const limites = L.featureGroup(this.marcadores).getBounds();
      if (limites.isValid()) this.mapa.fitBounds(limites.pad(0.15), { maxZoom: 14 });
    }
  }

  centrarNegocio(negocio: Negocio) {
    if (negocio.latitud == null || negocio.longitud == null || !this.mapa) return;
    this.mapa.setView([Number(negocio.latitud), Number(negocio.longitud)], 16);
  }
}

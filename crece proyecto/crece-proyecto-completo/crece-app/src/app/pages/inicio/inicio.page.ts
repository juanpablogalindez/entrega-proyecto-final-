import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import * as L from 'leaflet';
import { Categoria, Negocio } from '../../core/models';
import { FavoritosService } from '../../core/services/favoritos.service';
import { NegociosService } from '../../core/services/negocios.service';
import { Coordenadas, GeolocalizacionService } from '../../core/services/geolocalizacion.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterLink],
  templateUrl: './inicio.page.html'
})
export class InicioPage implements OnInit, OnDestroy {
  private negociosService = inject(NegociosService);
  favoritos = inject(FavoritosService);
  private geo = inject(GeolocalizacionService);
  private toast = inject(ToastController);

  negocios = signal<Negocio[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);

  texto = '';
  categoriaSeleccionada: number | null = null;
  radio = 5;
  usarCercania = false;
  filtrosAbiertos = false;
  vista: 'lista' | 'mapa' = 'lista';
  private posicion: Coordenadas | null = null;
  private mapa: L.Map | null = null;
  private marcadores: L.Marker[] = [];
  private temporizador?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.negociosService.categorias().subscribe((lista) => this.categorias.set(lista));
    this.buscar();
    this.temporizador = setInterval(() => this.buscar(), 30000);
  }

  ngOnDestroy() {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  async alternarCercania() {
    if (this.usarCercania && !this.posicion) {
      try {
        this.posicion = await this.geo.obtenerPosicion();
      } catch {
        this.usarCercania = false;
        const aviso = await this.toast.create({
          message: 'Activa el permiso de ubicación para buscar negocios cerca de ti.',
          duration: 3000,
          color: 'warning'
        });
        await aviso.present();
      }
    }
    this.buscar();
  }

  seleccionarCategoria(categoriaId: number) {
    this.categoriaSeleccionada = categoriaId;
    this.vista = 'lista';
    this.buscar();
  }

  verTodas() {
    this.categoriaSeleccionada = null;
    this.vista = 'lista';
    this.buscar();
  }

  alternarFavorito(evento: Event, negocio: Negocio) {
    evento.stopPropagation();
    evento.preventDefault();
    this.favoritos.alternar(negocio);
  }

  aplicarFiltros() {
    this.filtrosAbiertos = false;
    this.buscar();
  }

  limpiarFiltros() {
    this.texto = '';
    this.categoriaSeleccionada = null;
    this.usarCercania = false;
    this.radio = 5;
    this.filtrosAbiertos = false;
    this.buscar();
  }

  buscar() {
    this.cargando.set(true);

    const filtros: Record<string, unknown> = {
      q: this.texto || undefined,
      categoria_id: this.categoriaSeleccionada ?? undefined
    };

    if (this.usarCercania && this.posicion) {
      filtros['lat'] = this.posicion.lat;
      filtros['lng'] = this.posicion.lng;
      filtros['radio'] = this.radio;
    }

    this.negociosService.buscar(filtros).subscribe({
      next: (lista) => {
        this.negocios.set(lista);
        this.cargando.set(false);
        setTimeout(() => this.actualizarMapa(), 0);
      },
      error: () => this.cargando.set(false)
    });
  }

  cambiarVista(vista: string | number | null | undefined) {
    const valor = typeof vista === 'string' ? vista : 'lista';
    this.vista = valor === 'mapa' ? 'mapa' : 'lista';
    setTimeout(() => this.actualizarMapa(), 150);
  }

  private inicializarMapa() {
    const contenedor = document.getElementById('mapa-negocios');
    if (!contenedor || this.mapa) return;

    const centro = this.posicion
      ? [this.posicion.lat, this.posicion.lng] as [number, number]
      : [2.9273, -75.2819] as [number, number];
    this.mapa = L.map('mapa-negocios', { zoomControl: true }).setView(centro, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapa);
  }

  private actualizarMapa() {
    this.inicializarMapa();
    if (!this.mapa) return;

    this.marcadores.forEach((marcador) => this.mapa?.removeLayer(marcador));
    this.marcadores = [];

    const negociosConCoordenadas = this.negocios().filter(
      (negocio) => negocio.latitud != null && negocio.longitud != null
    );

    if (!negociosConCoordenadas.length) return;

    const coordenadas = negociosConCoordenadas.map((negocio) => [
      Number(negocio.latitud),
      Number(negocio.longitud)
    ] as [number, number]);

    for (const negocio of negociosConCoordenadas) {
      const marcador = L.marker([Number(negocio.latitud), Number(negocio.longitud)])
        .addTo(this.mapa!);
      marcador.bindPopup(`<strong>${negocio.nombre_negocio}</strong><br>${negocio.categoria_nombre ?? 'Negocio'}`);
      this.marcadores.push(marcador);
    }

    const bounds = L.latLngBounds(coordenadas);
    this.mapa.fitBounds(bounds, { padding: [24, 24] });
  }

  refrescar(evento: CustomEvent) {
    this.buscar();
    setTimeout(() => (evento.target as HTMLIonRefresherElement).complete(), 800);
  }

  estrellas(promedio: number = 0): string {
    const llenas = Math.round(promedio);
    return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
  }

  imagenUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.includes('/uploads/')) {
      return new URL(url, window.location.origin).pathname;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.replace(/^https?:\/\/localhost(?::\d+)?/, window.location.origin);
    }
    return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
  }
}

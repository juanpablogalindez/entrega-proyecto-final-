import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Notificacion, NotificacionesService } from '../../core/services/notificaciones.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-fab class="notification-fab" slot="fixed" vertical="top" horizontal="end">
      <ion-fab-button size="small" (click)="abrirNotificaciones()" aria-label="Notificaciones">
        <ion-icon name="notifications-outline"></ion-icon>
        <ion-badge *ngIf="noLeidas() > 0">{{ noLeidas() }}</ion-badge>
      </ion-fab-button>
    </ion-fab>

    <ion-modal class="notification-modal" [isOpen]="notificacionesAbiertas()"
               (didDismiss)="notificacionesAbiertas.set(false)">
      <ng-template>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Notificaciones</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="notificacionesAbiertas.set(false)" aria-label="Cerrar notificaciones">
                <ion-icon name="close-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="notification-modal-content">
          <ion-list class="notification-list" lines="full">
            <ion-item *ngFor="let notificacion of notificaciones()" button
                      (click)="abrirNotificacion(notificacion)">
              <ion-icon slot="start"
                        [name]="notificacion.tipo === 'factura' ? 'receipt-outline' :
                          notificacion.tipo.startsWith('pedido') ? 'cart-outline' :
                          notificacion.tipo === 'reseña' ? 'star-outline' : 'notifications-outline'"></ion-icon>
              <ion-label class="notification-label">
                <h3>{{ notificacion.titulo }}</h3>
                <p>{{ notificacion.mensaje }}</p>
                <small>{{ notificacion.fecha | date:'short' }}</small>
              </ion-label>
            </ion-item>
            <ion-item *ngIf="notificaciones().length === 0" lines="none">
              <ion-label class="ion-text-center">No tienes notificaciones nuevas.</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ng-template>
    </ion-modal>

    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="mapa">
          <ion-icon name="map-outline"></ion-icon>
          <ion-label>Mapa</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="favoritos">
          <ion-icon name="heart-outline"></ion-icon>
          <ion-label>Favoritos</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="capacitacion">
          <ion-icon name="school-outline"></ion-icon>
          <ion-label>Mis cursos</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="mi-negocio" *ngIf="auth.esNegocio()">
          <ion-icon name="storefront-outline"></ion-icon>
          <ion-label>Mi negocio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="admin" *ngIf="auth.esAdmin()">
          <ion-icon name="shield-checkmark-outline"></ion-icon>
          <ion-label>Administrar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="perfil">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `
})
export class TabsPage implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private notificacionesService = inject(NotificacionesService);
  private toast = inject(ToastController);
  notificaciones = signal<Notificacion[]>([]);
  notificacionesAbiertas = signal(false);
  noLeidas = signal(0);
  private temporizador?: ReturnType<typeof setInterval>;
  private idsNotificacionesConocidas = new Set<string>();
  private notificacionesInicializadas = false;

  ngOnInit() {
    this.cargarNotificaciones();
    this.temporizador = setInterval(() => this.cargarNotificaciones(), 5000);
  }

  ngOnDestroy() {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  abrirNotificaciones() {
    this.notificacionesAbiertas.set(true);
    const ids = this.notificaciones().map((notificacion) => notificacion.id);
    localStorage.setItem(this.claveLeidas(), JSON.stringify(ids));
    this.noLeidas.set(0);
  }

  abrirNotificacion(notificacion: Notificacion) {
    this.notificacionesAbiertas.set(false);
    this.router.navigateByUrl(notificacion.ruta);
  }

  private cargarNotificaciones() {
    if (!this.auth.estaAutenticado()) return;
    this.notificacionesService.listar().subscribe({
      next: async (lista) => {
        const leidas = this.leidas();
        const nuevasActualizaciones = this.notificacionesInicializadas
          ? lista.filter((notificacion) =>
              (notificacion.tipo === 'pedido-confirmado' ||
                notificacion.tipo === 'pedido-entregado' ||
                notificacion.tipo === 'factura' ||
                notificacion.tipo === 'negocio-verificado') &&
              !this.idsNotificacionesConocidas.has(notificacion.id)
            )
          : lista.filter((notificacion) =>
              notificacion.tipo === 'factura' && !leidas.includes(notificacion.id)
            );
        lista.forEach((notificacion) => this.idsNotificacionesConocidas.add(notificacion.id));
        this.notificacionesInicializadas = true;
        this.notificaciones.set(lista);
        this.noLeidas.set(lista.filter((notificacion) => !leidas.includes(notificacion.id)).length);

        const actualizacion = nuevasActualizaciones[0];
        if (actualizacion) {
          const aviso = await this.toast.create({
            header: actualizacion.titulo,
            message: actualizacion.mensaje,
            icon: 'checkmark-circle-outline',
            color: 'success',
            duration: 6000,
            position: 'top'
          });
          await aviso.present();
        }
      }
    });
  }

  private claveLeidas() {
    return `crece_notificaciones_leidas_${this.auth.usuario()?.id || 'anonimo'}`;
  }

  private leidas(): string[] {
    const guardadas = localStorage.getItem(this.claveLeidas());
    return guardadas ? JSON.parse(guardadas) : [];
  }
}

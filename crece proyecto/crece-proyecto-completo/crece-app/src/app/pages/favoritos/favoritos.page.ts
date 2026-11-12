import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FavoritosService } from '../../core/services/favoritos.service';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Favoritos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list *ngIf="favoritos.negocios().length; else sinFavoritos">
        <ion-item *ngFor="let negocio of favoritos.negocios()" [routerLink]="['/negocio', negocio.id]">
          <ion-thumbnail slot="start" *ngIf="negocio.logo_url">
            <img [src]="imagenUrl(negocio.logo_url)" [alt]="negocio.nombre_negocio" />
          </ion-thumbnail>
          <ion-label>
            <h2>{{ negocio.nombre_negocio }}</h2>
            <p>{{ negocio.categoria_nombre || 'Negocio' }}</p>
          </ion-label>
          <ion-button slot="end" fill="clear" color="danger"
                      [attr.aria-label]="'Quitar ' + negocio.nombre_negocio + ' de favoritos'"
                      (click)="quitar($event, negocio.id)">
            <ion-icon name="heart"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <ng-template #sinFavoritos>
        <section class="favorites-empty ion-text-center ion-padding">
          <ion-icon name="heart-outline" aria-hidden="true"></ion-icon>
          <h2>Aún no tienes favoritos</h2>
          <p>Guarda tus negocios preferidos y aparecerán aquí.</p>
          <ion-button routerLink="/tabs/inicio">Explorar negocios</ion-button>
        </section>
      </ng-template>
    </ion-content>
  `,
  styles: [`
    .favorites-empty { padding-top: 25vh; color: #64736e; }
    .favorites-empty ion-icon { font-size: 48px; color: #0f6e56; }
    .favorites-empty h2 { color: #19352e; font-size: 18px; }
  `]
})
export class FavoritosPage {
  favoritos = inject(FavoritosService);

  quitar(evento: Event, negocioId: number): void {
    evento.stopPropagation();
    evento.preventDefault();
    this.favoritos.quitar(negocioId);
  }

  imagenUrl(url: string): string {
    if (url.includes('/uploads/')) {
      return new URL(url, window.location.origin).pathname;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.replace(/^https?:\/\/localhost(?::\d+)?/, window.location.origin);
    }
    return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { Factura } from '../../core/models';
import { FacturasService } from '../../core/services/facturas.service';

@Component({
  selector: 'app-factura-detalle',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Factura</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ng-container *ngIf="factura() as factura; else estado">
        <ion-card class="invoice-detail-card">
          <ion-card-header>
            <ion-card-subtitle>Factura emitida</ion-card-subtitle>
            <ion-card-title>{{ factura.numero_factura }}</ion-card-title>
            <ion-badge [color]="colorEstado(factura.estado)">{{ factura.estado | titlecase }}</ion-badge>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Cliente:</strong> {{ factura.cliente_nombre || 'Consumidor final' }}</p>
            <p><strong>Fecha:</strong> {{ factura.fecha_emision | date:'medium' }}</p>
            <p><strong>Método de pago:</strong> {{ factura.metodo_pago | titlecase }}</p>

            <ion-list lines="full" *ngIf="factura.detalle?.length">
              <ion-list-header><ion-label>Detalle</ion-label></ion-list-header>
              <ion-item *ngFor="let item of factura.detalle">
                <ion-label>
                  <h3>{{ item.descripcion_item }}</h3>
                  <p>{{ item.cantidad }} x {{ item.precio_unitario | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                </ion-label>
                <ion-note slot="end">{{ item.subtotal_linea | currency:'COP':'symbol-narrow':'1.0-0' }}</ion-note>
              </ion-item>
            </ion-list>

            <div class="invoice-totals">
              <p>Subtotal <strong>{{ factura.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</strong></p>
              <p>Impuestos <strong>{{ factura.impuestos | currency:'COP':'symbol-narrow':'1.0-0' }}</strong></p>
              <p class="invoice-total">Total <strong>{{ factura.total | currency:'COP':'symbol-narrow':'1.0-0' }}</strong></p>
            </div>

            <ion-button *ngIf="factura.estado === 'pendiente'" expand="block" class="invoice-pay-button"
                        (click)="pagarFactura(factura)" [disabled]="pagando">
              <ion-icon slot="start" name="card-outline"></ion-icon>
              {{ pagando ? 'Procesando pago...' : 'Pagar factura' }}
            </ion-button>
            <ion-note class="invoice-paid-note" color="success" *ngIf="factura.estado === 'pagada'">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              Esta factura ya está pagada.
            </ion-note>
          </ion-card-content>
        </ion-card>
      </ng-container>

      <ng-template #estado>
        <div class="ion-text-center ion-padding">
          <ion-spinner *ngIf="cargando"></ion-spinner>
          <p *ngIf="!cargando">{{ mensaje }}</p>
          <ion-button *ngIf="!cargando" routerLink="/tabs/inicio">Volver al inicio</ion-button>
        </div>
      </ng-template>
    </ion-content>
  `
})
export class FacturaDetallePage implements OnInit {
  private ruta = inject(ActivatedRoute);
  private facturasService = inject(FacturasService);
  private toast = inject(ToastController);

  factura = signal<Factura | null>(null);
  cargando = true;
  mensaje = 'Cargando factura...';
  pagando = false;

  ngOnInit() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.facturasService.obtener(id).subscribe({
      next: (factura) => {
        this.factura.set(factura);
        this.cargando = false;
      },
      error: async (error) => {
        this.cargando = false;
        this.mensaje = error?.error?.mensaje || 'No fue posible cargar la factura';
        const aviso = await this.toast.create({ message: this.mensaje, duration: 2500, color: 'danger' });
        await aviso.present();
      }
    });
  }

  colorEstado(estado: string) {
    return estado === 'pagada' ? 'success' : estado === 'anulada' ? 'medium' : 'warning';
  }

  async pagarFactura(factura: Factura) {
    this.pagando = true;
    this.facturasService.pagar(factura.id).subscribe({
      next: async () => {
        this.pagando = false;
        this.factura.set({ ...factura, estado: 'pagada' });
        const aviso = await this.toast.create({
          message: 'Pago registrado correctamente',
          duration: 2200,
          color: 'success'
        });
        await aviso.present();
      },
      error: async (error) => {
        this.pagando = false;
        const aviso = await this.toast.create({
          message: error?.error?.mensaje || 'No fue posible registrar el pago',
          duration: 2500,
          color: 'danger'
        });
        await aviso.present();
      }
    });
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { Factura, ItemFactura, ProductoServicio } from '../../core/models';
import { FacturasService } from '../../core/services/facturas.service';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './facturacion.page.html'
})
export class FacturacionPage implements OnInit {
  private ruta = inject(ActivatedRoute);
  private facturasService = inject(FacturasService);
  private productosService = inject(ProductosService);
  private toast = inject(ToastController);

  negocioId!: number;
  seccion: 'nueva' | 'historial' = 'nueva';

  catalogo = signal<ProductoServicio[]>([]);
  facturas = signal<Factura[]>([]);
  items = signal<ItemFactura[]>([]);

  clienteNombre = '';
  clienteDocumento = '';
  clienteEmail = '';
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' = 'efectivo';
  porcentajeImpuesto = 0;

  subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.cantidad * item.precio_unitario, 0)
  );
  impuestos = computed(() => this.subtotal() * (this.porcentajeImpuesto / 100));
  total = computed(() => this.subtotal() + this.impuestos());

  ngOnInit() {
    this.negocioId = Number(this.ruta.snapshot.paramMap.get('negocioId'));
    this.productosService.listar(this.negocioId).subscribe((lista) => this.catalogo.set(lista));
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.facturasService.listar(this.negocioId).subscribe((lista) => this.facturas.set(lista));
  }

  agregarItem(producto: ProductoServicio) {
    const existentes = this.items();
    const indice = existentes.findIndex((item) => item.producto_id === producto.id);

    if (indice >= 0) {
      const copia = [...existentes];
      copia[indice] = { ...copia[indice], cantidad: copia[indice].cantidad + 1 };
      this.items.set(copia);
      return;
    }

    this.items.set([
      ...existentes,
      {
        producto_id: producto.id,
        descripcion_item: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio
      }
    ]);
  }

  cambiarCantidad(indice: number, delta: number) {
    const copia = [...this.items()];
    const nuevaCantidad = copia[indice].cantidad + delta;
    if (nuevaCantidad <= 0) {
      copia.splice(indice, 1);
    } else {
      copia[indice] = { ...copia[indice], cantidad: nuevaCantidad };
    }
    this.items.set(copia);
  }

  async emitir() {
    if (!this.items().length) {
      const aviso = await this.toast.create({
        message: 'Agregue al menos un ítem a la factura',
        duration: 2000,
        color: 'warning'
      });
      return aviso.present();
    }

    this.facturasService
      .crear({
        negocio_id: this.negocioId,
        cliente_nombre: this.clienteNombre,
        cliente_documento: this.clienteDocumento,
        cliente_email: this.clienteEmail,
        metodo_pago: this.metodoPago,
        porcentaje_impuesto: this.porcentajeImpuesto,
        items: this.items()
      })
      .subscribe({
        next: async (respuesta) => {
          this.items.set([]);
          this.clienteNombre = this.clienteDocumento = this.clienteEmail = '';
          this.cargarHistorial();
          this.seccion = 'historial';
          const aviso = await this.toast.create({
            message: respuesta.cliente_notificado
              ? `Factura ${respuesta.numero_factura} emitida. El cliente recibirá una notificación en la app.`
              : `Factura ${respuesta.numero_factura} emitida, pero no hay una cuenta de cliente registrada con ese correo.`,
            duration: 2500,
            color: respuesta.cliente_notificado ? 'success' : 'warning'
          });
          await aviso.present();
        },
        error: async (error) => {
          const aviso = await this.toast.create({
            message: error?.error?.mensaje || 'No fue posible emitir la factura',
            duration: 2500,
            color: 'danger'
          });
          await aviso.present();
        }
      });
  }

  marcarPagada(factura: Factura) {
    this.facturasService.cambiarEstado(factura.id, 'pagada').subscribe(() => this.cargarHistorial());
  }

  descargarPdf(factura: Factura) {
    this.facturasService.descargarPdf(factura.id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `factura-${factura.numero_factura}.pdf`;
      enlace.click();
      window.URL.revokeObjectURL(url);
    });
  }

  colorEstado(estado: string) {
    return estado === 'pagada' ? 'success' : estado === 'anulada' ? 'medium' : 'warning';
  }
}

import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { Negocio, ProductoServicio, Resena } from '../../core/models';
import { FavoritosService } from '../../core/services/favoritos.service';
import { NegociosService } from '../../core/services/negocios.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { ProductosService } from '../../core/services/productos.service';
import { ResenasService } from '../../core/services/resenas.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-negocio-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './negocio-detalle.page.html'
})
export class NegocioDetallePage implements OnInit, OnDestroy {
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
  private negociosService = inject(NegociosService);
  private productosService = inject(ProductosService);
  private pedidosService = inject(PedidosService);
  private resenasService = inject(ResenasService);
  private toast = inject(ToastController);
  private alerta = inject(AlertController);
  favoritos = inject(FavoritosService);
  auth = inject(AuthService);

  negocio = signal<Negocio | null>(null);
  catalogo = signal<ProductoServicio[]>([]);
  resenas = signal<Resena[]>([]);
  productoSeleccionado = signal<ProductoServicio | null>(null);
  detalleProductoAbierto = signal(false);
  carrito = signal<{ producto: ProductoServicio; cantidad: number }[]>([]);
  carritoAbierto = signal(false);
  pedidoEnviando = signal(false);
  totalCarrito = computed(() => this.carrito().reduce(
    (total, item) => total + Number(item.producto.precio) * item.cantidad,
    0
  ));
  cantidadCarrito = computed(() => this.carrito().reduce((total, item) => total + item.cantidad, 0));
  seccion: 'catalogo' | 'resenas' = 'catalogo';
  observacionesPedido = '';
  metodoPagoPedido: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' = 'efectivo';

  nuevaCalificacion = 5;
  nuevoComentario = '';
  editandoResenaId: number | null = null;
  edicionCalificacion = 5;
  edicionComentario = '';
  respondiendoResenaId: number | null = null;
  respuestaTexto = '';

  private negocioId!: number;
  private temporizador?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.negocioId = Number(this.ruta.snapshot.paramMap.get('id'));
    this.cargar();
    this.temporizador = setInterval(() => this.cargar(), 5000);
  }

  ngOnDestroy() {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  private cargar() {
    this.negociosService.obtener(this.negocioId).subscribe((n) => this.negocio.set(n));
    this.productosService.listar(this.negocioId).subscribe((lista) => this.catalogo.set(lista));
    this.resenasService.listarPorNegocio(this.negocioId).subscribe((lista) => {
      this.resenas.set(lista);
      const promedio = lista.length
        ? lista.reduce((total, resena) => total + Number(resena.calificacion || 0), 0) / lista.length
        : 0;
      this.negocio.update((negocio) => negocio
        ? { ...negocio, calificacion_promedio: promedio, total_resenas: lista.length }
        : negocio);
    });
  }

  async enviarResena() {
    if (!this.auth.estaAutenticado()) {
      const aviso = await this.toast.create({
        message: 'Inicie sesión para calificar este negocio',
        duration: 2500,
        color: 'warning'
      });
      return aviso.present();
    }

    this.resenasService.crear(this.negocioId, this.nuevaCalificacion, this.nuevoComentario).subscribe({
      next: async () => {
        this.nuevoComentario = '';
        this.cargar();
        const aviso = await this.toast.create({
          message: 'Gracias por su reseña',
          duration: 2000,
          color: 'success'
        });
        await aviso.present();
      },
      error: async (error) => {
        const aviso = await this.toast.create({
          message: error?.error?.mensaje || 'No fue posible publicar la reseña',
          duration: 2500,
          color: 'danger'
        });
        await aviso.present();
      }
    });
  }

  puedeGestionarResena(resena: Resena): boolean {
    return this.auth.usuario()?.id === resena.usuario_id;
  }

  puedeResponder(): boolean {
    const usuario = this.auth.usuario();
    return !!usuario && (usuario.rol === 'admin' || usuario.id === this.negocio()?.usuario_id);
  }

  iniciarEdicion(resena: Resena) {
    this.editandoResenaId = resena.id;
    this.edicionCalificacion = resena.calificacion;
    this.edicionComentario = resena.comentario || '';
  }

  cancelarEdicion() {
    this.editandoResenaId = null;
  }

  guardarEdicion(resena: Resena) {
    this.resenasService.actualizar(resena.id, this.edicionCalificacion, this.edicionComentario).subscribe({
      next: async () => {
        this.editandoResenaId = null;
        this.cargar();
        const aviso = await this.toast.create({ message: 'Reseña actualizada', duration: 1800, color: 'success' });
        await aviso.present();
      },
      error: async (error) => {
        const aviso = await this.toast.create({
          message: error?.error?.mensaje || 'No fue posible actualizar la reseña', duration: 2500, color: 'danger'
        });
        await aviso.present();
      }
    });
  }

  async eliminarResena(resena: Resena) {
    const dialogo = await this.alerta.create({
      header: 'Eliminar reseña',
      message: '¿Desea eliminar esta reseña?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => {
          this.resenasService.eliminar(resena.id).subscribe(() => this.cargar());
        } }
      ]
    });
    await dialogo.present();
  }

  iniciarRespuesta(resena: Resena) {
    this.respondiendoResenaId = resena.id;
    this.respuestaTexto = resena.respuesta_negocio || '';
  }

  cancelarRespuesta() {
    this.respondiendoResenaId = null;
    this.respuestaTexto = '';
  }

  guardarRespuesta(resena: Resena) {
    this.resenasService.responder(resena.id, this.respuestaTexto).subscribe({
      next: async () => {
        this.cancelarRespuesta();
        this.cargar();
        const aviso = await this.toast.create({ message: 'Respuesta publicada', duration: 1800, color: 'success' });
        await aviso.present();
      },
      error: async (error) => {
        const aviso = await this.toast.create({
          message: error?.error?.mensaje || 'No fue posible responder la reseña', duration: 2500, color: 'danger'
        });
        await aviso.present();
      }
    });
  }

  abrirWhatsapp() {
    const telefono = this.negocio()?.telefono_negocio?.replace(/\D/g, '');
    if (telefono) window.open(`https://wa.me/57${telefono}`, '_blank');
  }

  abrirMapa() {
    const n = this.negocio();
    if (n?.latitud && n?.longitud) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${n.latitud},${n.longitud}`, '_blank');
    }
  }

  abrirDetalleProducto(producto: ProductoServicio) {
    this.productoSeleccionado.set(producto);
    this.detalleProductoAbierto.set(true);
  }

  cerrarDetalleProducto() {
    this.detalleProductoAbierto.set(false);
    this.productoSeleccionado.set(null);
  }

  async agregarAlCarrito(producto: ProductoServicio) {
    if (!producto.disponible) {
      const aviso = await this.toast.create({
        message: 'Este producto no está disponible',
        duration: 1800,
        color: 'warning'
      });
      return aviso.present();
    }

    const usuario = this.auth.usuario();
    if (!usuario) {
      const dialogo = await this.alerta.create({
        header: 'Inicia sesión para comprar',
        message: 'Necesitas una cuenta de cliente para realizar un pedido.',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Iniciar sesión', handler: () => this.router.navigate(['/login']) }
        ]
      });
      return dialogo.present();
    }
    if (usuario.rol !== 'cliente') {
      const aviso = await this.toast.create({
        message: 'La compra está disponible para cuentas de cliente',
        duration: 2200,
        color: 'warning'
      });
      return aviso.present();
    }

    if (this.carrito().some((item) => item.producto.id === producto.id && item.cantidad >= 99)) {
      const aviso = await this.toast.create({
        message: 'La cantidad máxima por producto es 99',
        duration: 1800,
        color: 'warning'
      });
      return aviso.present();
    }

    this.carrito.update((items) => {
      const existente = items.find((item) => item.producto.id === producto.id);
      if (existente) {
        return items.map((item) => item.producto.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item);
      }
      return [...items, { producto, cantidad: 1 }];
    });
    const aviso = await this.toast.create({
      message: `${producto.nombre} agregado al carrito`,
      duration: 1500,
      color: 'success'
    });
    await aviso.present();
  }

  async cambiarCantidadCarrito(productoId: number, delta: number) {
    if (delta > 0 && this.carrito().some((item) => item.producto.id === productoId && item.cantidad >= 99)) {
      const aviso = await this.toast.create({
        message: 'La cantidad máxima por producto es 99',
        duration: 1800,
        color: 'warning'
      });
      return aviso.present();
    }
    this.carrito.update((items) => items
      .map((item) => item.producto.id === productoId
        ? { ...item, cantidad: item.cantidad + delta }
        : item)
      .filter((item) => item.cantidad > 0));
  }

  async finalizarPedido() {
    if (!this.carrito().length || this.pedidoEnviando()) return;
    const negocioId = this.negocio()?.id;
    if (!negocioId) return;

    this.pedidoEnviando.set(true);
    this.pedidosService.crear({
      negocio_id: negocioId,
      metodo_pago: this.metodoPagoPedido,
      observaciones: this.observacionesPedido,
      items: this.carrito().map(({ producto, cantidad }) => ({
        producto_id: producto.id,
        cantidad
      }))
    }).subscribe({
      next: async (respuesta) => {
        this.carrito.set([]);
        this.observacionesPedido = '';
        this.metodoPagoPedido = 'efectivo';
        this.carritoAbierto.set(false);
        this.pedidoEnviando.set(false);
        const aviso = await this.toast.create({
          message: `Pedido #${respuesta.id} enviado. Total: ${new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          }).format(respuesta.total)}`,
          duration: 3500,
          color: 'success'
        });
        await aviso.present();
      },
      error: async (error) => {
        this.pedidoEnviando.set(false);
        const aviso = await this.toast.create({
          message: error?.error?.mensaje || 'No fue posible enviar el pedido',
          duration: 2500,
          color: 'danger'
        });
        await aviso.present();
      }
    });
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

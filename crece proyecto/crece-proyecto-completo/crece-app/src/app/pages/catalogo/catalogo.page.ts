import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../../environments/environment';
import { ProductoServicio } from '../../core/models';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './catalogo.page.html',
  styleUrl: './catalogo.page.scss'
})
export class CatalogoPage implements OnInit {
  private fb = inject(FormBuilder);
  private ruta = inject(ActivatedRoute);
  private productosService = inject(ProductosService);
  private toast = inject(ToastController);
  private alerta = inject(AlertController);
  private http = inject(HttpClient);

  items = signal<ProductoServicio[]>([]);
  modalAbierto = signal(false);
  editandoId = signal<number | null>(null);
  negocioId!: number;

  formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    tipo: ['producto' as 'producto' | 'servicio'],
    imagen_url: [''],
    disponible: [true]
  });

  ngOnInit() {
    this.negocioId = Number(this.ruta.snapshot.paramMap.get('negocioId'));
    this.cargar();
  }

  cargar() {
    this.productosService.listar(this.negocioId).subscribe((lista) => this.items.set(lista));
  }

  abrirNuevo() {
    this.editandoId.set(null);
    this.formulario.reset({ nombre: '', descripcion: '', precio: 0, tipo: 'producto', imagen_url: '', disponible: true });
    this.modalAbierto.set(true);
  }

  abrirEdicion(item: ProductoServicio) {
    this.editandoId.set(item.id);
    this.formulario.patchValue(item as never);
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  async seleccionarImagen() {
    try {
      const foto = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      if (!foto.webPath) {
        return;
      }

      const respuesta = await fetch(foto.webPath);
      const blob = await respuesta.blob();
      await this.subirImagen(blob, `producto-${Date.now()}.jpg`);
    } catch (error) {
      await this.mostrarErrorImagen();
    }
  }

  async seleccionarArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    try {
      await this.subirImagen(archivo, archivo.name);
    } catch {
      await this.mostrarErrorImagen();
    } finally {
      input.value = '';
    }
  }

  private async subirImagen(archivo: Blob, nombre: string) {
    const formData = new FormData();
    formData.append('file', archivo, nombre);
    const carga = await this.http.post<{ url: string }>(`${environment.apiUrl}/upload`, formData).toPromise();
    if (!carga?.url) throw new Error('La API no devolvió la URL de la imagen');
    this.formulario.patchValue({ imagen_url: carga.url });
  }

  private async mostrarErrorImagen() {
    const aviso = await this.toast.create({
      message: 'No fue posible subir la imagen. Verifica la conexión con el servidor.',
      duration: 2500,
      color: 'danger'
    });
    await aviso.present();
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

  guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = { ...this.formulario.getRawValue(), negocio_id: this.negocioId };
    const id = this.editandoId();
    const peticion = id
      ? this.productosService.actualizar(id, datos)
      : this.productosService.crear(datos);

    peticion.subscribe({
      next: async () => {
        this.cerrarModal();
        this.cargar();
        const aviso = await this.toast.create({
          message: id ? 'Ítem actualizado' : 'Ítem agregado al catálogo',
          duration: 2000,
          color: 'success'
        });
        await aviso.present();
      },
      error: async (error) => {
        const aviso = await this.toast.create({
          message: error?.error?.mensaje || 'No fue posible guardar el ítem',
          duration: 2500,
          color: 'danger'
        });
        await aviso.present();
      }
    });
  }

  async confirmarEliminacion(item: ProductoServicio) {
    const dialogo = await this.alerta.create({
      header: 'Eliminar ítem',
      message: `¿Desea eliminar "${item.nombre}" del catálogo?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.productosService.eliminar(item.id).subscribe(() => this.cargar());
          }
        }
      ]
    });
    await dialogo.present();
  }
}

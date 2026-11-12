import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Capacitacion } from '../../core/models';
import { CapacitacionesService } from '../../core/services/capacitaciones.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-capacitacion',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './capacitacion.page.html'
})
export class CapacitacionPage implements OnInit {
  private capacitacionesService = inject(CapacitacionesService);
  private toast = inject(ToastController);
  auth = inject(AuthService);

  contenidos = signal<Capacitacion[]>([]);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    const peticion = this.auth.estaAutenticado()
      ? this.capacitacionesService.miProgreso()
      : this.capacitacionesService.listar();

    peticion.subscribe((lista) => this.contenidos.set(lista));
  }

  abrir(contenido: Capacitacion) {
    if (contenido.url_recurso) window.open(contenido.url_recurso, '_blank');
  }

  async marcarCompletado(contenido: Capacitacion) {
    if (!this.auth.estaAutenticado()) {
      const aviso = await this.toast.create({
        message: 'Inicie sesión para registrar su avance',
        duration: 2000,
        color: 'warning'
      });
      return aviso.present();
    }

    this.capacitacionesService.guardarProgreso(contenido.id, 100).subscribe(async () => {
      this.cargar();
      const aviso = await this.toast.create({
        message: '¡Contenido completado!',
        duration: 1800,
        color: 'success'
      });
      await aviso.present();
    });
  }

  icono(tipo: string) {
    const iconos: Record<string, string> = {
      video: 'play-circle-outline',
      articulo: 'document-text-outline',
      pdf: 'document-outline',
      curso: 'school-outline'
    };
    return iconos[tipo] || 'book-outline';
  }
}

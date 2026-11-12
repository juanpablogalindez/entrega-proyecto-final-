import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, ReactiveFormsModule],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss'
})
export class PerfilPage {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private alerta = inject(AlertController);
  private toast = inject(ToastController);
  editando = false;
  guardando = false;

  formulario = this.fb.nonNullable.group({
    nombre_completo: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/)
    ]],
    telefono: ['', [Validators.pattern(/^\d{7,15}$/)]]
  });

  limpiarNombre(event: CustomEvent) {
    const valor = String(event.detail?.value ?? '');
    const limpio = valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, '');
    if (valor !== limpio) this.formulario.controls.nombre_completo.setValue(limpio);
  }

  limpiarTelefono(event: CustomEvent) {
    const valor = String(event.detail?.value ?? '');
    const limpio = valor.replace(/\D/g, '').slice(0, 15);
    if (valor !== limpio) this.formulario.controls.telefono.setValue(limpio);
  }

  constructor() {
    this.cargarFormulario();
  }

  private cargarFormulario() {
    const usuario = this.auth.usuario();
    if (usuario) {
      this.formulario.patchValue({
        nombre_completo: usuario.nombre_completo,
        telefono: usuario.telefono || ''
      });
    }
  }

  iniciarEdicion() {
    this.cargarFormulario();
    this.editando = true;
  }

  cancelarEdicion() {
    this.cargarFormulario();
    this.editando = false;
  }

  async guardarPerfil() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.auth.actualizarPerfil(this.formulario.getRawValue()).subscribe({
      next: async () => {
        this.guardando = false;
        this.editando = false;
        const aviso = await this.toast.create({
          message: 'Perfil actualizado correctamente',
          duration: 2000,
          color: 'success'
        });
        await aviso.present();
      },
      error: async (error) => {
        this.guardando = false;
        const aviso = await this.toast.create({
          message: error?.error?.mensaje || 'No fue posible actualizar el perfil',
          duration: 2500,
          color: 'danger'
        });
        await aviso.present();
      }
    });
  }

  async confirmarCierre() {
    const dialogo = await this.alerta.create({
      header: 'Cerrar sesión',
      message: '¿Desea salir de su cuenta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salir', role: 'destructive', handler: () => this.auth.cerrarSesion() }
      ]
    });
    await dialogo.present();
  }
}

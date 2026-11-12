import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaAuth, Usuario } from '../models';

const CLAVE_TOKEN = 'crece_token';
const CLAVE_USUARIO = 'crece_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _usuario = signal<Usuario | null>(this.leerUsuarioGuardado());

  usuario = this._usuario.asReadonly();
  estaAutenticado = computed(() => this._usuario() !== null);
  esNegocio = computed(() => this._usuario()?.rol === 'negocio');
  esAdmin = computed(() => this._usuario()?.rol === 'admin');

  private leerUsuarioGuardado(): Usuario | null {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    return guardado ? JSON.parse(guardado) : null;
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  registrar(datos: {
    nombre_completo: string;
    email: string;
    password: string;
    telefono?: string;
    rol: 'cliente' | 'negocio';
  }) {
    return this.http
      .post<RespuestaAuth>(`${environment.apiUrl}/auth/registro`, datos)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  login(email: string, password: string) {
    return this.http
      .post<RespuestaAuth>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  actualizarPerfil(datos: { nombre_completo: string; telefono: string }) {
    return this.http.put<{ mensaje: string }>(`${environment.apiUrl}/auth/perfil`, datos).pipe(
      tap(() => {
        const usuario = this._usuario();
        if (!usuario) return;

        const actualizado = { ...usuario, ...datos };
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(actualizado));
        this._usuario.set(actualizado);
      })
    );
  }

  private guardarSesion(respuesta: RespuestaAuth) {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    this._usuario.set(respuesta.usuario);
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this._usuario.set(null);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}

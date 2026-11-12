import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Categoria, DecisionVerificacion, DetalleVerificacion, Negocio, ResultadoVerificacion
} from '../models';

export interface FiltrosBusqueda {
  q?: string;
  categoria_id?: number;
  lat?: number;
  lng?: number;
  radio?: number;
  limite?: number;
  pagina?: number;
}

@Injectable({ providedIn: 'root' })
export class NegociosService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/negocios`;

  buscar(filtros: FiltrosBusqueda = {}) {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    });
    return this.http.get<Negocio[]>(this.url, { params });
  }

  obtener(id: number) {
    return this.http.get<Negocio>(`${this.url}/${id}`);
  }

  misNegocios() {
    return this.http.get<Negocio[]>(`${this.url}/mis-negocios`);
  }

  pendientesVerificacion() {
    return this.http.get<(Negocio & {
      propietario: string;
      email_propietario: string;
      fecha_creacion: string;
    })[]>(`${this.url}/admin/pendientes-verificacion`);
  }

  verificar(id: number) {
    return this.http.patch<{ mensaje: string }>(`${this.url}/${id}/verificar`, {});
  }

  detalleVerificacion(id: number) {
    return this.http.get<DetalleVerificacion>(`${this.url}/${id}/verificacion`);
  }

  reabrirVerificacion(id: number) {
    return this.http.patch<{ mensaje: string; estado: string }>(`${this.url}/${id}/verificacion/reabrir`, {});
  }

  revisarVerificacion(id: number, decision: DecisionVerificacion, requisitos: {
    requisito_id: number;
    resultado: ResultadoVerificacion;
    observacion?: string;
  }[], observaciones: string) {
    return this.http.post<{ mensaje: string; estado: string }>(`${this.url}/${id}/verificacion/revisar`, {
      decision, requisitos, observaciones
    });
  }

  reenviarVerificacion(id: number) {
    return this.http.post<{ mensaje: string; estado: string }>(`${this.url}/${id}/verificacion/reenviar`, {});
  }

  crear(datos: Partial<Negocio>) {
    return this.http.post<{ id: number; mensaje: string }>(this.url, datos);
  }

  actualizar(id: number, datos: Partial<Negocio>) {
    return this.http.put<{ mensaje: string }>(`${this.url}/${id}`, datos);
  }

  generarDeclaracionLegalidad(id: number) {
    return this.http.post<{ mensaje: string; url: string }>(
      `${this.url}/${id}/documento-legalidad/generar`, {}
    );
  }

  subirDocumentoLegalidad(id: number, archivo: File) {
    const datos = new FormData();
    datos.append('file', archivo, archivo.name);
    return this.http.post<{ mensaje: string; url: string; firmado: boolean }>(
      `${this.url}/${id}/documento-legalidad/subir`, datos
    );
  }

  subirDocumento(id: number, tipo: 'cedula' | 'rut' | 'camara', archivo: File) {
    const datos = new FormData();
    datos.append('file', archivo, archivo.name);
    return this.http.post<{ mensaje: string; url: string }>(
      `${this.url}/${id}/documentos/${tipo}`, datos
    );
  }

  eliminar(id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }

  categorias() {
    return this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`);
  }
}

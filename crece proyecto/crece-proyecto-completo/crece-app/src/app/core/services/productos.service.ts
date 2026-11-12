import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProductoServicio } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/productos`;

  listar(negocioId: number, filtros: { tipo?: string; q?: string } = {}) {
    let params = new HttpParams().set('negocio_id', negocioId);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.q) params = params.set('q', filtros.q);
    return this.http.get<ProductoServicio[]>(this.url, { params });
  }

  crear(datos: Partial<ProductoServicio>) {
    return this.http.post<{ id: number; mensaje: string }>(this.url, datos);
  }

  actualizar(id: number, datos: Partial<ProductoServicio>) {
    return this.http.put<{ mensaje: string }>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }
}

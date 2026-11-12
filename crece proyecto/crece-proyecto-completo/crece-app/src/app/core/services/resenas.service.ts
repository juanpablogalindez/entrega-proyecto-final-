import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Resena } from '../models';

@Injectable({ providedIn: 'root' })
export class ResenasService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/resenas`;

  listarPorNegocio(negocioId: number) {
    return this.http.get<Resena[]>(`${this.url}/negocio/${negocioId}`);
  }

  crear(negocio_id: number, calificacion: number, comentario?: string) {
    return this.http.post<{ id: number; mensaje: string }>(this.url, {
      negocio_id, calificacion, comentario
    });
  }

  responder(id: number, respuesta_negocio: string) {
    return this.http.patch<{ mensaje: string }>(`${this.url}/${id}/responder`, { respuesta_negocio });
  }

  actualizar(id: number, calificacion: number, comentario: string) {
    return this.http.put<{ mensaje: string }>(`${this.url}/${id}`, { calificacion, comentario });
  }

  eliminar(id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }
}

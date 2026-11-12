import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Notificacion {
  id: string;
  tipo: 'negocio' | 'reseña' | 'respuesta' | 'factura' | 'pago-factura' | 'pedido'
    | 'pedido-confirmado' | 'pedido-entregado' | 'negocio-verificado';
  titulo: string;
  mensaje: string;
  fecha: string;
  ruta: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/notificaciones`;

  listar() {
    return this.http.get<Notificacion[]>(this.url);
  }
}

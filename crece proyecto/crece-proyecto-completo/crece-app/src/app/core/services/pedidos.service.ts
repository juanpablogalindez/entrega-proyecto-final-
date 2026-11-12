import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EstadoPedido, Pedido } from '../models';

export interface NuevoPedido {
  negocio_id: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  observaciones?: string;
  items: { producto_id: number; cantidad: number }[];
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/pedidos`;

  listar(negocioId?: number) {
    let params = new HttpParams();
    if (negocioId) params = params.set('negocio_id', negocioId);
    return this.http.get<Pedido[]>(this.url, { params });
  }

  crear(pedido: NuevoPedido) {
    return this.http.post<{ id: number; total: number; mensaje: string }>(this.url, pedido);
  }

  cambiarEstado(id: number, estado: EstadoPedido) {
    return this.http.patch<{ mensaje: string }>(`${this.url}/${id}/estado`, { estado });
  }
}

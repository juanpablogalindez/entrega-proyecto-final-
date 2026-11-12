import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Factura, ItemFactura } from '../models';

export interface NuevaFactura {
  negocio_id: number;
  cliente_nombre?: string;
  cliente_documento?: string;
  cliente_email?: string;
  metodo_pago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  porcentaje_impuesto?: number;
  observaciones?: string;
  items: ItemFactura[];
}

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/facturas`;

  listar(negocioId: number, estado?: string) {
    let params = new HttpParams().set('negocio_id', negocioId);
    if (estado) params = params.set('estado', estado);
    return this.http.get<Factura[]>(this.url, { params });
  }

  obtener(id: number) {
    return this.http.get<Factura>(`${this.url}/${id}`);
  }

  descargarPdf(id: number) {
    return this.http.get(`${this.url}/${id}/pdf`, { responseType: 'blob' });
  }

  crear(factura: NuevaFactura) {
    return this.http.post<{
      id: number;
      numero_factura: string;
      total: number;
      cliente_notificado: boolean;
    }>(this.url, factura);
  }

  cambiarEstado(id: number, estado: 'pendiente' | 'pagada' | 'anulada') {
    return this.http.patch<{ mensaje: string }>(`${this.url}/${id}/estado`, { estado });
  }

  pagar(id: number) {
    return this.http.patch<{ mensaje: string }>(`${this.url}/${id}/pagar`, {});
  }
}

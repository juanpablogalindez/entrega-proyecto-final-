import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Capacitacion } from '../models';

@Injectable({ providedIn: 'root' })
export class CapacitacionesService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/capacitaciones`;

  listar() {
    return this.http.get<Capacitacion[]>(this.url);
  }

  miProgreso() {
    return this.http.get<Capacitacion[]>(`${this.url}/mi-progreso`);
  }

  obtener(id: number) {
    return this.http.get<Capacitacion>(`${this.url}/${id}`);
  }

  guardarProgreso(id: number, porcentaje_avance: number) {
    return this.http.post<{ mensaje: string; completado: boolean }>(
      `${this.url}/${id}/progreso`,
      { porcentaje_avance }
    );
  }
}

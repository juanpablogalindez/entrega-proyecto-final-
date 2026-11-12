import { Injectable, signal } from '@angular/core';
import { Negocio } from '../models';

const CLAVE_FAVORITOS = 'crece_favoritos';

@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private _negocios = signal<Negocio[]>(this.leerFavoritos());
  negocios = this._negocios.asReadonly();

  contiene(negocioId: number): boolean {
    return this._negocios().some((negocio) => negocio.id === negocioId);
  }

  alternar(negocio: Negocio): void {
    const guardados = this._negocios();
    const actualizados = this.contiene(negocio.id)
      ? guardados.filter((guardado) => guardado.id !== negocio.id)
      : [...guardados, negocio];

    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(actualizados));
    this._negocios.set(actualizados);
  }

  quitar(negocioId: number): void {
    const actualizados = this._negocios().filter((negocio) => negocio.id !== negocioId);
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(actualizados));
    this._negocios.set(actualizados);
  }

  private leerFavoritos(): Negocio[] {
    const guardados = localStorage.getItem(CLAVE_FAVORITOS);
    return guardados ? JSON.parse(guardados) : [];
  }
}

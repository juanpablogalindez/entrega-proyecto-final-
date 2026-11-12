export type RolUsuario = 'cliente' | 'negocio' | 'admin';

export interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  telefono?: string | null;
  rol: RolUsuario;
  estado?: 'activo' | 'inactivo' | 'suspendido';
  fecha_registro?: string;
}

export interface RespuestaAuth {
  usuario: Usuario;
  token: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
}

export interface Negocio {
  id: number;
  usuario_id?: number;
  categoria_id?: number | null;
  categoria_nombre?: string | null;
  nombre_negocio: string;
  descripcion?: string | null;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  telefono_negocio?: string | null;
  email_negocio?: string | null;
  horario_atencion?: string | null;
  logo_url?: string | null;
  formalizado: boolean;
  cedula_propietario?: string | null;
  runt?: string | null;
  documento_legalidad_url?: string | null;
  documento_legalidad_firmado?: boolean;
  documento_cedula_url?: string | null;
  documento_rut_url?: string | null;
  documento_camara_comercio_url?: string | null;
  verificado?: boolean;
  estado?: 'pendiente' | 'activo' | 'inactivo';
  verificacion_estado?: 'pendiente' | 'en_revision' | 'requiere_correcciones' | 'verificado' | 'rechazado';
  verificacion_observaciones?: string | null;
  verificacion_fecha?: string | null;
  calificacion_promedio?: number;
  total_resenas?: number;
  distancia_km?: number | null;
}

export type ResultadoVerificacion = 'cumple' | 'no_cumple' | 'no_verificable';
export type DecisionVerificacion = 'verificado' | 'requiere_correcciones' | 'rechazado';

export interface RequisitoVerificacion {
  id: number;
  clave: string;
  nombre: string;
  obligatorio: boolean;
  orden: number;
  resultado?: ResultadoVerificacion;
  observacion?: string;
}

export interface RevisionVerificacion {
  id: number;
  decision: DecisionVerificacion;
  observaciones?: string | null;
  fecha_creacion: string;
  administrador: string;
  items?: RequisitoVerificacion[];
}

export interface DetalleVerificacion {
  negocio: Negocio & {
    propietario: string;
    email_propietario: string;
    telefono_propietario?: string | null;
    cedula_propietario?: string | null;
    runt?: string | null;
  };
  requisitos: RequisitoVerificacion[];
  historial: RevisionVerificacion[];
}

export interface ProductoServicio {
  id: number;
  negocio_id: number;
  categoria_id?: number | null;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  tipo: 'producto' | 'servicio';
  imagen_url?: string | null;
  disponible: boolean;
}

export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export interface PedidoItem {
  producto_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
}

export interface Pedido {
  id: number;
  negocio_id: number;
  usuario_id: number;
  nombre_negocio?: string;
  cliente_nombre?: string;
  cliente_telefono?: string | null;
  fecha_creacion: string;
  total: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  estado: EstadoPedido;
  observaciones?: string | null;
  items: PedidoItem[];
}

export interface ItemFactura {
  producto_id?: number | null;
  descripcion_item: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea?: number;
}

export interface Factura {
  id: number;
  negocio_id: number;
  numero_factura: string;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  cliente_email?: string | null;
  fecha_emision: string;
  subtotal: number;
  impuestos: number;
  total: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  estado: 'pendiente' | 'pagada' | 'anulada';
  observaciones?: string | null;
  detalle?: ItemFactura[];
}

export interface Capacitacion {
  id: number;
  titulo: string;
  descripcion?: string | null;
  contenido?: string | null;
  tipo_contenido: 'video' | 'articulo' | 'pdf' | 'curso';
  url_recurso?: string | null;
  categoria?: string | null;
  duracion_minutos?: number | null;
  porcentaje_avance?: number;
  completado?: boolean;
}

export interface Resena {
  id: number;
  negocio_id?: number;
  usuario_id?: number;
  usuario_nombre?: string;
  calificacion: number;
  comentario?: string | null;
  respuesta_negocio?: string | null;
  fecha_creacion: string;
}

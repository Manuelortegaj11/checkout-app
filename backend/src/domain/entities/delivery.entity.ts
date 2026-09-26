import {
  DELIVERY_STATUS,
  type DeliveryStatus,
} from '@domain/constants/delivery.constants';
import {
  normalizePersonName,
  normalizePhone,
} from '@domain/rules/contact.rules';

/** Dirección de entrega tal como la captura el checkout. */
export interface DeliveryAddress {
  readonly recipientName: string;
  readonly phone: string;
  readonly addressLine1: string;
  readonly addressLine2?: string | null;
  readonly city: string;
  readonly region: string;
  readonly postalCode?: string | null;
}

export interface DeliveryProps {
  readonly status: DeliveryStatus;
  readonly recipientName: string;
  readonly phone: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly region: string;
  readonly postalCode: string | null;
}

/** Un campo opcional vacío se guarda como `null`, nunca como texto vacío. */
const optionalText = (value?: string | null): string | null =>
  value?.trim() || null;

/**
 * Entrega del producto comprado. Vive dentro del agregado Transaction: se crea
 * con la transacción y su estado solo cambia cuando la transacción se liquida.
 */
export class Delivery {
  private constructor(private readonly props: DeliveryProps) {}

  /**
   * Nueva entrega a la espera del pago. El formato de la dirección ya se
   * validó en la entrada; aquí solo se normaliza, así que no puede fallar.
   */
  static create(address: DeliveryAddress): Delivery {
    return new Delivery({
      status: DELIVERY_STATUS.PENDING_PAYMENT,
      recipientName: normalizePersonName(address.recipientName),
      phone: normalizePhone(address.phone),
      addressLine1: address.addressLine1.trim(),
      addressLine2: optionalText(address.addressLine2),
      city: address.city.trim(),
      region: address.region.trim(),
      postalCode: optionalText(address.postalCode),
    });
  }

  /** Reconstruye una entrega ya persistida. */
  static reconstitute(props: DeliveryProps): Delivery {
    return new Delivery({ ...props });
  }

  /**
   * Resultado de la entrega cuando el pago termina: si se aprobó, el producto
   * queda asignado al cliente; si no, no hay nada que entregar. Solo la
   * transacción la llama, al liquidarse (una única vez).
   */
  settle(paymentApproved: boolean): Delivery {
    return new Delivery({
      ...this.props,
      status: paymentApproved
        ? DELIVERY_STATUS.ASSIGNED
        : DELIVERY_STATUS.CANCELLED,
    });
  }

  get status(): DeliveryStatus {
    return this.props.status;
  }

  /** Copia de los datos: modificarla no altera la entidad. */
  toPlainObject(): DeliveryProps {
    return { ...this.props };
  }
}

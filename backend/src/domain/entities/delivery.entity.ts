import {
  DELIVERY_STATUS,
  type DeliveryStatus,
} from '@domain/constants/delivery.constants';
import {
  normalizePersonName,
  normalizePhone,
} from '@domain/rules/contact.rules';

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

const optionalText = (value?: string | null): string | null =>
  value?.trim() || null;

export class Delivery {
  private constructor(private readonly props: DeliveryProps) {}

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

  static reconstitute(props: DeliveryProps): Delivery {
    return new Delivery({ ...props });
  }

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

  toPlainObject(): DeliveryProps {
    return { ...this.props };
  }
}

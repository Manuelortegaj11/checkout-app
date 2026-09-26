import { Injectable, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_GATEWAY,
  type AcceptanceContracts,
  type PaymentGatewayPort,
} from '@application/ports/payment-gateway.port';
import type { EnvironmentVariables } from '@config/env.validation';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import type { AppError } from '@shared/errors/app-error';
import type { ResultAsync } from '@shared/result';
import { toPaymentResult } from './gateway-transaction.response';
import { toAcceptanceContracts } from './merchant.response';
import { getJson } from './payment-gateway.http';

/** Adapter HTTP de la pasarela de pagos. */
@Injectable()
export class PaymentGatewayHttpClient implements PaymentGatewayPort {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.baseUrl = config
      .get('PAYMENT_GATEWAY_BASE_URL', { infer: true })
      .replace(/\/+$/, '');
    this.publicKey = config.get('PAYMENT_GATEWAY_PUBLIC_KEY', { infer: true });
    this.timeoutMs = config.get('PAYMENT_GATEWAY_TIMEOUT_MS', { infer: true });
  }

  getAcceptanceContracts(): ResultAsync<AcceptanceContracts, AppError> {
    const url = `${this.baseUrl}/merchants/${encodeURIComponent(this.publicKey)}`;

    return getJson(url, this.timeoutMs).andThen(toAcceptanceContracts);
  }

  /** La consulta es pública en la pasarela: no necesita credenciales. */
  getPayment(
    gatewayTransactionId: string,
  ): ResultAsync<PaymentResult, AppError> {
    const url = `${this.baseUrl}/transactions/${encodeURIComponent(gatewayTransactionId)}`;

    return getJson(url, this.timeoutMs).andThen(toPaymentResult);
  }
}

export const PAYMENT_GATEWAY_PROVIDER: Provider = {
  provide: PAYMENT_GATEWAY,
  useClass: PaymentGatewayHttpClient,
};

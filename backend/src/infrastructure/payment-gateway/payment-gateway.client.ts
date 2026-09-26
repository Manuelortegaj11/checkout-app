import { Injectable, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_GATEWAY,
  type AcceptanceContracts,
  type PaymentGatewayPort,
  type PaymentRequest,
} from '@application/ports/payment-gateway.port';
import type { EnvironmentVariables } from '@config/env.validation';
import type { PaymentResult } from '@domain/entities/transaction.entity';
import { isFinalStatus } from '@domain/rules/transaction-status.rules';
import type { AppError } from '@shared/errors/app-error';
import { ResultAsync } from '@shared/result';
import { toPaymentResult } from './gateway-transaction.response';
import { integritySignature } from './integrity-signature';
import { toAcceptanceContracts } from './merchant.response';
import { getJson, postJson } from './payment-gateway.http';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Adapter HTTP de la pasarela de pagos. */
@Injectable()
export class PaymentGatewayHttpClient implements PaymentGatewayPort {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly integritySecret: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly pollAttempts: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.baseUrl = config
      .get('PAYMENT_GATEWAY_BASE_URL', { infer: true })
      .replace(/\/+$/, '');
    this.publicKey = config.get('PAYMENT_GATEWAY_PUBLIC_KEY', { infer: true });
    this.integritySecret = config.get('PAYMENT_GATEWAY_INTEGRITY_SECRET', {
      infer: true,
    });
    this.timeoutMs = config.get('PAYMENT_GATEWAY_TIMEOUT_MS', { infer: true });
    this.pollIntervalMs = config.get('PAYMENT_GATEWAY_POLL_INTERVAL_MS', {
      infer: true,
    });
    this.pollAttempts = Math.floor(
      config.get('PAYMENT_GATEWAY_POLL_TIMEOUT_MS', { infer: true }) /
        this.pollIntervalMs,
    );
  }

  getAcceptanceContracts(): ResultAsync<AcceptanceContracts, AppError> {
    const url = `${this.baseUrl}/merchants/${encodeURIComponent(this.publicKey)}`;

    return getJson(url, this.timeoutMs).andThen(toAcceptanceContracts);
  }

  /**
   * Crea el cobro (autenticado con la llave pública y firmado con el secreto de
   * integridad) y espera unos segundos su estado final.
   */
  charge(request: PaymentRequest): ResultAsync<PaymentResult, AppError> {
    return postJson(`${this.baseUrl}/transactions`, this.chargeBody(request), {
      bearerToken: this.publicKey,
      timeoutMs: this.timeoutMs,
    })
      .andThen(toPaymentResult)
      .andThen((payment) =>
        ResultAsync.fromSafePromise(this.waitForFinalStatus(payment)),
      );
  }

  /** La consulta es pública en la pasarela: no necesita credenciales. */
  getPayment(
    gatewayTransactionId: string,
  ): ResultAsync<PaymentResult, AppError> {
    const url = `${this.baseUrl}/transactions/${encodeURIComponent(gatewayTransactionId)}`;

    return getJson(url, this.timeoutMs).andThen(toPaymentResult);
  }

  private chargeBody(request: PaymentRequest) {
    return {
      acceptance_token: request.acceptanceToken,
      accept_personal_auth: request.personalDataAuthToken,
      amount_in_cents: request.amountInCents,
      currency: request.currency,
      signature: integritySignature(request, this.integritySecret),
      customer_email: request.customerEmail,
      reference: request.reference,
      payment_method: {
        type: 'CARD',
        token: request.cardToken,
        installments: request.installments,
      },
    };
  }

  /**
   * Consulta el cobro hasta que tenga un estado final o se agote la espera.
   * El cobro ya existe en la pasarela: un fallo al consultar no lo convierte en
   * error, se devuelve el último estado conocido y se sincroniza después.
   */
  private async waitForFinalStatus(
    payment: PaymentResult,
  ): Promise<PaymentResult> {
    let latest = payment;

    for (
      let attempt = 0;
      attempt < this.pollAttempts && !isFinalStatus(latest.status);
      attempt++
    ) {
      await sleep(this.pollIntervalMs);
      const current = await this.getPayment(latest.gatewayTransactionId);
      latest = current.unwrapOr(latest);
    }

    return latest;
  }
}

export const PAYMENT_GATEWAY_PROVIDER: Provider = {
  provide: PAYMENT_GATEWAY,
  useClass: PaymentGatewayHttpClient,
};

import { Lock, RotateCw } from 'lucide-react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button } from '@shared/ui/Button';
import { Modal } from '@shared/ui/Modal';
import { Notice } from '@shared/ui/Notice';
import { Skeleton } from '@shared/ui/Skeleton';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  validateAddress,
  validateCard,
  validateContact,
  type CardForm,
  type FormErrors,
} from '../checkout-form.validation';
import {
  selectAddressDraft,
  selectCheckoutConfigErrorCode,
  selectCheckoutConfigStatus,
  selectCheckoutProduct,
  selectCheckoutQuantity,
  selectContactDraft,
} from '../checkout.selectors';
import {
  addressChanged,
  checkoutClosed,
  contactChanged,
  paymentDetailsSubmitted,
  quantityChanged,
} from '../checkout.slice';
import { fetchCheckoutConfig } from '../checkout.thunks';
import {
  configErrorMessage,
  tokenizationErrorMessage,
} from '../payment-error-message';
import { useCardTokenization } from '../use-card-tokenization';
import { AddressFields } from './AddressFields';
import { CardFields } from './CardFields';
import { ContactFields } from './ContactFields';
import { OrderLine } from './OrderLine';

const EMPTY_CARD: CardForm = { number: '', holder: '', expiry: '', cvc: '' };

/** Un error se muestra si el campo ya se visitó o si el cliente intentó enviar. */
const visible = <Form,>(
  errors: FormErrors<Form>,
  touched: ReadonlySet<string>,
  submitted: boolean,
): FormErrors<Form> =>
  submitted
    ? errors
    : (Object.fromEntries(
        Object.entries(errors).filter(([field]) => touched.has(field)),
      ) as FormErrors<Form>);

/**
 * Pantalla 2: datos de la tarjeta y de entrega en un modal sobre el catálogo.
 * Al enviar valida, tokeniza la tarjeta y pasa al resumen. El contacto y la
 * dirección se guardan como borrador en el store (sobreviven a un refresh);
 * la tarjeta vive solo aquí.
 */
export function PaymentModal() {
  const dispatch = useAppDispatch();
  const product = useAppSelector(selectCheckoutProduct);
  const quantity = useAppSelector(selectCheckoutQuantity);
  const contact = useAppSelector(selectContactDraft);
  const address = useAppSelector(selectAddressDraft);
  const configStatus = useAppSelector(selectCheckoutConfigStatus);
  const configErrorCode = useAppSelector(selectCheckoutConfigErrorCode);
  const tokenization = useCardTokenization();

  const formId = useId();
  const [card, setCard] = useState<CardForm>(EMPTY_CARD);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  // Los tokens de aceptación son de un solo uso: cada compra pide los suyos.
  useEffect(() => {
    void dispatch(fetchCheckoutConfig());
  }, [dispatch]);

  const errors = {
    contact: validateContact(contact),
    address: validateAddress(address),
    card: validateCard(card, new Date()),
  };
  const touch = (field: string) => setTouched(new Set(touched).add(field));

  const handleSubmit = async (form: HTMLFormElement) => {
    setSubmitted(true);
    const firstInvalid = Object.entries({
      ...errors.contact,
      ...errors.address,
      ...errors.card,
    }).find(([, message]) => message)?.[0];

    if (firstInvalid) {
      (form.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
      return;
    }

    const tokenized = await tokenization.tokenize(card);
    if (tokenized) {
      dispatch(paymentDetailsSubmitted(tokenized));
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(event.currentTarget);
  };

  const tokenizing = tokenization.status === 'tokenizing';
  const canSubmit =
    product !== null && configStatus === 'succeeded' && !tokenizing;

  return (
    <Modal
      title="Pago con tarjeta"
      description="Completa tus datos para ver el resumen del pago."
      onClose={() => dispatch(checkoutClosed())}
      footer={
        <div className="flex flex-col gap-3">
          {configStatus === 'failed' && (
            <Notice
              tone="danger"
              title="No pudimos preparar el pago"
              action={
                <Button
                  variant="secondary"
                  onClick={() => void dispatch(fetchCheckoutConfig())}
                >
                  <RotateCw aria-hidden="true" className="size-4" />
                  Reintentar
                </Button>
              }
            >
              {configErrorMessage(configErrorCode)}
            </Notice>
          )}
          {tokenization.status === 'failed' && (
            <Notice tone="danger" title="No pudimos verificar la tarjeta">
              {tokenizationErrorMessage(tokenization.errorCode)}
            </Notice>
          )}
          <Button
            type="submit"
            form={formId}
            className="w-full"
            disabled={!canSubmit}
          >
            {tokenizing ? 'Verificando la tarjeta…' : 'Continuar al resumen'}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-subtle">
            <Lock aria-hidden="true" className="size-3.5 shrink-0" />
            La tarjeta va directo a la pasarela de pagos: no la guardamos.
          </p>
        </div>
      }
    >
      {product === null ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : (
        <form
          id={formId}
          noValidate
          onSubmit={onSubmit}
          className="flex flex-col gap-8"
        >
          <OrderLine
            product={product}
            quantity={quantity}
            onQuantityChange={(value) => dispatch(quantityChanged(value))}
          />
          <ContactFields
            values={contact}
            errors={visible(errors.contact, touched, submitted)}
            onChange={(changes) => dispatch(contactChanged(changes))}
            onBlur={touch}
          />
          <AddressFields
            values={address}
            errors={visible(errors.address, touched, submitted)}
            onChange={(changes) => dispatch(addressChanged(changes))}
            onBlur={touch}
          />
          <CardFields
            values={card}
            errors={visible(errors.card, touched, submitted)}
            onChange={(changes) => setCard({ ...card, ...changes })}
            onBlur={touch}
          />
        </form>
      )}
    </Modal>
  );
}

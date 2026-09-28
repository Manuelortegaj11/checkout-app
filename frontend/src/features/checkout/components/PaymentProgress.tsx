import {
  Circle,
  CircleCheck,
  LoaderCircle,
  type LucideIcon,
} from 'lucide-react';
import { cx } from '@shared/lib/class-names';

type StepState = 'done' | 'current' | 'pending';

const STATES: Record<
  StepState,
  { icon: LucideIcon; iconClass: string; textClass: string; label: string }
> = {
  done: {
    icon: CircleCheck,
    iconClass: 'text-success',
    textClass: 'text-ink',
    label: 'completado',
  },
  current: {
    icon: LoaderCircle,
    iconClass: 'animate-spin text-primary-500',
    textClass: 'font-semibold text-ink',
    label: 'en curso',
  },
  pending: {
    icon: Circle,
    iconClass: 'text-ink-subtle',
    textClass: 'text-ink-subtle',
    label: 'pendiente',
  },
};

export interface PaymentProgressProps {
  registered: boolean;

  submitted: boolean;
}

export function PaymentProgress({
  registered,
  submitted,
}: PaymentProgressProps) {
  const steps: { label: string; state: StepState }[] = [
    { label: 'Pedido registrado', state: registered ? 'done' : 'current' },
    {
      label: 'Cobro enviado a la pasarela',
      state: submitted ? 'done' : registered ? 'current' : 'pending',
    },
    {
      label: 'Resultado del pago',
      state: submitted ? 'current' : 'pending',
    },
  ];

  return (
    <ol className="flex flex-col gap-3">
      {steps.map(({ label, state }) => {
        const {
          icon: Icon,
          iconClass,
          textClass,
          label: stateLabel,
        } = STATES[state];
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex items-center gap-3 text-sm"
          >
            <Icon
              aria-hidden="true"
              className={cx('size-5 shrink-0', iconClass)}
            />
            <span className={textClass}>
              {label}
              <span className="sr-only"> ({stateLabel})</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

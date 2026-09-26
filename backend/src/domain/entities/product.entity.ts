export interface ProductProps {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Precio unitario en centavos de la moneda de la tienda. */
  readonly priceInCents: number;
  /** Unidades disponibles en inventario. */
  readonly stock: number;
  readonly imageUrl: string;
}

/**
 * Producto del inventario (aggregate root).
 *
 * Los productos solo se crean con el seed, así que por ahora la entidad
 * únicamente se reconstruye desde la persistencia. El comportamiento que
 * cambia su estado (descontar stock) llega con el módulo de transacciones.
 */
export class Product {
  private constructor(private readonly props: ProductProps) {}

  /** Reconstruye un producto ya persistido: sus datos fueron válidos al guardarse. */
  static reconstitute(props: ProductProps): Product {
    return new Product({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  /** Copia de los datos: modificarla no altera la entidad. */
  toPlainObject(): ProductProps {
    return { ...this.props };
  }
}

export interface ProductProps {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  readonly priceInCents: number;

  readonly stock: number;
  readonly imageUrl: string;
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static reconstitute(props: ProductProps): Product {
    return new Product({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  toPlainObject(): ProductProps {
    return { ...this.props };
  }
}

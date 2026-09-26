export const ID_GENERATOR = Symbol('ID_GENERATOR');

/** Identificadores únicos para las entidades nuevas (UUID v7). */
export interface IdGeneratorPort {
  generate(): string;
}

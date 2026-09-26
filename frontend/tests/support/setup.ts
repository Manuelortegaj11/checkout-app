// Matchers del DOM para expect: toBeInTheDocument, toHaveAccessibleName…
import '@testing-library/jest-dom';

// El checkout se persiste en localStorage: cada prueba empieza sin datos guardados.
afterEach(() => {
  localStorage.clear();
});

/**
 * Jest Setup - Configuración global para tests
 */

// Extender matchers de Jest
expect.extend({
  toBeCloseTo(received: number, expected: number, precision: number = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be close to ${expected}`
          : `Expected ${received} to be close to ${expected} (precision: ${precision})`,
    };
  },
});

// Timeout global para tests de DB
jest.setTimeout(10000);

// Mock console.error para tests más limpios
global.console = {
  ...console,
  error: jest.fn(), // Silenciar errores esperados en tests
};

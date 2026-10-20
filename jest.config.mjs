import nextJest from "next/jest.js";

// Carrega next.config e .env no ambiente de testes.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  // Regras puras: sem navegador. Testes de tela (jsdom) ficam para depois.
  testEnvironment: "node",
  moduleNameMapper: {
    // Mesmo alias do tsconfig ("@/*": ["./*"]).
    "^@/(.*)$": "<rootDir>/$1",
  },
};

// Exportado assim para o next/jest carregar a config do Next, que é assíncrona.
export default createJestConfig(config);

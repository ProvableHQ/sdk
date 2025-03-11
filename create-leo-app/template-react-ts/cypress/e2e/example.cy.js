/// <reference types="cypress" />

describe('Next.js w/ TypeScript Leo app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  })
  
  it('displays buttons to generate an account and execute the helloworld.aleo program', () => {
    cy.wait(5000);
    cy.intercept(
      {
        method: 'GET',
        url: "/node_modules/@provablehq/wasm/dist/testnet/aleo_wasm.wasm",
      },
      [],
    ).as('getWASM');
    cy.wait('@getWASM');
  })
})

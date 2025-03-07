/// <reference types="cypress" />

describe('Next.js w/ TypeScript Leo app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');

    cy.intercept(
      {
        method: 'GET',
        url: "/_next/static/media/aleo_wasm.1cab3621.wasm",
      },
      [],
    ).as('getWASM');
    cy.wait('@getWASM');
  })

  it('displays buttons to generate an account and execute the helloworld.aleo program', () => {
    const createAccountButton = cy.get('.create-account-button');
    createAccountButton.should('have.text', 'Click to generate account');

    const executeButton = cy.get('.execute-button');
    executeButton.should('have.text', 'Execute helloworld.aleo');

    createAccountButton.trigger('click');

    executeButton.trigger('click')
      .then(() => executeButton.should('have.text', 'Executing...check console for details...'));
  })
})

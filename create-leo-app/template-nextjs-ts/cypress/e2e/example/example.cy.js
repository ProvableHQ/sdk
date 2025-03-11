/// <reference types="cypress" />

describe('Next.js w/ TypeScript Leo app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');

    cy.intercept(
      {
        method: 'GET',
        url: "/_next/static/media/worker.d1850fbd.js",
      },
      [],
    ).as('getWorker');
    cy.intercept(
      {
        method: 'GET',
        url: "/_next/static/media/aleo_wasm.1cab3621.wasm",
      },
      [],
    ).as('getWASM');
    cy.wait('@getWASM');
    cy.wait('@getWorker');

  })

  it('displays buttons to generate an account and execute the helloworld.aleo program', () => {
    cy.on('window:alert', t => {
      console.log(t);
      alert(t);
    })
    const createAccountButton = cy.get('[data-test-id=create-account-button]');
    createAccountButton.should('have.text', 'Click to generate account');

    const executeButton = cy.get('[data-test-id=execute-button]');
    executeButton.should('have.text', 'Execute helloworld.aleo');

    createAccountButton.click()
      .then(() => createAccountButton.should('contain.text', 'Account private key is'));

    executeButton.click()
      .then(() => executeButton.should('have.text', 'Executing...check console for details...'));
  })
})

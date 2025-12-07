describe('Access Code verification testing', () => {
  before(() => {
    cy.deviceAuth.AuthenticateWithCloud();
    cy.window()
      .its('store')
      .invoke('dispatch', {
        type: 'appSettings/setAccessCode',
        payload: { value: '9080109' },
      });

    cy.activateDevice();
  });

  it('Access code verification', () => {
    cy.visit('http://localhost:2999');
    cy.contains('Access Code Required');

    cy.get('#access-code-modal-input__label').click().type('908');
    cy.get('#access-code-modal-button-submit').should('not.be.disabled');
    cy.get('#access-code-modal-button-submit').click();

    cy.get('.error-text', { timeout: 60000 }).then(($elem) => {
      expect($elem).to.contain('Invalid Access code.');
    });

    cy.wait(1000);

    //Make sure we are still in Access code window
    cy.contains('Access Code Required');

    //Now try entering the correct password
    cy.get('#access-code-modal-input__label').click().type('0109');
    cy.get('#access-code-modal-button-submit').click();

    //Make sure we are in the menu
    cy.get('.shim-menu-home');
    cy.contains('Channel');
  });
});

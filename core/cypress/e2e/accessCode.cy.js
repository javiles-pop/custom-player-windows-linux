describe('Access Code testing', () => {
  before(() => {
    // Set redux to bypass the activation screen
    cy.visit('http://localhost:2999');
    cy.activateDevice();
  });

  it('Access code', () => {
    cy.get('.title').contains('Access Code').click();
    cy.contains('Access Code');

    //By default save should be disabled
    cy.get('#acccess-code-button-save').should('be.disabled');

    //vefify if user could set access code
    cy.wait(500);
    cy.get('#access-code-settings-code__label').click().type('202190');

    cy.get('#acccess-code-button-save').should('not.be.disabled');
    cy.get('#acccess-code-button-save').click();

    //check if access code is verified
    cy.get('.user-feedback').should('have.text', 'Access code set.');

    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.accessCode).to.be.a('string').and.equal('202190');
      });

    //verify clear access code button
    cy.get('#acccess-code-button-clear').click();
    cy.get('.user-feedback').should('have.text', 'Access code removed.');

    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.accessCode).to.be.a('string').and.equal('');
      });

    //vefify if user type more than 6 digit pass code
    cy.wait(500);
    cy.get('#access-code-settings-code__label').click().type('9091908');

    cy.get('#acccess-code-button-save').click();

    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.accessCode).to.be.a('string').and.equal('9091908');
      });
  });
});

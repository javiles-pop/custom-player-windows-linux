describe('Shim Activation', () => {
  let offline = false;
  it('establish network connection', () => {
    cy.visit('http://localhost:2999');

    cy.get('.launch-header').find('img').should('be.visible');

    cy.get('.step').contains('Establishing network connection');

    cy.get('.step-spinner').contains('1');

    cy.get('.step-spinner').then(($elem) => {
      if ($elem.hasClass('error')) {
        expect($elem.siblings().hasClass('error-text')).to.be.true;

        offline = true;
      } else {
        cy.get('.step-spinner').should('have.class', 'active');

        cy.get('.step-spinner').should('have.class', 'complete');
      }
    });
  });

  it('check player connection', () => {
    if (!offline) {
      cy.visit('http://localhost:2999');

      cy.get('.step').contains('Checking player registration');

      cy.get('.step-spinner').contains('2');

      cy.get('.step-spinner').then(($elem) => {
        if ($elem.hasClass('error')) {
          expect($elem.siblings().hasClass('error-text')).to.be.true;
        } else {
          cy.get('.step-spinner').should('have.class', 'active');
        }
      });

      cy.get('.invite-code-input', { timeout: 60000 }).then(($elem) => {
        cy.get('#inviteCodeInput').type('{enter}');
        cy.get('.invite-code-input').type('testin', {force: true});
        cy.wait(1000);

        // make sure the submit button gets autofocused
        const submitButton = cy.get('#invite-code-button-submit');
        submitButton.should('have.focus');
        submitButton.click();

        cy.get('.error-text', { timeout: 60000 }).then(($elem) => {
          expect($elem).to.contain('Matching invite code was not found');
        });
      });
    }
  });
});

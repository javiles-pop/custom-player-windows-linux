describe('Shim Channels', () => {
  beforeEach(() => {
    cy.visit('http://localhost:2999');
    cy.activateDevice();
  });

  after(() => {
    // clear the deployment url for other tests
    cy.window().then(win => {
      win.DeviceAPI.dispatch('appSettings/setCurrentURL', {value: ''});
    })
  });

  it('has channel url field', () => {
    cy.wait(1500);
    cy.contains('Channel').click();

    cy.wait(1000);
    //enter the channel url
    cy.get('#deployment-url').click({ force: true }).type('https://google.com');

    cy.get('#deployment-url-button__verify').click();

    //check if url is verified, if not check for error message
    cy.get('.error-text');
    cy.get('.user-feedback', { timeout: 200000 }).should('have.text', 'Error: URL is not a valid Web Player instance');

    cy.get('#deployment-url')
      .click({ force: true })
      .clear()
      .type('https://tst-cm.fwitest.net/cpweb516/?sign=andeverything&client=ct1');

    cy.wait(1000);
    //click the verify button
    cy.get('#deployment-url-button__verify').click();

    //check if url is verified
    cy.get('.user-feedback', { timeout: 400000 }).should('have.text', 'URL Verified');
  });
});

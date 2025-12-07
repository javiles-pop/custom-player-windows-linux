describe('Updates Testing', () => {
  before(() => {
    cy.deviceAuth.AuthenticateWithCloud();
  });

  it('Software section', () => {
    cy.wait(2000);
    cy.contains('Updates').click();

    cy.contains('Software');

    // verify if we could enter software update url
    cy.contains('Software Update URL');

    cy.wait(1000);

    cy.get('#software-update-url').click({ force: true }).type('https://softwareupdateurl.com');

    cy.contains('Check for software updates daily');

    //verify if software updates daily is a check box that could be toggled
    cy.wait(500);
    cy.get('#daily-software-update-checkbox').check();

    //vefify if we enter 22:18, it defaults to 10:18 PM with PM toggled
    cy.wait(500);
    cy.get('#software-update-time__hidden-input').click().type('{enter}').type('2218');

    cy.get('#software-update-time__ui__meridiem-toggle').should('be.checked');

    cy.get('#software-update-time__ui_segmented-number__0').contains('1');
    cy.get('#software-update-time__ui_segmented-number__1').contains('0');
    cy.get('#software-update-time__ui_segmented-number__2').contains('1');
    cy.get('#software-update-time__ui_segmented-number__3').contains('8');

    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.checkForSoftwareUpdateTime).to.be.a('string').and.equal('22:18:00');
      });

    //vefify if we enter 26:00, should return error.
    cy.wait(500);
    cy.get('#software-update-time__hidden-input').clear().type('2600{enter}');

    cy.get('.segmented-number-display').should('have.class', 'has-errors');

    //vefify if we enter 01:24 AM, PM should not be toggled
    cy.wait(500);
    cy.get('#software-update-time__hidden-input').clear().click().type('0124{enter}');

    cy.get('#software-update-time__ui__meridiem-toggle').should('not.be.checked');
    cy.get('#software-update-time__ui__meridiem-toggle').check();
  });

  it('Hardware section', () => {
    cy.contains('Updates').click();

    cy.contains('Hardware');

    // vefify if we enter 00:15, it defaults to 12:15.
    cy.wait(500);

    // verify if we could enter firmware update url
    cy.get('#firmware-update-url').click({ force: true }).type('https://firmwareupdateurl.com');

    // verify if firmware updates is a check box that could be toggled
    cy.get('#daily-firmware-update-checkbox').check();

    // verify is user entered more than 4 chars and deleted last char, the time should pick it up
    cy.wait(500);
    cy.get('#firmware-update-time__hidden-input').type('{enter}').clear().type('180015').should('have.value', '1800');

    cy.get('#firmware-update-time__hidden-input').type('{backspace}');
    cy.get('#software-update-time__ui_segmented-number__3')
      .each(($el, index) => {
        if (index == 3) {
          cy.wrap($el).contains('');
        }
      })
      .then(() => {
        return;
    });
    cy.get('#firmware-update-time__hidden-input').type('{enter}').clear().type('160015').should('have.value', '1600');
    cy.get('#firmware-update-time__ui_segmented-number__0').contains('0');
    cy.get('#firmware-update-time__ui_segmented-number__1').contains('4');
    cy.get('#firmware-update-time__ui_segmented-number__2').contains('0');
    cy.get('#firmware-update-time__ui_segmented-number__3').contains('0');
    cy.get('#firmware-update-time__ui__meridiem-toggle').should('be.checked');
  });
});

// Needs tests for Time server url and Time zone.

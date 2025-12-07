describe('Advanced testing', () => {
  before(() => {
    cy.deviceAuth.AuthenticateWithCloud();
  });

  it('Hardware section', () => {
    cy.contains('Advanced').click();

    cy.contains('Hardware');
    cy.contains('Reboot daily at a random time starting at');
    cy.wait(500);

    //verify if reboot daily is a check box that could be toggled
    cy.get('#daily-reboot-checkbox').check();

    //vefify if we enter 00:15, it defaults to 12:15.
    cy.wait(500);
    cy.get('#daily-reboot-time__hidden-input').click().type('{enter}').type('0015');

    cy.get('#daily-reboot-time__ui__meridiem-toggle').should('not.be.checked');

    cy.get('#daily-reboot-time__ui_segmented-number__0').contains('1');
    cy.get('#daily-reboot-time__ui_segmented-number__1').contains('2');
    cy.get('#daily-reboot-time__ui_segmented-number__2').contains('1');
    cy.get('#daily-reboot-time__ui_segmented-number__3').contains('5');

    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.rebootTime).to.be.a('string').and.equal('00:15:00');
      });

    //vefify if we enter 00:10 PM, it defaults to 12:10 AM with PM toggled.
    cy.wait(500);
    cy.get('#daily-reboot-time__hidden-input').clear().type('0010{enter}');

    cy.get('#daily-reboot-time__ui__meridiem-toggle').check();
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.rebootTime).to.be.a('string').and.equal('12:10:00');
      });

    cy.get('#daily-reboot-time__ui__meridiem-toggle').should('be.checked');

    //vefify if we enter 24:00, it defaults to 12:00 AM with PM not toggled.
    cy.wait(500);
    cy.get('#daily-reboot-time__hidden-input').clear().type('2400');

    cy.get('#daily-reboot-time__ui__meridiem-toggle').should('not.be.checked');
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.rebootTime).to.be.a('string').and.equal('00:00:00');
      });
  });

  it('TimeZone Modal', () => {
    cy.get('#openTimeZoneModal').click();
    const modal = cy.get('#timezone-options');

    // Verify if the modal is open
    expect(modal.should('be.visible'));
    modal.type('{esc}');
    expect(modal.should('not.be.visible'));
  });

  it('Player Cache section', () => {
    cy.contains('Advanced').click();

    cy.contains('Player Cache');
    cy.wait(500);

    cy.get('#shim-button-clear-cache').click();
    cy.wait(500);
    cy.get('#cache-feedback').contains('Cache cleared.');

    //Verify all the redux changes
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.wantReboot).to.equal(true);
        expect(state.appSettings.rebootTime).to.equal('00:00:00');
      });
  });
});

// Needs tests for Time server url and Time zone.

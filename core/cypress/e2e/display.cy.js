describe('Display', () => {
  before(() => {
    cy.deviceAuth.AuthenticateWithCloud();
  });


  it('Orientation section', () => {
    cy.contains('Display').click();

    cy.contains('ORIENTATION');

    //should be all 4 orientations
    cy.get('.fwi-radio-button[value="0"]').should('exist');
    cy.get('.fwi-radio-button[value="90"]').should('exist');
    cy.get('.fwi-radio-button[value="180"]').should('exist');
    cy.get('.fwi-radio-button[value="270"]').should('exist');

    // radio buttions should be set to 0 initially
    cy.get('.fwi-radio-button[value="0"]').should('be.checked');

    //change to 90
    cy.get('.fwi-radio-button[value="90"]').click();

    cy.get('.fwi-radio-button[value="90"]').should('be.checked');

  });

  it('Display Control section', () => {

    cy.contains('Display Control');
    cy.contains('Select method to toggle display on and off');
    cy.wait(500);

    //verify if the radio buttons are checked or not
    cy.get('#display_control_hdmi').should('be.checked');
    cy.get('#display_control_cec').should('not.be.checked');

    cy.get('#display_control_cec').check();

    //Verify all the redux changes
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.CECEnabled).to.be.a('boolean').and.equal(true);
      });
  });


  it('Resolution section', () => {
    cy.contains('RESOLUTION');

    cy.get('#resolution-switcher__open-close-toggle').should('exist');

    //value of text node should be resolution
    cy.get('#resolution-switcher__selected-option').should('have.text', '1920 x 1080 @60Hz');

    // The top option should always be the best resolution for the display.
    cy.get('#resolution-switcher__option-0').should('contain.text', '(Recommended)');
  });

});

describe('About Testing', () => {
  beforeEach(() => {
    cy.visit('http://localhost:2999');
    cy.activateDevice();
  });

  it('About section', () => {
    cy.wait(1500);
    cy.contains('About').click();

    //Verify if About contains exit and back button
    cy.get('.child').contains('About');
    cy.get('.exit-menu-button').should('exist');
    cy.get('.back-button').should('exist');

    //Verify if all the fields in Platform section are present
    cy.get('.platform').contains('Model');
    cy.get('.platform').contains('Serial Number');
    cy.get('.platform').contains('Firmware Version');
    cy.get('.platform').contains('Manufacturer');

    //Verify if all the fields in Network section are present
    cy.get('.network').contains('IP Address');
    cy.get('.network').contains('MAC Address');
  });
});

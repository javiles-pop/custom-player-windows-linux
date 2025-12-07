describe('System Monitoring Page', () => {
  before(() => {
    cy.visit('http://localhost:2999');
    cy.activateDevice();
    cy.contains('About').click();
    cy.wait(2000);
  });

  it('has CPU graph', () => {
    cy.get('#CPUChart').should('exist');
  });

  it('has RAM graph', () => {
    cy.get('#MemoryChart').should('exist');
  });
  it('has Storage graph', () => {
    cy.get('#StorageChart').should('exist');
  });

  it('has valid reboot time', () => {
    cy.get('#last-reboot').contains(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) ([a-z]{3,9}) \d{1,2}, \d{4} \d{1,2}:\d{2} (AM|PM)/i);
  });
});

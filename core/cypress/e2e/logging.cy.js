describe('Logging level section testing', () => {
  before(() => {
    cy.visit('http://localhost:2999');
    cy.activateDevice();

    cy.window().its('store').invoke('dispatch', {
      type: 'appSettings/setUploadLogTimeInterval',
      payload: '60',
    });
  });

  it('Logging', () => {
    cy.wait(1500);
    cy.contains('Logging').click();
    cy.contains('LOGGING LEVEL');

    cy.get('.log-level')
      .each(($el, index) => {
        if (index === 0) {
          cy.wrap($el).should('have.descendants', 'button');
          cy.wrap($el).contains('Error');
        }
        if (index === 1) {
          cy.wrap($el).should('have.descendants', 'button');
          cy.wrap($el).contains('Warn');
        }
        if (index === 2) {
          cy.wrap($el).should('have.descendants', 'button');
          cy.wrap($el).contains('Info');
        }
        if (index === 3) {
          cy.wrap($el).should('have.descendants', 'button');
          cy.wrap($el).contains('Debug');
        }
        if (index === 4) {
          cy.wrap($el).should('have.descendants', 'button');
          cy.wrap($el).contains('Trace');
        }
      })
      .then(($lis) => {
        expect($lis).to.have.length(5);
      });

    //On initial load warn is default
    cy.get('.indicator-wrapper')
      .each(($el, index) => {
        if (index === 1) {
          cy.wrap($el).should('have.class', 'selected');
        }
      })
      .then(($lis) => {
        return;
      });

    //Make sure error is selected
    cy.contains('Error').click();
    cy.get('.indicator-wrapper')
      .each(($el, index) => {
        if (index === 0) {
          cy.wrap($el).should('have.class', 'selected');
        }
      })
      .then(($lis) => {
        return;
      });
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.logLevel).to.be.a('string').and.equal('ERROR');
      });

    //Make sure warn is selected
    cy.contains('Warn').click();
    cy.get('.indicator-wrapper')
      .each(($el, index) => {
        if (index === 1) {
          cy.wrap($el).should('have.class', 'selected');
        }
      })
      .then(($lis) => {
        return;
      });
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.logLevel).to.be.a('string').and.equal('WARN');
      });

    //Make sure info is selected
    cy.contains('Info').click();
    cy.get('.indicator-wrapper')
      .each(($el, index) => {
        if (index === 2) {
          cy.wrap($el).should('have.class', 'selected');
        }
      })
      .then(($lis) => {
        return;
      });
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.logLevel).to.be.a('string').and.equal('INFO');
      });

    //Make sure debug is selected
    cy.contains('Debug').click();
    cy.get('.indicator-wrapper')
      .each(($el, index) => {
        if (index === 3) {
          cy.wrap($el).should('have.class', 'selected');
        }
      })
      .then(($lis) => {
        return;
      });
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.logLevel).to.be.a('string').and.equal('DEBUG');
      });

    //Make sure trace is selected
    cy.contains('Trace').click();
    cy.get('.indicator-wrapper')
      .each(($el, index) => {
        if (index === 4) {
          cy.wrap($el).should('have.class', 'selected');
        }
      })
      .then(($lis) => {
        return;
      });

    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.logLevel).to.be.a('string').and.equal('TRACE');
      });

    // Verify the log upload interval
    cy.contains('Harmony');
    // Make sure the drop down reflects the value in redux store
    cy.contains('Hour');

    // Select 15 minutes
    cy.contains('15 Minutes').click({ force: true });

    // Make sure redux is updated with new value
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.uploadLogTimeInterval).to.be.a('string').and.equal('15');
      });

    // Make sure the value is retained even after going back
    cy.get('.back-button').click();
    cy.contains('Logging').click();

    cy.contains('15 Minutes');

    // Test if schedule timers are created for 12 and 24 hours logging intervals
    // Select 12 hours
    cy.contains('12 Hours').click({ force: true });
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        const scheduleTasks = state.appSettings.scheduledTasks;
        cy.wrap(scheduleTasks).each((task) => {
          if (task.name === 'Upload logs every 12 hours') {
            const { executionTime } = task;
            const minutes = Math.floor(Math.abs(executionTime - new Date()) / 1000 / 60);
            cy.wrap(minutes).should('be.gte', 719); // greater than equal to
            cy.wrap(minutes).should('be.lte', 720); // less than equal to
          }
        });
        expect(state.appSettings.uploadLogTimeInterval).to.be.a('string').and.equal('720');
      });

    // Select 24 hours
    cy.contains('Day').click({ force: true });
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        const scheduleTasks = state.appSettings.scheduledTasks;
        cy.wrap(scheduleTasks).each((task) => {
          if (task.name === 'Upload logs every 24 hours') {
            const { executionTime } = task;
            const minutes = Math.floor(Math.abs(executionTime - new Date()) / 1000 / 60);
            cy.wrap(minutes).should('be.gte', 1439); // greater than equal to
            cy.wrap(minutes).should('be.lte', 1440); // less than equal to
          }
        });
        expect(state.appSettings.uploadLogTimeInterval).to.be.a('string').and.equal('1440');
      });
  });
});

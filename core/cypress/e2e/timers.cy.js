describe('Timer testing', () => {
  before(() => {
    cy.visit('http://localhost:2999');
    cy.activateDevice();
  });

  it('Timers', () => {
    cy.contains('Timers').click();
    cy.contains('Enable on/off timers');
    cy.get('#shim-timers-checkbox').should('not.be.checked');

    //If timers are unchecked then verify if new button is disabled
    cy.get('#add-timers-button').should('be.disabled');

    //Verify if we could create new timer
    cy.get('#shim-timers-checkbox').check();
    cy.get('#add-timers-button').click();
    cy.contains('Add Timer');

    //Make sure create is disabled on initial load.
    cy.get('#add-new-timer__create-button').should('be.disabled');

    cy.get('#Su').should('have.text', 'Su');
    cy.get('#Mo').should('have.text', 'Mo');
    cy.get('#Tu').should('have.text', 'Tu');
    cy.get('#We').should('have.text', 'We');
    cy.get('#Th').should('have.text', 'Th');
    cy.get('#Fr').should('have.text', 'Fr');
    cy.get('#Sa').should('have.text', 'Sa');

    cy.contains('Turn power on at:');
    cy.contains('Turn power off at:');

    cy.get('#Mo').click();
    cy.get('#We').click();
    cy.get('#Fr').click();

    //Make sure create is disabled.
    cy.get('#add-new-timer__create-button').should('be.disabled');

    cy.get('#add-new-timer__on-time__hidden-input').click().type('{enter}').type('0830');

    //Make sure create is disabled.
    cy.get('#add-new-timer__create-button').should('be.disabled');

    cy.get('#add-new-timer__off-time__hidden-input').click().type('{enter}').type('1845');

    cy.get('#add-new-timer__on-time__ui__meridiem-toggle').should('not.be.checked');
    cy.get('#add-new-timer__off-time__ui__meridiem-toggle').should('be.checked');

    //Make sure create is enabled.
    cy.get('#add-new-timer__create-button').should('not.be.disabled');

    // Now try editing one of the timers and verify if this disables create button
    cy.get('#add-new-timer__off-time__hidden-input').click().type('{backspace}');
    cy.get('#add-new-timer__create-button').should('be.disabled');

    cy.get('#add-new-timer__off-time__hidden-input').click().type('5');

    //Make sure create is enabled.
    cy.get('#add-new-timer__create-button').should('not.be.disabled');
    cy.get('#add-new-timer__create-button').click();

    // Verify if value is added to list
    cy.get('.timer-table').should('have.descendants', 'td');
    cy.get('.timer-table').contains('td', 'Mo, We, Fr');
    cy.get('.timer-table').contains('td', '08:30 AM - 06:45 PM');
    cy.get('.timer-table').contains('td', 'Remove');

    const onOffTimers = {
      days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      offTime: '18:45:00',
      onTime: '08:30:00',
      timerUUID: 'mowefr083000184500',
    };

    //Verify it redux is updated
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.onOffTimers).to.be.a('array').and.to.deep.eq([onOffTimers]);
      });

    // Click remove and verify if table is empty
    cy.contains('Remove').click();
    cy.get('.timer-table').should('not.exist');

    //Verify it redux is updated
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.onOffTimers).to.be.a('array').and.to.deep.eq([]);
      });

    //make sure the fields are empty.
    cy.get('#add-timers-button').click();
    cy.get('#add-new-timer__on-time__hidden-input').should('have.value', '');
    cy.get('#add-new-timer__off-time__hidden-input').should('have.value', '');
    cy.get('#add-new-timer__on-time__ui__meridiem-toggle').should('not.be.checked');
    cy.get('#add-new-timer__off-time__ui__meridiem-toggle').should('not.be.checked');

    //Verify if all the days are selected
    cy.get('#Su').click();
    cy.get('#Mo').click();
    cy.get('#Tu').click();
    cy.get('#We').click();
    cy.get('#Th').click();
    cy.get('#Fr').click();
    cy.get('#Sa').click();

    cy.get('#add-new-timer__on-time__hidden-input')
      .click()
      //.type('{enter}')
      .clear()
      .type('0915');

    cy.get('#add-new-timer__off-time__hidden-input')
      .click()
      //.type('{enter}')
      .clear()
      .type('2250');

    cy.get('#add-new-timer__create-button').click();

    // Verify if value is added to list
    cy.get('.timer-table').should('have.descendants', 'td');
    cy.get('.timer-table').contains('td', 'Every day');
    cy.get('.timer-table').contains('td', '09:15 AM - 10:50 PM');
    cy.get('.timer-table').contains('td', 'Remove');

    const newOnOffTimers = {
      days: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      onTime: '09:15:00',
      offTime: '22:50:00',
      timerUUID: 'sumotuwethfrsa091500225000',
    };

    //Verify it redux is updated
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.onOffTimers).to.be.a('array').and.to.deep.eq([newOnOffTimers]);
      });

    // Try creating a new timer with errors
    // FAILING
    cy.get('#timers__create-new-timer-button').click();
    cy.get('#Mo').click();
    cy.get('#Fr').click();

    cy.get('#add-new-timer__on-time__hidden-input')
      .click()
      //.type('{enter}')
      .clear()
      .type('2890');

    // Now click cancel button with error input and click new again. The error should be cleared out on relaunch. FAILING
    // FAILING
    cy.get('#add-new-timer__cancel-button').click();
    cy.get('#timers__create-new-timer-button').click();

    cy.get('#add-new-timer__on-time__hidden-input').should('have.value', '');

    cy.get('.segmented-number-display')
      .each(($el, index) => {
        if (index == 1) {
          cy.wrap($el).should('not.have.class', 'has-errors');
        }
      })
      .then(() => {
        return;
      });

    // Try creating mutiple timers. 2.1 Bug where it failed to create mutiple timers
    cy.get('#Mo').click();
    cy.get('#Fr').click();
    cy.get('#add-new-timer__on-time__hidden-input').click().type('{enter}').type('0940');
    cy.get('#add-new-timer__off-time__hidden-input').click().type('{enter}').type('1645');
    cy.get('#add-new-timer__create-button').click();

    // Add third timer
    cy.get('#timers__create-new-timer-button').click();
    cy.get('#Tu').click();
    cy.get('#Th').click();
    cy.get('#add-new-timer__on-time__hidden-input').click().type('{enter}').type('0615');
    cy.get('#add-new-timer__off-time__hidden-input').click().type('{enter}').type('1205');
    cy.get('#add-new-timer__create-button').click();

    const onAndOffTimers = [
      {
        days: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
        offTime: '22:50:00',
        onTime: '09:15:00',
        timerUUID: 'sumotuwethfrsa091500225000',
      },
      {
        days: ['MONDAY', 'FRIDAY'],
        offTime: '16:45:00',
        onTime: '09:40:00',
        timerUUID: 'mofr094000164500',
      },
      {
        days: ['TUESDAY', 'THURSDAY'],
        offTime: '12:05:00',
        onTime: '06:15:00',
        timerUUID: 'tuth061500120500',
      },
    ];

    //Verify it redux is updated
    cy.window()
      .its('store')
      .invoke('getState')
      .then((state) => {
        expect(state.appSettings.onOffTimers).to.be.a('array').and.to.deep.eq(onAndOffTimers);
      });
  });
});

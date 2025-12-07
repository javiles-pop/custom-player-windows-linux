// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })


Cypress.Commands.add('activateDevice', () => {
  cy.window().its('store').invoke('dispatch', {
    type: 'appSettings/setDeviceID',
    payload: '80a9492e-9805-4067-bc63-174decea00cc',
  });

  const devicePayload = {
    cognitoClientId: '1p76t3pa457dd6sneaomvru1ct',
    cognitoUserPoolId: 'us-west-2_tD1iignQA',
    companyId: '44f90086-f673-479b-85bc-acebfb137be5',
    deviceId: '80a9492e-9805-4067-bc63-174decea00cc',
    key: 'U2FsdGVkX188/5k6QcmCKov3P4E9MVtSZIS2Zry+9V4=',
  };

  const awsSettings = {
    cognitoClientId: "1p76t3pa457dd6sneaomvru1ct",
    cognitoFedPoolId: "us-west-2:ce7432a5-d003-47a1-ab20-e2ecbc7fef83",
    cognitoUserPoolId: "us-west-2_tD1iignQA",
    endpointAddress: "a1yww2plasi3h9-ats.iot.us-west-2.amazonaws.com",
    region: "us-west-2",
  };
  cy.window().its('store').invoke('dispatch', {
    type: 'FWICloud/setProvisionedDevicePayload',
    payload: devicePayload,
  });

  cy.window().its('store').invoke('dispatch', {
    type: 'appSettings/setAwsSettings',
    payload: awsSettings,
  });

  cy.window().its('store').invoke('dispatch', {
    type: 'appSettings/setActivated',
    payload: true,
  });
})

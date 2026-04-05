describe('Activate Account Component - Employee', () => {

  it('treba da prikaže grešku ako nema tokena', () => {
    cy.visit('/auth/activate-account');
    cy.contains('Nevalidan link').should('be.visible');
    cy.contains('Ovaj aktivacioni link je nevalidan ili je istekao').should('be.visible');
  });

  it('treba da prikaže formu za kreiranje lozinke ako je token validan (employee)', () => {
    cy.intercept('GET', '**/employees/auth/checkActivate**', {
      statusCode: 200,
      body: 123
    }).as('checkToken');

    cy.visit('/auth/activate-account?token=valid-token');
    cy.wait('@checkToken');

    cy.contains('Aktivirajte nalog').should('be.visible');
    cy.get('input[name="password"]').should('exist');
    cy.get('input[name="confirmPassword"]').should('exist');
  });

  it('treba da prikaže grešku ako je token nevalidan po API-ju', () => {
    cy.intercept('GET', '**/employees/auth/checkActivate**', {
      statusCode: 400,
      body: { message: 'Token je istekao' }
    }).as('checkTokenErr');

    cy.visit('/auth/activate-account?token=invalid-token');
    cy.wait('@checkTokenErr');

    cy.contains('Nevalidan link').should('be.visible');
    cy.contains('Token je istekao').should('exist');
  });

  it('treba uspešno da aktivira employee nalog', () => {
    cy.intercept('GET', '**/employees/auth/checkActivate**', {
      statusCode: 200,
      body: 123
    }).as('checkToken');

    cy.intercept('POST', '**/employees/auth/activate', {
      statusCode: 200,
      body: 'Nalog uspešno aktiviran'
    }).as('activateAccount');

    cy.visit('/auth/activate-account?token=valid-token');
    cy.wait('@checkToken');

    cy.get('input[name="password"]').type('NovaLozinka123!');
    cy.get('input[name="confirmPassword"]').type('NovaLozinka123!');
    cy.contains('button', /Aktiviraj nalog/i).click();

    cy.wait('@activateAccount');
  });

});

describe('Activate Account Component - Client', () => {

  it('treba da prikaže formu za kreiranje lozinke ako je token validan (client)', () => {
    cy.intercept('GET', '**/clients/auth/checkActivate**', {
      statusCode: 200,
      body: 456
    }).as('checkTokenClient');

    cy.visit('/auth/activate-client?token=client-valid-token');
    cy.wait('@checkTokenClient');

    cy.contains('Aktivirajte nalog').should('be.visible');
  });

  it('treba uspešno da aktivira client nalog', () => {
    cy.intercept('GET', '**/clients/auth/checkActivate**', {
      statusCode: 200,
      body: 456
    }).as('checkTokenClient');

    cy.intercept('POST', '**/clients/auth/activate', {
      statusCode: 200,
      body: 'Nalog klijenta uspešno aktiviran'
    }).as('activateClient');

    cy.visit('/auth/activate-client?token=client-valid-token');
    cy.wait('@checkTokenClient');

    cy.get('input[name="password"]').type('ClientLozinka123!');
    cy.get('input[name="confirmPassword"]').type('ClientLozinka123!');
    cy.contains('button', /Aktiviraj nalog/i).click();

    cy.wait('@activateClient');
  });

});

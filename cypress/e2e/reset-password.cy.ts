describe('Reset Password Component', () => {

  it('treba da prikaže grešku ako nema tokena', () => {
    cy.visit('/auth/reset-password');
    cy.contains('Nevalidan link').should('be.visible');
    cy.contains('Ovaj link za resetovanje je nevalidan ili je istekao.').should('be.visible');
  });

  it('treba da prikaže formu ako je token validan', () => {
    cy.intercept('GET', '**/employees/auth/checkResetPassword**', {
      statusCode: 200,
      body: 123
    }).as('checkToken');

    cy.visit('/auth/reset-password?token=valid-token');
    cy.wait('@checkToken');

    cy.contains('Postavite novu lozinku').should('be.visible');
    cy.get('input[name="password"]').should('exist');
    cy.get('input[name="confirmPassword"]').should('exist');
  });

  it('treba da prikaže grešku ako je token nevalidan po API-ju', () => {
    cy.intercept('GET', '**/employees/auth/checkResetPassword**', {
      statusCode: 400,
      body: { message: 'Token je istekao' }
    }).as('checkTokenErr');

    cy.visit('/auth/reset-password?token=invalid-token');
    cy.wait('@checkTokenErr');

    cy.contains('Nevalidan link').should('be.visible');
    cy.contains('Token je istekao').should('exist');
  });

  it('treba uspešno da resetuje lozinku', () => {
    cy.intercept('GET', '**/employees/auth/checkResetPassword**', {
      statusCode: 200,
      body: 123
    }).as('checkToken');

    cy.intercept('POST', '**/employees/auth/resetPassword', {
      statusCode: 200,
      body: 'Lozinka uspešno resetovana'
    }).as('resetPassword');

    cy.visit('/auth/reset-password?token=valid-token');
    cy.wait('@checkToken');

    cy.get('input[name="password"]').type('NovaLozinka123!');
    cy.get('input[name="confirmPassword"]').type('NovaLozinka123!');
    cy.contains('button', /Resetuj lozinku/i).click();

    cy.wait('@resetPassword');
  });

  it('odlaže validaciju ako se unesu lozinke koje se ne poklapaju', () => {
    cy.intercept('GET', '**/employees/auth/checkResetPassword**', {
      statusCode: 200,
      body: 123
    }).as('checkToken');

    cy.visit('/auth/reset-password?token=valid-token');
    cy.wait('@checkToken');

    cy.get('input[name="password"]').type('NovaLozinka123!');
    cy.get('input[name="confirmPassword"]').type('LosaLozinka123!').blur();

    // Dugme treba biti onemogućeno pošto se forme ne poklapaju
    cy.contains('button', /Resetuj lozinku/i).should('be.disabled');
  });

});

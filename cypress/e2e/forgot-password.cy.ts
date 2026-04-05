describe('Forgot Password Component', () => {

  beforeEach(() => {
    cy.visit('/auth/forgot-password');
  });

  it('treba da prikaže formu za zaboravljenu lozinku', () => {
    cy.contains('Zaboravljena lozinka').should('be.visible');
    cy.get('input[type="email"]').should('exist');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('treba uspešno da podnese validan email i prikaže ekran za uspeh', () => {
    cy.intercept('POST', '**/employees/auth/forgot-password', {
      statusCode: 200,
      body: 'Success'
    }).as('forgotPassword');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();

    cy.wait('@forgotPassword');
    cy.contains('Proverite email').should('be.visible');
    cy.contains('test@example.com').should('be.visible');
  });

  it('treba da prikaže grešku ukoliko API vrati grešku', () => {
    cy.intercept('POST', '**/employees/auth/forgot-password', {
      statusCode: 400,
      body: 'Korisnik ne postoji'
    }).as('forgotPasswordError');

    cy.get('input[type="email"]').type('nepostoji@example.com');
    cy.get('button[type="submit"]').click();

    cy.wait('@forgotPasswordError');
    // Angular HttpError fallback kad je text response
    cy.contains('Failed to send reset link. Please try again.').should('be.visible');
  });

  it('treba da navigira nazad na prijavu', () => {
    cy.contains('button', /Nazad na prijavu/i).click();
    cy.url().should('include', '/login');
  });

});

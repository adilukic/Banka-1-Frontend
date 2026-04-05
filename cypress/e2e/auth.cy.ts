// cypress/e2e/auth.cy.ts
// E2E testovi za Auth flow (login, logout, token management)
// Pokretanje: npx cypress open  ili  npx cypress run

describe('Auth E2E', () => {

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  // ─────────────────────────────────────────────
  // LOGIN — forma
  // ─────────────────────────────────────────────

  describe('Login forma', () => {

    beforeEach(() => {
      cy.visit('/login');
    });

    it('treba da prikaže email, password i login dugme', () => {
      cy.get('[data-cy=email]').should('exist');
      cy.get('[data-cy=password]').should('exist');
      cy.get('[data-cy=login-btn]').should('exist');
    });

    it('uspešno logovanje čuva token u localStorage', () => {
      // Izazvati fallback sa clients na employees
      cy.intercept('POST', '**/clients/auth/login', {
        statusCode: 401,
        body: { message: 'Ne postoji klijent' }
      }).as('clientLoginRequest');

      cy.intercept('POST', '**/employees/auth/login', {
        statusCode: 200,
        body: {
          jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock',
          refreshToken: 'refresh-mock',
          role: 'EmployeeAdmin',
          permissions: ['READ', 'WRITE']
        }
      }).as('employeeLoginRequest');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@clientLoginRequest');
      cy.wait('@employeeLoginRequest');

      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken'))
          .to.equal('eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock');
      });
    });

    it('uspešno logovanje čuva korisnika u localStorage', () => {
      cy.intercept('POST', '**/clients/auth/login', {
        statusCode: 401,
        body: { message: 'Ne postoji klijent' }
      }).as('clientLoginRequest');

      cy.intercept('POST', '**/employees/auth/login', {
        statusCode: 200,
        body: {
          jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock',
          refreshToken: 'refresh-mock',
          role: 'EmployeeAdmin',
          permissions: ['READ', 'WRITE']
        }
      }).as('employeeLoginRequest');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@clientLoginRequest');
      cy.wait('@employeeLoginRequest');

      cy.window().then(win => {
        const user = JSON.parse(win.localStorage.getItem('loggedUser') || '{}');
        expect(user.email).to.equal('user@test.com');
        expect(user.permissions).to.include('READ');
        expect(user.permissions).to.include('WRITE');
      });
    });

    it('neuspešno logovanje ne čuva token u localStorage', () => {
      cy.intercept('POST', '**/clients/auth/login', {
        statusCode: 401,
        body: { message: 'Neispravni kredencijali' }
      }).as('clientLoginFail');

      cy.intercept('POST', '**/employees/auth/login', {
        statusCode: 401,
        body: { message: 'Neispravni kredencijali' }
      }).as('employeeLoginFail');

      cy.get('[data-cy=email]').type('wrong@test.com');
      cy.get('[data-cy=password]').type('wrongpass');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@clientLoginFail');
      cy.wait('@employeeLoginFail');

      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });

    it('neuspešno logovanje prikazuje error poruku', () => {
      cy.intercept('POST', '**/clients/auth/login', {
        statusCode: 401,
        body: { message: 'Neispravni kredencijali' }
      }).as('clientLoginFail');

      cy.intercept('POST', '**/employees/auth/login', {
        statusCode: 401,
        body: { message: 'Neispravni kredencijali' }
      }).as('employeeLoginFail');

      cy.get('[data-cy=email]').type('wrong@test.com');
      cy.get('[data-cy=password]').type('wrongpass');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@clientLoginFail');
      cy.wait('@employeeLoginFail');

      // Check if the error alert div exists and contains the text
      cy.get('.bg-red-50').should('contain.text', 'Neispravni kredencijali');
    });

    it('login šalje email i password u request body', () => {
      cy.intercept('POST', '**/clients/auth/login', req => {
        expect(req.body.email).to.equal('user@test.com');
        expect(req.body.password).to.equal('password123');
        req.reply({
          statusCode: 200,
          body: { token: 'tok' }
        });
      }).as('loginBody');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginBody');
    });

    it('uspešno logovanje preusmerava na /employees', () => {
      cy.intercept('POST', '**/clients/auth/login', {
        statusCode: 401,
        body: { message: 'Fallback' }
      });

      cy.intercept('POST', '**/employees/auth/login', {
        statusCode: 200,
        body: { jwt: 'tok', refreshToken: 'ref', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL'] }
      }).as('loginRequest');

      // Intercept employees API that will be called after redirect
      // Ensure we don't intercept the page visit
      cy.intercept('GET', '**/api/employees*', {
        statusCode: 200,
        body: { content: [], totalElements: 0, totalPages: 0 }
      });

      // Alternatively intercept correct url if it's not /api (using hostname wildcard)
      cy.intercept('GET', 'http*://*/employees*', {
        statusCode: 200,
        body: { content: [], totalElements: 0, totalPages: 0 }
      }).as('loadEmployees');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/employees');
    });

  });

  // ─────────────────────────────────────────────
  // INTERCEPTOR — Authorization header
  // ─────────────────────────────────────────────

  describe('AuthInterceptor — Authorization header', () => {

    it('ne dodaje Authorization header na /auth/login zahtev', () => {
      cy.visit('/login');

      cy.intercept('POST', '**/auth/login', req => {
        expect(req.headers['authorization']).to.be.undefined;
        req.reply({
          statusCode: 200,
          body: { jwt: 'new.token', refreshToken: 'ref', role: 'EmployeeBasic', permissions: [] }
        });
      }).as('loginNoHeader');

      cy.get('[data-cy=email]').type('user@test.com');
      cy.get('[data-cy=password]').type('password123');
      cy.get('[data-cy=login-btn]').click();

      cy.wait('@loginNoHeader');
    });

  });

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  describe('Logout', () => {

    beforeEach(() => {
      // Set up authenticated state
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'some.token');
        win.localStorage.setItem('loggedUser', JSON.stringify({
          email: 'user@test.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL']
        }));
      });

      // Intercept the employees API call specifically (avoid matching the UI route)
      cy.intercept(
        { method: 'GET', pathname: '**/employees', resourceType: 'fetch' },
        {
          statusCode: 200,
          body: {
            content: [
              { id: 1, ime: 'Test', prezime: 'User', email: 'test@test.com', pozicija: 'Dev', departman: 'IT', aktivan: true, role: 'EmployeeBasic' }
            ],
            totalElements: 1,
            totalPages: 1
          }
        }
      ).as('getEmployeesFetch');

      cy.intercept(
        { method: 'GET', pathname: '**/employees', resourceType: 'xhr' },
        {
          statusCode: 200,
          body: {
            content: [
              { id: 1, ime: 'Test', prezime: 'User', email: 'test@test.com', pozicija: 'Dev', departman: 'IT', aktivan: true, role: 'EmployeeBasic' }
            ],
            totalElements: 1,
            totalPages: 1
          }
        }
      ).as('getEmployeesXhr');

      cy.visit('/employees');

      // we might wait for XHR or Fetch, depending on Angular HttpClient
      // just let it load
    });

    it('logout briše token iz localStorage', () => {
      cy.contains('Odjava').click();

      cy.window().then(win => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
        expect(win.localStorage.getItem('loggedUser')).to.be.null;
      });
    });

    it('logout preusmerava na /login', () => {
      cy.contains('Odjava').click();
      cy.url().should('include', '/login');
    });

  });

});

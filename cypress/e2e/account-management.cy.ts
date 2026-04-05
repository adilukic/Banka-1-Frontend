describe('F10 - Portal za upravljanje računima', () => {
  const route = 'http://localhost:4200/account-management';

  function makeFakeJwt(win: any): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      email: 'tester@example.com'
    };

    const encode = (obj: unknown) =>
      win.btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${encode(header)}.${encode(payload)}.fake-signature`;
  }

  function loginWithClientManage(win: any): void {
    win.localStorage.setItem('authToken', makeFakeJwt(win));
    win.localStorage.setItem(
      'loggedUser',
      JSON.stringify({
        email: 'tester@example.com',
        role: 'EmployeeBasic',
        permissions: ['CLIENT_MANAGE']
      })
    );
  }

  beforeEach(() => {
    const mockAccounts = {
      content: [
        {
          ime: 'Ana',
          prezime: 'Anic',
          brojRacuna: '160-123456-78',
          tekuciIliDevizni: 'dinarski',
          accountOwnershipType: 'PERSONAL',
          // wait, the component actually hardcodes status: 'ACTIVE' when mapping... Let's look at that. No, the mock should match what mapResponseContent expects.
        },
        {
          ime: 'Marko',
          prezime: 'Markovic',
          brojRacuna: '160-987654-32',
          tekuciIliDevizni: 'devizni',
          accountOwnershipType: 'PERSONAL',
        }
      ],
      totalPages: 1,
      totalElements: 2
    };

    cy.intercept('GET', '**/accounts/employee/accounts*', Object.assign({}, mockAccounts)).as('getAccounts');
    cy.intercept('PUT', '**/employee/accounts/*/status', { statusCode: 200, body: 'OK' }).as('updateStatus');

    cy.visit(route, {
      onBeforeLoad: (win) => {
        loginWithClientManage(win);
      }
    });

    // Wait for the initial load
    cy.wait('@getAccounts');
  });

  it('should render account management page with table and rows', () => {
    cy.contains('Računi klijenata').should('be.visible');
    cy.get('.z-table').should('be.visible');
    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('should filter accounts by owner name prefix', () => {
    cy.get('input[placeholder="Pretraga po imenu, prezimenu ili broju računa"]').type('An');

    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').first().should('contain.text', 'Ana Anic');
    cy.get('tbody tr').first().should('not.contain.text', 'Marko Markovic');
  });

  it('should filter accounts by account number', () => {
    cy.get('input[placeholder="Pretraga po imenu, prezimenu ili broju računa"]').clear().type('160-123'); // make search specific

    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').first().should('contain.text', '160-123456-78');
    cy.get('tbody tr').first().should('contain.text', 'Ana Anic');
  });

  it('should show empty state when no account matches search', () => {
    cy.get('input[placeholder="Pretraga po imenu, prezimenu ili broju računa"]').clear().type('zzzzzzz');

    cy.contains('Nema podataka za prikaz.').should('be.visible');
    cy.get('.z-table').should('not.exist');
  });

  it('should open confirm modal when clicking deactivate', () => {
    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Deaktiviraj').click();
    });

    cy.contains('Potvrda akcije').should('be.visible');
    cy.contains('Da li ste sigurni da').should('be.visible');
    cy.contains('160-123456-78').should('be.visible');
    cy.contains('Potvrdi').should('be.visible');
    cy.contains('Otkaži').should('be.visible');
  });

  it('should close confirm modal on cancel and keep original status', () => {
    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').click();
    });

    cy.contains('Potvrda akcije').should('be.visible');
    cy.contains('button', 'Otkaži').click();

    cy.contains('Potvrda akcije').should('not.exist');

    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').should('be.visible');
    });
  });

  it('should confirm deactivation and update status/button text', () => {
    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').click();
    });

    cy.contains('button', 'Potvrdi').click();

    cy.contains('Potvrda akcije').should('not.exist');

    cy.wait('@updateStatus');

    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Neaktivan').should('be.visible');
      cy.contains('Aktiviraj').should('be.visible');
    });
  });

  it('should confirm activation and update status/button text', () => {
    // First, let's deactivate Marko because component mapResponseContent hardcoded all logic to INITIALIZE with status: 'ACTIVE'.
    // In our mocked data, the component doesn't read status from api! It forces all to 'ACTIVE'
    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Deaktiviraj').click();
    });
    cy.contains('button', 'Potvrdi').click();
    cy.wait('@updateStatus');

    // Moko is now INACTIVE. Let's activate him again.
    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Neaktivan').should('be.visible');
      cy.contains('Aktiviraj').click();
    });

    cy.contains('button', 'Potvrdi').click();

    cy.contains('Potvrda akcije').should('not.exist');

    cy.wait('@updateStatus');

    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').should('be.visible');
    });
  });

  it('should keep filtering working after status change', () => {
    cy.get('input[placeholder="Pretraga po imenu, prezimenu ili broju računa"]').clear().type('Mark');

    cy.get('tbody tr').should('have.length', 1);

    // Initial state is ACTIVE because mapResponseContent ignores map mock status and hardcodes ACTIVE
    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Deaktiviraj').click();
    });

    cy.contains('button', 'Potvrdi').click();

    cy.wait('@updateStatus');

    cy.get('tbody tr').should('have.length', 1);

    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Neaktivan').should('be.visible');
      cy.contains('Aktiviraj').should('be.visible');
    });
  });
});

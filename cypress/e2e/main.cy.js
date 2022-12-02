/// <reference types="Cypress" />

describe('main application', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('has initial state', () => {
    // has section headers and info
    cy.findByRole('heading', { name: /chairs chairs chairs/i }).should(
      'be.visible'
    );

    cy.findByRole('banner', { name: /image details/i }).within(() => {
      cy.findByRole('heading', { name: /no image uploaded/i }).should(
        'be.visible'
      );
      cy.findByRole('heading', { name: /upload an image to begin/i }).should(
        'be.visible'
      );
      cy.findByRole('button', { name: /previous/i }).should('be.disabled');
      cy.findByRole('button', { name: /next/i }).should('be.disabled');
    });

    cy.findByRole('region', { name: /annotations/i }).within(() => {
      cy.findByRole('heading', { name: /annotations\(0\)/i }).should(
        'be.visible'
      );
      cy.findByRole('button', { name: /clear all annotations/i }).should(
        'be.disabled'
      );
    });

    cy.findByRole('region', { name: /image controls/i }).within(() => {
      cy.findByRole('button', { name: /delete image/i }).should('be.disabled');
      cy.findByRole('button', { name: /upload new image/i }).should(
        'be.enabled'
      );
    });

    cy.findByRole('region', { name: /gallery/i }).within(() => {
      cy.findByRole('heading', { name: /gallery/i }).should('be.visible');
      cy.findAllByRole('img').should('not.exist');
    });
  });

  it('can upload image', () => {
    cy.findByRole('region', { name: /image controls/i }).within(() => {
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile(
        'cypress/fixtures/eames-lounge.jpg',
        {
          force: true,
        }
      );
      // button should still be enabled for subsequent uploads
      cy.findByRole('button', { name: /upload new image/i }).should(
        'be.enabled'
      );
      cy.findByRole('button', { name: /delete image/i }).should('be.enabled');
    });

    cy.findByRole('banner', { name: /image details/i }).within(() => {
      cy.findByRole('heading', { name: /image 1 of 1/i }).should('be.visible');
      cy.findByRole('heading', { name: /eames-lounge.jpg/i }).should(
        'be.visible'
      );
      cy.findByRole('button', { name: /previous/i }).should('be.disabled');
      cy.findByRole('button', { name: /next/i }).should('be.disabled');
    });

    cy.findByRole('region', { name: /annotations/i }).within(() => {
      cy.findByRole('heading', { name: /annotations\(0\)/i }).should(
        'be.visible'
      );
      cy.findByRole('button', { name: /clear all annotations/i }).should(
        'be.disabled'
      );
    });

    cy.findByRole('region', { name: /gallery/i }).within(() => {
      cy.findByRole('heading', { name: /gallery/i }).should('be.visible');
      cy.findAllByRole('listitem').should('have.length', 1);
      cy.fixture('eames-lounge.jpg').then((image) => {
        cy.findAllByRole('img')
          .should('have.length', 1)
          .should('have.attr', 'src')
          .should('equal', `data:image/jpeg;base64,${image}`);
        cy.findAllByRole('img')
          .should('have.attr', 'alt')
          .should('equal', 'eames-lounge.jpg');
      });
    });
  });

  it('can upload three images', () => {
    cy.findByRole('region', { name: /image controls/i }).within(() => {
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile(
        'cypress/fixtures/eames-lounge.jpg',
        {
          force: true,
        }
      );
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile(
        'cypress/fixtures/hiroshima-lounge-chair.jpg',
        {
          force: true,
        }
      );
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile('cypress/fixtures/pk22-chair.jpg', {
        force: true,
      });
    });

    cy.findByRole('banner', { name: /image details/i }).within(() => {
      cy.findByRole('heading', { name: /image 3 of 3/i }).should('be.visible');
      cy.findByRole('heading', { name: /pk22-chair.jpg/i }).should(
        'be.visible'
      );
      cy.findByRole('button', { name: /previous/i }).should('be.enabled');
      cy.findByRole('button', { name: /next/i }).should('be.disabled');
    });

    cy.findByRole('region', { name: /annotations/i }).within(() => {
      cy.findByRole('heading', { name: /annotations\(0\)/i }).should(
        'be.visible'
      );
      cy.findByRole('button', { name: /clear all annotations/i }).should(
        'be.disabled'
      );
    });

    cy.findByRole('region', { name: /gallery/i }).within(() => {
      cy.findByRole('heading', { name: /gallery/i }).should('be.visible');
      cy.findAllByRole('listitem').should('have.length', 3);
      cy.findAllByRole('img')
        .should('have.length', 3)
        .should('have.attr', 'src');
      cy.findAllByRole('img').should('have.attr', 'alt');
    });
  });

  it('can delete images', () => {
    cy.findByRole('region', { name: /image controls/i }).within(() => {
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile(
        'cypress/fixtures/eames-lounge.jpg',
        {
          force: true,
        }
      );
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile(
        'cypress/fixtures/hiroshima-lounge-chair.jpg',
        {
          force: true,
        }
      );
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile('cypress/fixtures/pk22-chair.jpg', {
        force: true,
      });
    });

    cy.findByRole('banner', { name: /image details/i }).within(() => {
      cy.findByRole('button', { name: /previous/i }).click();
    });

    cy.findByRole('region', { name: /image controls/i }).within(() => {
      cy.findByRole('button', { name: /delete image/i }).click();
    });

    cy.findByRole('region', { name: /gallery/i }).within(() => {
      cy.findByRole('heading', { name: /gallery/i }).should('be.visible');
      cy.findAllByRole('listitem').should('have.length', 2);
      cy.findAllByRole('img')
        .should('have.length', 2)
        .should('have.attr', 'src');
      cy.findAllByRole('img').should('have.attr', 'alt');
    });
  });
});

/// <reference types="Cypress" />

describe('canvas', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.findByRole('region', { name: /image controls/i }).within(() => {
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile(
        'cypress/fixtures/eames-lounge.jpg',
        {
          force: true,
        }
      );
    });
  });

  // TODO: add calculated clientX and clientY as offsetX and offsetY do not show in cypress debugging
  function drawBox(startX, startY, endX, endY) {
    cy.get('#canvas-container-inner')
      .trigger('mousedown', { offsetX: startX, offsetY: startY })
      .trigger('mousemove', { offsetX: endX, offsetY: endY })
      .trigger('mouseup');
  }
  function moveBox(startX, startY, endX, endY) {
    cy.get('#canvas-container-inner')
      .trigger('mousedown', { offsetX: startX, offsetY: startY })
      .trigger('mousemove', { offsetX: endX, offsetY: endY })
      .trigger('mouseup');
  }

  it('renders uploaded image', () => {
    cy.findByRole('region', { name: /main canvas/i }).should('be.visible');
    cy.get('#canvas-container-inner').compareSnapshot('uploaded-image');
  });

  it('can create a single annotation', () => {
    drawBox(50, 100, 150, 200);
    cy.get('#canvas-container-inner').compareSnapshot('create-annotations');
  });

  it('can create multiple annotations, overlapping', () => {
    drawBox(50, 100, 150, 200);
    drawBox(300, 50, 400, 150);
    drawBox(500, 300, 350, 200); // draw from bottom right
    drawBox(400, 400, 600, 250); // draw from bottom left
    cy.get('#canvas-container-inner').compareSnapshot(
      'create-annotations-multiple'
    );
  });

  it('can move created annotation', () => {
    drawBox(50, 100, 150, 200);
    drawBox(300, 50, 400, 150);
    drawBox(500, 300, 350, 200); // draw from bottom right
    drawBox(400, 400, 600, 250); // draw from bottom left
    cy.get('#canvas-container-inner').compareSnapshot('move-annotation-before');
    moveBox(75, 150, 200, 300);
    cy.get('#canvas-container-inner').compareSnapshot('move-annotation-after');
  });

  it('can upload new image, add annotations, go back to previous image and annotations will display', () => {
    drawBox(50, 100, 150, 200);
    drawBox(300, 50, 400, 150);
    cy.findByRole('region', { name: /image controls/i }).within(() => {
      // the actual input element is hidden so we use force:true to bypass cypress' build-in checks
      cy.get('input[type=file]').selectFile(
        'cypress/fixtures/hiroshima-lounge-chair.jpg',
        {
          force: true,
        }
      );
    });

    drawBox(500, 300, 350, 200); // draw from bottom right
    drawBox(400, 400, 600, 250); // draw from bottom left
    cy.get('#canvas-container-inner').compareSnapshot(
      'upload-new-image-add-annotations'
    );

    cy.findByRole('banner', { name: /image details/i }).within(() => {
      cy.findByRole('button', { name: /previous/i }).click();
    });

    cy.get('#canvas-container-inner').compareSnapshot(
      'upload-new-image-previous-image'
    );

    cy.findByRole('banner', { name: /image details/i }).within(() => {
      cy.findByRole('button', { name: /next/i }).click();
    });

    cy.get('#canvas-container-inner').compareSnapshot(
      'upload-new-image-next-image'
    );
  });

  it('can rename added annotations', () => {
    drawBox(50, 100, 150, 200);
    drawBox(300, 50, 400, 150);
    cy.findByRole('region', { name: /annotations/i }).within(() => {
      // some base assertions post-annotation adding
      cy.findByRole('heading', { name: /annotations\(2\)/i }).should(
        'be.visible'
      );
      cy.findByRole('button', { name: /clear all annotations/i }).should(
        'be.enabled'
      );
      cy.findAllByRole('listitem').should('have.length', 2);

      cy.findByRole('listitem', { name: /label 1/i }).should('be.visible');
      cy.findByRole('listitem', { name: /label 2/i }).should('be.visible');
      cy.findByRole('listitem', { name: /label 2/i }).type(
        '{selectAll}{backspace}armrest'
      );
      cy.findByRole('listitem', { name: /label 1/i }).type(
        '{selectAll}{backspace}plush leather seat'
      );

      cy.findAllByRole('listitem').should('have.length', 2);
      cy.findByRole('listitem', { name: /label 1/i }).should('not.exist');
      cy.findByRole('listitem', { name: /label 2/i }).should('not.exist');
      cy.findByRole('listitem', { name: /armrest/i }).should('be.visible');
      cy.findByRole('listitem', { name: /plush leather seat/i }).should(
        'be.visible'
      );
    });

    cy.get('#canvas-container-inner').compareSnapshot('rename-annotations');
  });

  it('can delete added annotations', () => {
    drawBox(50, 100, 150, 200);
    drawBox(300, 50, 400, 150);
    cy.findByRole('region', { name: /annotations/i }).within(() => {
      cy.findByRole('listitem', { name: /label 1/i }).within(() => {
        cy.findByRole('button', { name: /delete/i }).click();
      });

      cy.findByRole('heading', { name: /annotations\(1\)/i }).should(
        'be.visible'
      );
      cy.findAllByRole('listitem').should('have.length', 1);
      cy.findByRole('listitem', { name: /label 2/i }).should('be.visible');
      cy.findByRole('listitem', { name: /label 1/i }).should('not.exist');
    });
    cy.get('#canvas-container-inner').compareSnapshot('delete-annotations');
  });

  it('can delete all added annotations', () => {
    drawBox(50, 100, 150, 200);
    drawBox(300, 50, 400, 150);
    cy.findByRole('region', { name: /annotations/i }).within(() => {
      cy.findByRole('button', { name: /clear all annotations/i }).click();

      cy.findByRole('heading', { name: /annotations\(0\)/i }).should(
        'be.visible'
      );
      cy.findAllByRole('listitem').should('have.length', 0);
    });
    cy.get('#canvas-container-inner').compareSnapshot('delete-annotations-all');
  });
});

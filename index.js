import * as canv from './src/canvas.js';
import * as store from './src/store.js';
import {
  imageKeyToFileName,
  disableButton,
  enableButton,
} from './src/helpers.js';

// Constants
const COLOR_TEXT_DEFAULT = 'white';
const COLOR_BOX_CURRENT = '#f71735';

const STORE = store.STORE;

// DOM references
const REFS = {
  buttons: {},
  canvasImage: document.getElementById('canvas-image'),
  canvasAnnotation: document.getElementById('canvas-annotation'),
  canvasCurrentBox: document.getElementById('canvas-current-box'),
  imageTitle: document.getElementById('image-title'),
  imageDeleteButton: document.getElementById('image-delete'),
  imageUploadButton: document.getElementById('image-upload-button'),
  imageUploadInput: document.getElementById('image-upload-input'),
  imagePrevious: document.getElementById('image-previous'),
  imageNext: document.getElementById('image-next'),
  annotationsList: document.getElementById('annotations-list'),
  imageCurrentFilename: document.getElementById('image-current-filename'),
  annotationsDeleteAllButton: document.getElementById('annotations-delete-all'),
  annotationsTotalNumber: document.getElementById('annotations-total-number'),
  emptyState: document.getElementById('canvas-empty-state'),
  galleryList: document.getElementById('gallery-list'),
};
// Helpers
function withScale(value) {
  const { scale } = STORE.canvas;
  return value / scale;
}

// Canvas Operations
function addImageToCanvas(localStorageKey) {
  const imgURL = localStorage.getItem(localStorageKey);
  if (!imgURL) {
    console.error(`Image not found in localstorage. Key: ${localStorageKey}`);
    return;
  }
  const img = new Image();
  img.src = imgURL;
  img.onload = () => {
    canv.clearCanvas(REFS.canvasImage);
    canv.drawImageToFit(REFS.canvasImage, img);
  };
}

function renderAllAnnotations(canvas, annotations) {
  annotations.forEach(({ x, y, width, height, isRender, label }) => {
    if (isRender) {
      canv.drawBox(canvas, x, y, width, height);
      canv.drawTextBox(canvas, x, y, label);
    }
  });
}

function updateCurrentAnnotationPaths(annotations) {
  const paths = annotations.map(({ x, y, width, height }) => {
    const path = new Path2D();
    path.rect(x, y, width, height);
    return path;
  });
  store.setCurrentAnnotationPaths(paths);
}

function updateCanvasScale(canvas) {
  store.setCanvasScale(canv.calculateCanvasScale(canvas));
}

function checkClickWithinBoxes(x, y) {
  const context = REFS.canvasAnnotation.getContext('2d');
  const { currentAnnotationPaths } = STORE;

  const pathIndex = currentAnnotationPaths.findIndex((path) => {
    return context.isPointInPath(path, x, y);
  });

  return pathIndex !== -1 ? pathIndex : false;
}

// Check browser support
function checkSupportsContentEditablePlainText() {
  try {
    const testEl = document.createElement('span');
    testEl.contentEditable = 'plaintext-only';
    store.setSupportsContentEditablePlainText(true);
  } catch {
    store.setSupportsContentEditablePlainText(false);
  }
}

// Event Handler

function handleBoxDrawStart(x, y) {
  store.setDrawingStart();
  store.setCurrentBoxStart(withScale(x), withScale(y));
}

function handleBoxDrawEnd() {
  store.setDrawingEnd();
  const { startX, startY, width, height } = STORE.currentBox;
  const { annotations } = store.getCurrentItem();
  // manipulate values such that top left of box is x and y, to facilitate label placement
  const x = Math.min(startX, startX + width);
  const y = Math.min(startY, startY + height);
  // push into state
  store.addBoxToAnnotations(x, y, Math.abs(width), Math.abs(height));
  // draw on annotations layer
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  updateCurrentAnnotationPaths(annotations);
  canv.clearCanvas(REFS.canvasCurrentBox);
  //re-render list
  renderAnnotationsList(annotations);
  store.saveStoreToLocalStorage();
}

function handleBoxDrawing(x, y) {
  const { startX, startY } = STORE.currentBox;
  // translate to canvas scale
  const currentXCanvas = withScale(x);
  const currentYCanvas = withScale(y);
  const width = currentXCanvas - startX;
  const height = currentYCanvas - startY;
  store.setCurrentBoxWidthHeight(width, height);

  canv.clearCanvas(REFS.canvasCurrentBox);
  canv.drawBox(REFS.canvasCurrentBox, startX, startY, width, height);
}

function handleBoxMoving(currentX, currentY) {
  // get offset between clicked position and top left of box
  // update position
  const { width, height, label } = STORE.currentBox;
  const { x, y } = STORE.moveOffset;
  // translate to canvas scale
  const xWithOffset = withScale(currentX) - x;
  const yWithOffset = withScale(currentY) - y;
  store.setCurrentBoxStart(xWithOffset, yWithOffset);
  canv.clearCanvas(REFS.canvasCurrentBox);
  canv.drawBox(REFS.canvasCurrentBox, xWithOffset, yWithOffset, width, height);
  canv.drawTextBox(
    REFS.canvasCurrentBox,
    xWithOffset,
    yWithOffset,
    label,
    COLOR_TEXT_DEFAULT,
    COLOR_BOX_CURRENT
  );
}

function handleBoxMoveStart(boxIndex, x, y) {
  const { annotations } = store.getCurrentItem();
  const boxClickedInside = annotations[boxIndex];
  const { x: boxX, y: boxY, width, height, label } = boxClickedInside;
  store.setMovingStart();
  store.setCurrentBoxIndex(boxIndex);
  store.setCurrentBoxWidthHeight(width, height);
  store.setCurrentBoxStart(boxX, boxY);
  store.setCurrentBoxLabel(label);
  store.setMoveOffset(withScale(x) - boxX, withScale(y) - boxY);
  store.setBoxRender(boxIndex, false);
  // redraw boxes minus the current one
  canv.clearCanvas(REFS.canvasAnnotation);
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  // draw on current layer
  canv.clearCanvas(REFS.canvasCurrentBox);
  canv.drawBox(REFS.canvasCurrentBox, boxX, boxY, width, height);
  canv.drawTextBox(
    REFS.canvasCurrentBox,
    boxX,
    boxY,
    label,
    COLOR_TEXT_DEFAULT,
    COLOR_BOX_CURRENT
  );
  REFS.canvasCurrentBox.style.cursor = 'move';
}

function handleBoxMoveEnd() {
  const { currentBox } = STORE;
  const { annotations } = store.getCurrentItem();
  store.setMovingEnd();
  canv.clearCanvas(REFS.canvasAnnotation);
  // push into state
  const { startX, startY, width, height, index } = currentBox;
  store.updateBoxCoordinates(index, startX, startY, width, height);
  store.setBoxRender(index, true);
  // draw on annotations layer
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  updateCurrentAnnotationPaths(annotations);
  canv.clearCanvas(REFS.canvasCurrentBox);
  renderAnnotationsList(annotations);
  store.saveStoreToLocalStorage();
  REFS.canvasCurrentBox.style.cursor = 'crosshair';
}

function handleDeleteAnnotation(boxIndex) {
  const { annotations } = store.getCurrentItem();
  const { label } = annotations[boxIndex];
  if (confirm(`Delete annotation ${label}?`)) {
    store.removeBoxFromAnnotations(boxIndex);
    renderAnnotationsList(annotations);
    canv.clearCanvas(REFS.canvasAnnotation);
    renderAllAnnotations(REFS.canvasAnnotation, annotations);
    store.saveStoreToLocalStorage();
  }
}

function handleLabelChange(boxIndex, label) {
  const { annotations } = store.getCurrentItem();
  updateBoxLabel(boxIndex, label);
  canv.clearCanvas(REFS.canvasAnnotation);
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  store.saveStoreToLocalStorage();
}

function renderAnnotationsList(annotations) {
  const { hasSupportContentEditablePlainText } = STORE;
  // clear out the list
  REFS.annotationsList.replaceChildren();
  REFS.annotationsTotalNumber.innerText = `(${annotations.length})`;
  if (annotations.length === 0) {
    disableButton(REFS.annotationsDeleteAllButton);
    return;
  }

  annotations.forEach(({ label }, index) => {
    const li = document.createElement('li');
    li.className = 'annotationsListItem';
    const id = `label-${index}`;
    li.setAttribute('aria-labelledby', id);
    const labelEl = document.createElement('span');
    labelEl.id = id;
    labelEl.textContent = label;
    labelEl.contentEditable = hasSupportContentEditablePlainText
      ? 'plaintext-only'
      : 'true';
    labelEl.addEventListener('input', (e) => {
      // update label in annotation
      handleLabelChange(index, e.target.textContent);
    });
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Delete';
    button.addEventListener('click', () => {
      handleDeleteAnnotation(index);
    });
    li.appendChild(labelEl);
    li.appendChild(button);
    REFS.annotationsList.appendChild(li);
  });
  enableButton(REFS.annotationsDeleteAllButton);
}

function handleImageUpload(image) {
  const { items } = STORE;
  const reader = new FileReader();
  reader.readAsDataURL(image);
  reader.addEventListener('load', () => {
    store.saveImageToLocalStorage(image.name, reader.result);
    store.addImageToMainStore(image.name);
    store.setCurrentItem(Object.keys(items).length);
    handleImageChange();
    store.saveStoreToLocalStorage();
    renderGallery();
  });
  enableButton(REFS.imageDeleteButton);
  REFS.emptyState.style.display = 'none';
}

function renderImageDetails() {
  const { currentItem: currentItemNumber, items } = STORE;
  const noOfItems = Object.keys(items).length;
  REFS.imageTitle.textContent = `Image ${currentItemNumber} of ${noOfItems}`;
  REFS.imageCurrentFilename.textContent = store.getCurrentItemImageName();
}

function handleImageChange() {
  const { imageURL, annotations } = store.getCurrentItem();
  addImageToCanvas(imageURL);
  renderImageDetails();
  canv.clearCanvas(REFS.canvasAnnotation);
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  renderAnnotationsList(annotations);
  updateCurrentAnnotationPaths(annotations);
  checkAndDisableButtons();
}

function handleCurrentItemChange() {
  checkAndDisableButtons();
  handleImageChange();
  store.saveStoreToLocalStorage();
}

function handlePrevious() {
  const { currentItem } = STORE;
  if (currentItem > 1) {
    store.setCurrentItem(currentItem - 1);
  }
  handleCurrentItemChange();
}

function handleNext() {
  const { currentItem, items } = STORE;
  const noOfItems = Object.keys(items).length;
  if (currentItem < noOfItems) {
    store.setCurrentItem(currentItem + 1);
  }
  handleCurrentItemChange();
}

function checkAndDisableButtons() {
  const { currentItem, items } = STORE;
  const noOfItems = Object.keys(items).length;
  disableButton(REFS.imagePrevious);
  disableButton(REFS.imageNext);
  disableButton(REFS.imageDeleteButton);
  if (currentItem) {
    enableButton(REFS.imageDeleteButton);
  }
  if (currentItem < noOfItems) {
    enableButton(REFS.imageNext);
  }
  if (currentItem > 1) {
    enableButton(REFS.imagePrevious);
  }
}

function handleDeleteAllAnnotations() {
  if (confirm(`Delete all annotations? This cannot be undone.`)) {
    store.removeAllAnnotations();
    canv.clearCanvas(REFS.canvasAnnotation);
    const { annotations } = store.getCurrentItem();
    renderAnnotationsList(annotations);
    updateCurrentAnnotationPaths(annotations);
    disableButton(REFS.annotationsDeleteAllButton);
    store.saveStoreToLocalStorage();
  }
}

function handleEmptyState() {
  canv.clearCanvas(REFS.canvasImage);
  canv.clearCanvas(REFS.canvasAnnotation);
  renderAnnotationsList([]);
  updateCurrentAnnotationPaths([]);
  store.saveStoreToLocalStorage();
  REFS.imageCurrentFilename.textContent = 'Upload an image to begin';
  REFS.imageTitle.textContent = 'No image uploaded';
  disableButton(REFS.annotationsDeleteAllButton);
  checkAndDisableButtons();
  REFS.emptyState.style.display = 'block';
}

function handleDeleteImage() {
  const { currentItem } = STORE;
  const imageKey = store.getCurrentItemImageName();
  if (confirm(`Delete image "${imageKey}"? This cannot be undone.`)) {
    store.removeImageFromStore(currentItem);
    const { items } = STORE;
    const itemCount = Object.keys(items).length;
    renderGallery();
    if (itemCount === 0) {
      store.setCurrentItem(null);
      handleEmptyState();
      return;
    }
    if (currentItem > itemCount) {
      handlePrevious();
      return;
    }
    handleCurrentItemChange();
  }
}

function handleMouseMoveCursorChange(e) {
  const { annotations } = store.getCurrentItem();
  if (annotations.length === 0) return;
  const boxIndex = checkClickWithinBoxes(
    withScale(e.offsetX),
    withScale(e.offsetY)
  );
  if (boxIndex !== false) {
    REFS.canvasCurrentBox.style.cursor = 'move';
  } else {
    REFS.canvasCurrentBox.style.cursor = 'crosshair';
  }
}

function renderGallery() {
  const { items } = STORE;
  const keys = Object.keys(items);
  REFS.galleryList.replaceChildren();
  if (items.length === 0) {
    return;
  }

  keys.forEach((key, index) => {
    const { imageURL } = items[key];
    const li = document.createElement('li');
    const img = document.createElement('img');
    const imgData = localStorage.getItem(imageURL);
    img.src = imgData;
    const fileName = imageKeyToFileName(imageURL);
    img.alt = fileName;
    const labelEl = document.createElement('span');
    labelEl.textContent = `(${index + 1}) ${fileName}`;
    li.addEventListener('click', () => {
      store.setCurrentItem(index + 1);
      handleCurrentItemChange();
    });
    li.appendChild(img);
    li.appendChild(labelEl);
    REFS.galleryList.appendChild(li);
  });
}

// Event bindings
if (REFS.canvasCurrentBox) {
REFS.canvasCurrentBox.addEventListener('mousedown', (e) => {
  const { currentItem } = STORE;
  if (!currentItem) return;
  // check if clicking within a current box, if yes, move
  const boxIndex = checkClickWithinBoxes(
    withScale(e.offsetX),
    withScale(e.offsetY)
  );
  if (boxIndex !== false) {
    handleBoxMoveStart(boxIndex, e.offsetX, e.offsetY);
  } else {
    handleBoxDrawStart(e.offsetX, e.offsetY);
  }
});
REFS.canvasCurrentBox.addEventListener('mousemove', (e) => {
  const { currentItem } = STORE;
  if (!currentItem) return;
  if (STORE.isDrawingBox) {
    handleBoxDrawing(e.offsetX, e.offsetY);
    return;
  }
  if (STORE.isMovingBox) {
    handleBoxMoving(e.offsetX, e.offsetY);
    return;
  }
  handleMouseMoveCursorChange(e);
});
REFS.canvasCurrentBox.addEventListener('mouseup', (e) => {
  if (STORE.isDrawingBox) {
    handleBoxDrawEnd();
  } else if (STORE.isMovingBox) {
    handleBoxMoveEnd();
  }
});
REFS.canvasCurrentBox.addEventListener('mouseout', (e) => {
  if (STORE.isDrawingBox) {
    handleBoxDrawEnd();
  } else if (STORE.isMovingBox) {
    handleBoxMoveEnd();
  }
});
}
REFS.imageUploadButton &&
REFS.imageUploadButton.addEventListener('click', (e) => {
  REFS.imageUploadInput.click();
});
REFS.emptyState &&
REFS.emptyState.addEventListener('click', (e) => {
  REFS.imageUploadInput.click();
});
REFS.imageUploadInput &&
REFS.imageUploadInput.addEventListener('change', (e) => {
  const image = e.target.files[0];
  // TODO check type and file size
  handleImageUpload(image);
});
REFS.imageDeleteButton &&
REFS.imageDeleteButton.addEventListener('click', (e) => {
  handleDeleteImage();
});
REFS.imagePrevious &&
REFS.imagePrevious.addEventListener('click', (e) => {
  handlePrevious();
});
REFS.imageNext &&
REFS.imageNext.addEventListener('click', (e) => {
  handleNext();
});
REFS.annotationsDeleteAllButton &&
REFS.annotationsDeleteAllButton.addEventListener('click', (e) => {
  handleDeleteAllAnnotations();
});
const resizeObserver =
  window.ResizeObserver &&
  new ResizeObserver((entries) => {
  for (let _ of entries) {
    updateCanvasScale(REFS.canvasCurrentBox);
  }
});
REFS.canvasCurrentBox && resizeObserver.observe(REFS.canvasCurrentBox);

// init
// document.ready, then
window.onload = function () {
  store.readStoreFromLocalStorage();
  checkSupportsContentEditablePlainText();
  updateCanvasScale(REFS.canvasCurrentBox);
  const { currentItem } = STORE;
  if (currentItem) {
    const { imageURL, annotations } = store.getCurrentItem();
    addImageToCanvas(imageURL);
    REFS.emptyState.style.display = 'none';
    renderAllAnnotations(REFS.canvasAnnotation, annotations);
    updateCurrentAnnotationPaths(annotations);
    renderImageDetails();
    renderAnnotationsList(annotations);
    checkAndDisableButtons();
    renderGallery();
  } else {
    handleEmptyState();
  }
  // init colour for current layer
  const context = REFS.canvasCurrentBox.getContext('2d');
  context.strokeStyle = COLOR_BOX_CURRENT;
};

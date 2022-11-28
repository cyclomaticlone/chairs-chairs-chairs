// Constants
const CANVAS_WIDTH = 1000;
const CANVAS_FONT = '14px sans-serif';
const TEXT_X_OFFSET = 2;
const TEXT_Y_OFFSET = -6;
const COLOR_BOX_DEFAULT = 'black';
const COLOR_TEXT_DEFAULT = 'white';
const COLOR_BOX_CURRENT = '#f71735';

// State
const STORE = {
  items: {},
  currentItem: null,
  isDrawingBox: false,
  isMovingBox: false,
  moveOffset: {
    x: 0,
    y: 0,
  },
  canvas: {
    scale: 1,
  },
  currentBox: {
    index: null,
    label: '',
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
  },
  currentAnnotationPaths: [],
};

// State Getters/Setters
function getCurrentItem() {
  const { items, currentItem } = STORE;
  return items[currentItem];
}

function getCurrentItemImageName() {
  const { imageURL } = getCurrentItem();
  return imageKeyToFileName(imageURL);
}

function setDrawingStart() {
  STORE.isDrawingBox = true;
}
function setDrawingEnd() {
  STORE.isDrawingBox = false;
}
function setMovingStart() {
  STORE.isMovingBox = true;
}
function setMovingEnd() {
  STORE.isMovingBox = false;
}
function setCanvasScale(scale) {
  STORE.canvas.scale = scale;
}
function setCurrentBoxStart(x, y) {
  STORE.currentBox.startX = x;
  STORE.currentBox.startY = y;
}
function setCurrentBoxIndex(index) {
  STORE.currentBox.index = index;
}
function setCurrentBoxLabel(label) {
  STORE.currentBox.label = label;
}
function setCurrentBoxWidthHeight(width, height) {
  STORE.currentBox.width = width;
  STORE.currentBox.height = height;
}
function setCurrentAnnotationPaths(paths) {
  STORE.currentAnnotationPaths = paths;
}
function setMoveOffset(x, y) {
  STORE.moveOffset = { x, y };
}
function setCurrentItem(itemKey) {
  // Example of error handling, not implemented project-wide
  if (itemKey !== null && !STORE.items[itemKey]) {
    console.error(`Attempted to set current item to invalid key: ${itemKey}`);
    return;
  }
  STORE.currentItem = itemKey;
}
function updateBoxCoordinates(boxIndex, x, y, width, height) {
  const { annotations } = getCurrentItem();
  const box = annotations[boxIndex];
  const updatedBox = { ...box, x, y, width, height };
  annotations[boxIndex] = updatedBox;
}
function updateBoxLabel(boxIndex, label) {
  const { annotations } = getCurrentItem();
  const box = annotations[boxIndex];
  const updatedBox = { ...box, label };
  annotations[boxIndex] = updatedBox;
}
function removeBoxFromAnnotations(boxIndex) {
  const { annotations } = getCurrentItem();
  annotations.splice(boxIndex, 1);
}
function removeAllBoxes() {
  const { currentItem, items } = STORE;
  items[currentItem].annotations = [];
}
function addBoxToAnnotations(x, y, width, height) {
  const { annotations } = getCurrentItem();
  annotations.push({
    x,
    y,
    width,
    height,
    label: `Label ${annotations.length + 1}`,
    isRender: true,
  });
}
function setBoxRender(boxIndex, isRender) {
  const { annotations } = getCurrentItem();
  annotations[boxIndex].isRender = isRender;
}
function addImageToStore(localStorageKey) {
  const itemKeysLength = Object.keys(STORE.items).length;
  const newItemKey = itemKeysLength === 0 ? 1 : itemKeysLength + 1;
  STORE.items[newItemKey] = {
    imageURL: localStorageKey,
    annotations: [],
  };
}
function removeImageFromStore(itemKeyToDelete) {
  const { imageURL } = getCurrentItem();
  const newItemKeys = Object.keys(STORE.items).filter(
    (key) => Number(key) !== itemKeyToDelete
  );
  const newItems = {};
  newItemKeys.forEach((itemKey, index) => {
    newItems[index + 1] = STORE.items[itemKey];
  });
  STORE.items = newItems;
  // also remove image data from local storage
  localStorage.removeItem(`chairs-chairs-chairs-${imageURL}`);
}
function saveStoreToLocalStorage() {
  const { items, currentItem } = STORE;
  localStorage.setItem(
    'chairs-chairs-chairs-store',
    JSON.stringify({ items, currentItem })
  );
}
function readStoreFromLocalStorage() {
  const stored = localStorage.getItem('chairs-chairs-chairs-store');
  if (stored) {
    const { items, currentItem } = JSON.parse(stored);
    STORE.items = items;
    STORE.currentItem = currentItem;
  }
}

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

function disableButton(button) {
  button.setAttribute('disabled', '');
  button.classList.add('--disabled');
}

function enableButton(button) {
  button.removeAttribute('disabled');
  button.classList.remove('--disabled');
}

function imageKeyToFileName(key) {
  return key.replace('chairs-chairs-chairs-', '');
}

// Canvas Operations
// TODO: consider encapsulating all canvas operations in a class
function drawImageToFit(canvas, img) {
  const context = canvas.getContext('2d');
  const imgScale = Math.min(
    canvas.width / img.width,
    canvas.height / img.height
  );
  const x = canvas.width / 2 - (img.width / 2) * imgScale;
  const y = canvas.height / 2 - (img.height / 2) * imgScale;
  context.drawImage(img, x, y, img.width * imgScale, img.height * imgScale);
}

function addImageToCanvas(localStorageKey) {
  const imgURL = localStorage.getItem(localStorageKey);
  if (!imgURL) {
    console.error(`Image not found in localstorage. Key: ${localStorageKey}`);
    return;
  }
  const img = new Image();
  img.src = imgURL;
  img.onload = () => {
    clearCanvas(REFS.canvasImage);
    drawImageToFit(REFS.canvasImage, img);
  };
}

function drawBox(canvas, x, y, width, height) {
  const context = canvas.getContext('2d');
  context.fillStyle = COLOR_BOX_DEFAULT;
  context.strokeRect(x, y, width, height);
}

function drawTextBox(canvas, x, y, text, colorText, colorBox) {
  const context = canvas.getContext('2d');
  context.font = CANVAS_FONT;
  const textMetrics = context.measureText(text);
  context.fillStyle = colorBox || COLOR_BOX_DEFAULT;
  context.fillRect(
    x - 1, // border width
    y + TEXT_Y_OFFSET - textMetrics.fontBoundingBoxAscent,
    textMetrics.width + Math.abs(TEXT_X_OFFSET) * 4,
    textMetrics.fontBoundingBoxAscent + Math.abs(TEXT_Y_OFFSET)
  );
  context.fillStyle = colorText || COLOR_TEXT_DEFAULT;
  context.fillText(text, x + TEXT_X_OFFSET, y + TEXT_Y_OFFSET);
}

function clearCanvas(canvas) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function renderAllAnnotations(canvas, annotations) {
  annotations.forEach(({ x, y, width, height, isRender, label }) => {
    if (isRender) {
      drawBox(canvas, x, y, width, height);
      drawTextBox(canvas, x, y, label);
    }
  });
}

function updateCurrentAnnotationPaths(annotations) {
  const paths = annotations.map(({ x, y, width, height }) => {
    const path = new Path2D();
    path.rect(x, y, width, height);
    return path;
  });
  setCurrentAnnotationPaths(paths);
}

function updateCanvasScale(canvas) {
  const offset = canvas.getBoundingClientRect();
  const scale = offset.width / CANVAS_WIDTH;
  setCanvasScale(scale);
}

function checkClickWithinBoxes(x, y) {
  const context = REFS.canvasAnnotation.getContext('2d');
  const { currentAnnotationPaths } = STORE;

  const pathIndex = currentAnnotationPaths.findIndex((path) => {
    return context.isPointInPath(path, x, y);
  });

  return pathIndex !== -1 ? pathIndex : false;
}

// Event Handlers

function handleBoxDrawStart(x, y) {
  setDrawingStart();
  setCurrentBoxStart(withScale(x), withScale(y));
}

function handleBoxDrawEnd() {
  setDrawingEnd();
  const { startX, startY, width, height } = STORE.currentBox;
  const { annotations } = getCurrentItem();
  // manipulate values such that top left of box is x and y, to facilitate label placement
  const x = Math.min(startX, startX + width);
  const y = Math.min(startY, startY + height);
  // push into state
  addBoxToAnnotations(x, y, Math.abs(width), Math.abs(height));
  // draw on annotations layer
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  updateCurrentAnnotationPaths(annotations);
  clearCanvas(REFS.canvasCurrentBox);
  //re-render list
  renderAnnotationsList(annotations);
  saveStoreToLocalStorage();
}

function handleBoxDrawing(x, y) {
  const { startX, startY } = STORE.currentBox;
  // translate to canvas scale
  const currentXCanvas = withScale(x);
  const currentYCanvas = withScale(y);
  const width = currentXCanvas - startX;
  const height = currentYCanvas - startY;
  setCurrentBoxWidthHeight(width, height);

  clearCanvas(REFS.canvasCurrentBox);
  drawBox(REFS.canvasCurrentBox, startX, startY, width, height);
}

function handleBoxMoving(currentX, currentY) {
  // get offset between clicked position and top left of box
  // update position
  const { width, height, label } = STORE.currentBox;
  const { x, y } = STORE.moveOffset;
  // translate to canvas scale
  const xWithOffset = withScale(currentX) - x;
  const yWithOffset = withScale(currentY) - y;
  setCurrentBoxStart(xWithOffset, yWithOffset);
  clearCanvas(REFS.canvasCurrentBox);
  drawBox(REFS.canvasCurrentBox, xWithOffset, yWithOffset, width, height);
  drawTextBox(
    REFS.canvasCurrentBox,
    xWithOffset,
    yWithOffset,
    label,
    COLOR_TEXT_DEFAULT,
    COLOR_BOX_CURRENT
  );
}

function handleBoxMoveStart(boxIndex, x, y) {
  const { annotations } = getCurrentItem();
  const boxClickedInside = annotations[boxIndex];
  const { x: boxX, y: boxY, width, height, label } = boxClickedInside;
  setMovingStart();
  setCurrentBoxIndex(boxIndex);
  setCurrentBoxWidthHeight(width, height);
  setCurrentBoxStart(boxX, boxY);
  setCurrentBoxLabel(label);
  setMoveOffset(withScale(x) - boxX, withScale(y) - boxY);
  setBoxRender(boxIndex, false);
  // redraw boxes minus the current one
  clearCanvas(REFS.canvasAnnotation);
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  // draw on current layer
  clearCanvas(REFS.canvasCurrentBox);
  drawBox(REFS.canvasCurrentBox, boxX, boxY, width, height);
  drawTextBox(
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
  const { annotations } = getCurrentItem();
  setMovingEnd();
  clearCanvas(REFS.canvasAnnotation);
  // push into state
  const { startX, startY, width, height, index } = currentBox;
  updateBoxCoordinates(index, startX, startY, width, height);
  setBoxRender(index, true);
  // draw on annotations layer
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  updateCurrentAnnotationPaths(annotations);
  clearCanvas(REFS.canvasCurrentBox);
  renderAnnotationsList(annotations);
  saveStoreToLocalStorage();
  REFS.canvasCurrentBox.style.cursor = 'crosshair';
}

function handleDeleteAnnotation(boxIndex) {
  const { annotations } = getCurrentItem();
  const { label } = annotations[boxIndex];
  if (confirm(`Delete annotation ${label}?`)) {
    removeBoxFromAnnotations(boxIndex);
    renderAnnotationsList(annotations);
    clearCanvas(REFS.canvasAnnotation);
    renderAllAnnotations(REFS.canvasAnnotation, annotations);
    saveStoreToLocalStorage();
  }
}

function handleLabelChange(boxIndex, label) {
  const { annotations } = getCurrentItem();
  updateBoxLabel(boxIndex, label);
  clearCanvas(REFS.canvasAnnotation);
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  saveStoreToLocalStorage();
}

function renderAnnotationsList(annotations) {
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
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.contentEditable = 'plaintext-only'; // Might not work in firefox
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
  const key = `chairs-chairs-chairs-${image.name}`;
  reader.addEventListener('load', () => {
    localStorage.setItem(key, reader.result);
    addImageToStore(key);
    setCurrentItem(Object.keys(items).length);
    handleImageChange();
    saveStoreToLocalStorage();
    renderGallery();
  });
  enableButton(REFS.imageDeleteButton);
  REFS.emptyState.style.display = 'none';
}

function renderImageDetails() {
  const { currentItem: currentItemNumber, items } = STORE;
  const noOfItems = Object.keys(items).length;
  REFS.imageTitle.textContent = `Image ${currentItemNumber} of ${noOfItems}`;
  REFS.imageCurrentFilename.textContent = getCurrentItemImageName();
}

function handleImageChange() {
  const { imageURL, annotations } = getCurrentItem();
  addImageToCanvas(imageURL);
  renderImageDetails();
  clearCanvas(REFS.canvasAnnotation);
  renderAllAnnotations(REFS.canvasAnnotation, annotations);
  renderAnnotationsList(annotations);
  updateCurrentAnnotationPaths(annotations);
  checkAndDisableButtons();
}

function handleCurrentItemChange() {
  checkAndDisableButtons();
  handleImageChange();
  saveStoreToLocalStorage();
}

function handlePrevious() {
  const { currentItem } = STORE;
  if (currentItem > 1) {
    setCurrentItem(currentItem - 1);
  }
  handleCurrentItemChange();
}

function handleNext() {
  const { currentItem, items } = STORE;
  const noOfItems = Object.keys(items).length;
  if (currentItem < noOfItems) {
    setCurrentItem(currentItem + 1);
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
    removeAllBoxes();
    clearCanvas(REFS.canvasAnnotation);
    const { annotations } = getCurrentItem();
    renderAnnotationsList(annotations);
    updateCurrentAnnotationPaths(annotations);
    disableButton(REFS.annotationsDeleteAllButton);
    saveStoreToLocalStorage();
  }
}

function handleEmptyState() {
  clearCanvas(REFS.canvasImage);
  clearCanvas(REFS.canvasAnnotation);
  renderAnnotationsList([]);
  updateCurrentAnnotationPaths([]);
  saveStoreToLocalStorage();
  REFS.imageCurrentFilename.textContent = 'Upload an image to begin';
  REFS.imageTitle.textContent = 'No image uploaded';
  disableButton(REFS.annotationsDeleteAllButton);
  checkAndDisableButtons();
  REFS.emptyState.style.display = 'block';
}

function handleDeleteImage() {
  const { currentItem } = STORE;
  const imageName = getCurrentItemImageName();
  if (confirm(`Delete image "${imageName}"? This cannot be undone.`)) {
    removeImageFromStore(currentItem);
    const { items } = STORE;
    const itemCount = Object.keys(items).length;
    if (itemCount === 0) {
      setCurrentItem(null);
      handleEmptyState();
      return;
    }
    if (currentItem > itemCount) {
      handlePrevious();
      return;
    }
    handleCurrentItemChange();
    renderGallery();
  }
}

function handleMouseMoveCursorChange(e) {
  const { annotations } = getCurrentItem();
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
    const labelEl = document.createElement('span');
    labelEl.textContent = `(${index + 1}) ${imageKeyToFileName(imageURL)}`;
    li.addEventListener('click', () => {
      setCurrentItem(index + 1);
      handleCurrentItemChange();
    });
    li.appendChild(img);
    li.appendChild(labelEl);
    REFS.galleryList.appendChild(li);
  });
}

// Event bindings
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
REFS.imageUploadButton.addEventListener('click', (e) => {
  REFS.imageUploadInput.click();
});
REFS.emptyState.addEventListener('click', (e) => {
  REFS.imageUploadInput.click();
});
REFS.imageUploadInput.addEventListener('change', (e) => {
  const image = e.target.files[0];
  // TODO check type and file size
  handleImageUpload(image);
});
REFS.imageDeleteButton.addEventListener('click', (e) => {
  handleDeleteImage();
});
REFS.imagePrevious.addEventListener('click', (e) => {
  handlePrevious();
});
REFS.imageNext.addEventListener('click', (e) => {
  handleNext();
});
REFS.annotationsDeleteAllButton.addEventListener('click', (e) => {
  handleDeleteAllAnnotations();
});
const resizeObserver = new ResizeObserver((entries) => {
  for (let _ of entries) {
    updateCanvasScale(REFS.canvasCurrentBox);
  }
});
resizeObserver.observe(REFS.canvasCurrentBox);

// init
// document.ready, then
window.onload = function () {
  readStoreFromLocalStorage();
  updateCanvasScale(REFS.canvasCurrentBox);
  const { currentItem } = STORE;
  if (currentItem) {
    const { imageURL, annotations } = getCurrentItem();
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

import { imageKeyToFileName } from './helpers.js';
export const STORE_KEY_PREFIX = 'chairs-chairs-chairs';
export const STORE_KEY_MAIN = `${STORE_KEY_PREFIX}-store`;

export const STORE = {
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
  hasSupportContentEditablePlainText: false,
};

// State Getters/Setters
export function getCurrentItem() {
  const { items, currentItem } = STORE;
  return items[currentItem];
}
export function getCurrentItemImageName() {
  const { imageURL } = getCurrentItem();
  return imageKeyToFileName(imageURL);
}
export function setSupportsContentEditablePlainText(isSupported) {
  STORE.hasSupportContentEditablePlainText = isSupported;
}
export function setDrawingStart() {
  STORE.isDrawingBox = true;
}
export function setDrawingEnd() {
  STORE.isDrawingBox = false;
}
export function setMovingStart() {
  STORE.isMovingBox = true;
}
export function setMovingEnd() {
  STORE.isMovingBox = false;
}
export function setCanvasScale(scale) {
  STORE.canvas.scale = scale;
}
export function setCurrentBoxStart(x, y) {
  STORE.currentBox.startX = x;
  STORE.currentBox.startY = y;
}
export function setCurrentBoxIndex(index) {
  STORE.currentBox.index = index;
}
export function setCurrentBoxLabel(label) {
  STORE.currentBox.label = label;
}
export function setCurrentBoxWidthHeight(width, height) {
  STORE.currentBox.width = width;
  STORE.currentBox.height = height;
}
export function setCurrentAnnotationPaths(paths) {
  STORE.currentAnnotationPaths = paths;
}
export function setMoveOffset(x, y) {
  STORE.moveOffset = { x, y };
}
export function setCurrentItem(itemKey) {
  // Example of error handling, not implemented project-wide
  if (itemKey !== null && !STORE.items[itemKey]) {
    console.error(`Attempted to set current item to invalid key: ${itemKey}`);
    return;
  }
  STORE.currentItem = itemKey;
}
export function updateBoxCoordinates(boxIndex, x, y, width, height) {
  const { annotations } = getCurrentItem();
  const box = annotations[boxIndex];
  const updatedBox = { ...box, x, y, width, height };
  annotations[boxIndex] = updatedBox;
}
export function updateBoxLabel(boxIndex, label) {
  const { annotations } = getCurrentItem();
  const box = annotations[boxIndex];
  const updatedBox = { ...box, label };
  annotations[boxIndex] = updatedBox;
}
export function removeBoxFromAnnotations(boxIndex) {
  const { annotations } = getCurrentItem();
  annotations.splice(boxIndex, 1);
}
export function removeAllAnnotations() {
  const { currentItem, items } = STORE;
  items[currentItem].annotations = [];
}
export function addBoxToAnnotations(x, y, width, height) {
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
export function setBoxRender(boxIndex, isRender) {
  const { annotations } = getCurrentItem();
  annotations[boxIndex].isRender = isRender;
}
export function addImageToMainStore(imageName) {
  const imageKeyInLocalStorage = `${STORE_KEY_PREFIX}-${imageName}`;
  const itemKeysLength = Object.keys(STORE.items).length;
  const newItemKey = itemKeysLength === 0 ? 1 : itemKeysLength + 1;
  STORE.items[newItemKey] = {
    imageURL: imageKeyInLocalStorage,
    annotations: [],
  };
}
export function removeImageFromStore(itemKeyToDelete) {
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
  localStorage.removeItem(`${STORE_KEY_PREFIX}-${imageURL}`);
}

export function saveImageToLocalStorage(imageName, imageData) {
  localStorage.setItem(`${STORE_KEY_PREFIX}-${imageName}`, imageData);
}

export function removeImageFromLocalStorage() {
  const { items, currentItem } = STORE;
  localStorage.setItem(STORE_KEY_MAIN, JSON.stringify({ items, currentItem }));
}

export function saveStoreToLocalStorage() {
  const { items, currentItem } = STORE;
  localStorage.setItem(STORE_KEY_MAIN, JSON.stringify({ items, currentItem }));
}
export function readStoreFromLocalStorage() {
  const stored = localStorage.getItem(STORE_KEY_MAIN);
  if (stored) {
    const { items, currentItem } = JSON.parse(stored);
    STORE.items = items;
    STORE.currentItem = currentItem;
  }
}

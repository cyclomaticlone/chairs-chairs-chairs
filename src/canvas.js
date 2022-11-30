export const CANVAS_FONT = '14px sans-serif';
export const TEXT_X_OFFSET = 4;
export const TEXT_Y_OFFSET = -10;
const TEXTBOX_Y_OFFSET = -18;
const TEXTBOX_X_OFFSET = 12;
export const COLOR_BOX_DEFAULT = '#000000';
export const COLOR_TEXT_DEFAULT = 'white';
export const BORDER_WIDTH = 1;

export function drawImageToFit(canvas, img) {
  const context = canvas.getContext('2d');
  const imgScale = Math.min(
    canvas.width / img.width,
    canvas.height / img.height
  );
  const x = canvas.width / 2 - (img.width / 2) * imgScale;
  const y = canvas.height / 2 - (img.height / 2) * imgScale;
  context.drawImage(img, x, y, img.width * imgScale, img.height * imgScale);
}

export function addImageToCanvas(localStorageKey) {
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

export function drawBox(canvas, x, y, width, height) {
  const context = canvas.getContext('2d');
  context.fillStyle = COLOR_BOX_DEFAULT;
  context.strokeRect(x, y, width, height);
}

export function drawTextBox(canvas, x, y, text, colorText, colorBox) {
  const context = canvas.getContext('2d');
  context.font = CANVAS_FONT;
  const textMetrics = context.measureText(text);
  context.fillStyle = colorBox || COLOR_BOX_DEFAULT;

  context.fillRect(
    x - BORDER_WIDTH, // border width
    y + TEXTBOX_Y_OFFSET - textMetrics.actualBoundingBoxAscent,
    textMetrics.width + TEXTBOX_X_OFFSET,
    textMetrics.actualBoundingBoxAscent + Math.abs(TEXTBOX_Y_OFFSET)
  );
  context.fillStyle = colorText || COLOR_TEXT_DEFAULT;
  context.fillText(text, x + TEXT_X_OFFSET, y + TEXT_Y_OFFSET);
}

export function clearCanvas(canvas) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
}

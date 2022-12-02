import * as canv from './canvas';

const TEST_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII';

function getEventByType(canvasEvents, eventType) {
  return canvasEvents.find((event) => event.type === eventType);
}
function getFillStyleValue(canvasEvents) {
  return getEventByType(canvasEvents, 'fillStyle')?.props?.value;
}
function getFontValue(canvasEvents) {
  return getEventByType(canvasEvents, 'font')?.props?.value;
}
function getStrokeRectProps(canvasEvents) {
  return getEventByType(canvasEvents, 'strokeRect')?.props;
}
function getFillRectProps(canvasEvents) {
  return getEventByType(canvasEvents, 'fillRect')?.props;
}
function getFillTextProps(canvasEvents) {
  return getEventByType(canvasEvents, 'fillText')?.props;
}
function getDrawImageProps(canvasEvents) {
  return getEventByType(canvasEvents, 'drawImage')?.props;
}

describe('Canvas', () => {
  let testCanvas, testCtx;
  beforeEach(function () {
    testCanvas = document.createElement('canvas');
    testCtx = testCanvas.getContext('2d');
  });

  it('draws annotation box', () => {
    const [x, y, width, height] = [100, 150, 200, 75];
    canv.drawBox(testCanvas, x, y, width, height);
    const canvasEvents = testCtx.__getEvents();
    expect(canvasEvents).toHaveLength(2);
    expect(getFillStyleValue(canvasEvents)).toBe(canv.COLOR_BOX_DEFAULT);
    const strokeRectProps = getStrokeRectProps(canvasEvents);
    expect(strokeRectProps.x).toBe(x);
    expect(strokeRectProps.y).toBe(y);
    expect(strokeRectProps.width).toBe(width);
    expect(strokeRectProps.height).toBe(height);
  });

  it('draw annotation label text and background', () => {
    const [x, y, text, colorText, colorBox] = [
      100,
      150,
      'Label 1',
      '#ff0000',
      '#0000ff',
    ];
    canv.drawTextBox(testCanvas, x, y, text, colorText, colorBox);
    const canvasEvents = testCtx.__getEvents();
    expect(canvasEvents).toHaveLength(6);
    expect(getFontValue(canvasEvents)).toBe(canv.CANVAS_FONT);
    const rectEventIndex = canvasEvents.findIndex(
      (event) => event.type === 'fillRect'
    );
    const boxEvents = canvasEvents.slice(
      rectEventIndex - 1,
      rectEventIndex + 1
    );

    expect(getFillStyleValue(boxEvents)).toBe(colorBox);
    const fillRectProps = getFillRectProps(boxEvents);
    expect(fillRectProps.x).toBe(x - canv.BORDER_WIDTH);
    // the below values are based on the text's width and height,
    // but TextMetrics is not reliably implemented in jest-canvas-mock
    expect(fillRectProps.y).toBe(132);
    expect(fillRectProps.height).toBe(18);
    expect(fillRectProps.width).toBe(19);

    const textEventIndex = canvasEvents.findIndex(
      (event) => event.type === 'fillText'
    );
    const textEvents = canvasEvents.slice(
      textEventIndex - 1,
      textEventIndex + 1
    );
    expect(getFillStyleValue(textEvents)).toBe(colorText);
    const fillTextProps = getFillTextProps(textEvents);
    expect(fillTextProps.text).toBe(text);
    expect(fillTextProps.x).toBe(x + canv.TEXT_X_OFFSET);
    expect(fillTextProps.y).toBe(y + canv.TEXT_Y_OFFSET);
  });

  it('draw annotation label text and background with default colours', () => {
    const [x, y, text] = [30, 20, 'Label 1'];
    canv.drawTextBox(testCanvas, x, y, text);
    const canvasEvents = testCtx.__getEvents();
    expect(canvasEvents).toHaveLength(6);
    expect(getFontValue(canvasEvents)).toBe(canv.CANVAS_FONT);
    const rectEventIndex = canvasEvents.findIndex(
      (event) => event.type === 'fillRect'
    );
    const boxEvents = canvasEvents.slice(
      rectEventIndex - 1,
      rectEventIndex + 1
    );

    expect(getFillStyleValue(boxEvents)).toBe(canv.COLOR_BOX_DEFAULT);
    const fillRectProps = getFillRectProps(boxEvents);
    expect(fillRectProps.x).toBe(x - canv.BORDER_WIDTH);
    // the below values are based on the text's width and height,
    // but TextMetrics is not reliably implemented in jest-canvas-mock
    expect(fillRectProps.y).toBe(2);
    expect(fillRectProps.height).toBe(18);
    expect(fillRectProps.width).toBe(19);

    const textEventIndex = canvasEvents.findIndex(
      (event) => event.type === 'fillText'
    );
    const textEvents = canvasEvents.slice(
      textEventIndex - 1,
      textEventIndex + 1
    );
    expect(getFillStyleValue(textEvents)).toBe(canv.COLOR_TEXT_DEFAULT);
    const fillTextProps = getFillTextProps(textEvents);
    expect(fillTextProps.text).toBe(text);
    expect(fillTextProps.x).toBe(x + canv.TEXT_X_OFFSET);
    expect(fillTextProps.y).toBe(y + canv.TEXT_Y_OFFSET);
  });

  it('clears canvas', () => {
    canv.clearCanvas(testCanvas);
    const canvasEvents = testCtx.__getEvents();
    expect(canvasEvents).toHaveLength(1);
    expect(canvasEvents[0].type).toBe('clearRect');
  });

  it('draws image', async () => {
    testCanvas.width = 1000;
    testCanvas.height = 500;
    const [imgWidth, imgHeight] = [100, 200];
    const img = new Image(imgWidth, imgHeight);
    img.src = TEST_IMAGE;

    canv.drawImageToFit(testCanvas, img);
    const canvasEvents = testCtx.__getEvents();
    expect(canvasEvents).toHaveLength(1);
    const drawImageProps = getDrawImageProps(canvasEvents);
    expect(drawImageProps.dx).toBe(375); // positioned
    expect(drawImageProps.dHeight).toBe(imgHeight);
    expect(drawImageProps.dWidth).toBe(imgWidth);
    expect(drawImageProps.img.src).toBe(TEST_IMAGE);
  });

  // calculateCanvasScale is hard to test as getBoundingClientRect() always returns 0s in jsdom
});

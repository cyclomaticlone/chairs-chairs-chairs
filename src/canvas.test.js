import * as canv from './canvas';

const DUMMY_IMAGE =
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

  // do above test with colours not provided

  it('clears canvas', () => {
    canv.clearCanvas(testCanvas);
    const canvasEvents = testCtx.__getEvents();
    expect(canvasEvents).toHaveLength(1);
    expect(canvasEvents[0].type).toBe('clearRect');
  });
});

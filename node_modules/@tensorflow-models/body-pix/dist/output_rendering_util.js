"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var blur_1 = require("./blur");
var offScreenCanvases = {};
function isSafari() {
    return (/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
}
function assertSameDimensions(_a, _b, nameA, nameB) {
    var widthA = _a.width, heightA = _a.height;
    var widthB = _b.width, heightB = _b.height;
    if (widthA !== widthB || heightA !== heightB) {
        throw new Error("error: dimensions must match. " + nameA + " has dimensions " + widthA + "x" + heightA + ", " + nameB + " has dimensions " + widthB + "x" + heightB);
    }
}
function flipCanvasHorizontal(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
}
function drawWithCompositing(ctx, image, compositOperation) {
    ctx.globalCompositeOperation = compositOperation;
    ctx.drawImage(image, 0, 0);
}
function createOffScreenCanvas() {
    var offScreenCanvas = document.createElement('canvas');
    return offScreenCanvas;
}
function ensureOffscreenCanvasCreated(id) {
    if (!offScreenCanvases[id]) {
        offScreenCanvases[id] = createOffScreenCanvas();
    }
    return offScreenCanvases[id];
}
function drawAndBlurImageOnCanvas(image, blurAmount, canvas) {
    var height = image.height, width = image.width;
    var ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    if (isSafari()) {
        blur_1.cpuBlur(canvas, image, blurAmount);
    }
    else {
        ctx.filter = "blur(" + blurAmount + "px)";
        ctx.drawImage(image, 0, 0, width, height);
    }
    ctx.restore();
}
function drawAndBlurImageOnOffScreenCanvas(image, blurAmount, offscreenCanvasName) {
    var canvas = ensureOffscreenCanvasCreated(offscreenCanvasName);
    if (blurAmount === 0) {
        renderImageToCanvas(image, canvas);
    }
    else {
        drawAndBlurImageOnCanvas(image, blurAmount, canvas);
    }
    return canvas;
}
function renderImageToCanvas(image, canvas) {
    var width = image.width, height = image.height;
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
}
function renderImageDataToCanvas(image, canvas) {
    canvas.width = image.width;
    canvas.height = image.height;
    var ctx = canvas.getContext('2d');
    ctx.putImageData(image, 0, 0);
}
function renderImageDataToOffScreenCanvas(image, canvasName) {
    var canvas = ensureOffscreenCanvasCreated(canvasName);
    renderImageDataToCanvas(image, canvas);
    return canvas;
}
function toMaskImageData(segmentation, maskBackground) {
    if (maskBackground === void 0) { maskBackground = true; }
    var width = segmentation.width, height = segmentation.height, data = segmentation.data;
    var bytes = new Uint8ClampedArray(width * height * 4);
    for (var i = 0; i < height * width; ++i) {
        var shouldMask = maskBackground ? 1 - data[i] : data[i];
        var alpha = shouldMask * 255;
        var j = i * 4;
        bytes[j + 0] = 0;
        bytes[j + 1] = 0;
        bytes[j + 2] = 0;
        bytes[j + 3] = Math.round(alpha);
    }
    return new ImageData(bytes, width, height);
}
exports.toMaskImageData = toMaskImageData;
function toColoredPartImageData(partSegmentation, partColors) {
    var width = partSegmentation.width, height = partSegmentation.height, data = partSegmentation.data;
    var bytes = new Uint8ClampedArray(width * height * 4);
    for (var i = 0; i < height * width; ++i) {
        var partId = Math.round(data[i]);
        var j = i * 4;
        if (partId === -1) {
            bytes[j + 0] = 255;
            bytes[j + 1] = 255;
            bytes[j + 2] = 255;
            bytes[j + 3] = 255;
        }
        else {
            var color = partColors[partId];
            if (!color) {
                throw new Error("No color could be found for part id " + partId);
            }
            bytes[j + 0] = color[0];
            bytes[j + 1] = color[1];
            bytes[j + 2] = color[2];
            bytes[j + 3] = 255;
        }
    }
    return new ImageData(bytes, width, height);
}
exports.toColoredPartImageData = toColoredPartImageData;
var CANVAS_NAMES = {
    blurred: 'blurred',
    blurredMask: 'blurred-mask',
    mask: 'mask',
    lowresPartMask: 'lowres-part-mask',
};
function drawMask(canvas, image, maskImage, maskOpacity, maskBlurAmount, flipHorizontal) {
    if (maskOpacity === void 0) { maskOpacity = 0.7; }
    if (maskBlurAmount === void 0) { maskBlurAmount = 0; }
    if (flipHorizontal === void 0) { flipHorizontal = false; }
    assertSameDimensions(image, maskImage, 'image', 'mask');
    var mask = renderImageDataToOffScreenCanvas(maskImage, CANVAS_NAMES.mask);
    var blurredMask = drawAndBlurImageOnOffScreenCanvas(mask, maskBlurAmount, CANVAS_NAMES.blurredMask);
    canvas.width = blurredMask.width;
    canvas.height = blurredMask.height;
    var ctx = canvas.getContext('2d');
    ctx.save();
    if (flipHorizontal) {
        flipCanvasHorizontal(canvas);
    }
    ctx.drawImage(image, 0, 0);
    ctx.globalAlpha = maskOpacity;
    ctx.drawImage(blurredMask, 0, 0);
    ctx.restore();
}
exports.drawMask = drawMask;
function drawPixelatedMask(canvas, image, maskImage, maskOpacity, maskBlurAmount, flipHorizontal, pixelCellWidth) {
    if (maskOpacity === void 0) { maskOpacity = 0.7; }
    if (maskBlurAmount === void 0) { maskBlurAmount = 0; }
    if (flipHorizontal === void 0) { flipHorizontal = false; }
    if (pixelCellWidth === void 0) { pixelCellWidth = 10.0; }
    assertSameDimensions(image, maskImage, 'image', 'mask');
    var mask = renderImageDataToOffScreenCanvas(maskImage, CANVAS_NAMES.mask);
    var blurredMask = drawAndBlurImageOnOffScreenCanvas(mask, maskBlurAmount, CANVAS_NAMES.blurredMask);
    canvas.width = blurredMask.width;
    canvas.height = blurredMask.height;
    var ctx = canvas.getContext('2d');
    ctx.save();
    if (flipHorizontal) {
        flipCanvasHorizontal(canvas);
    }
    var offscreenCanvas = ensureOffscreenCanvasCreated(CANVAS_NAMES.lowresPartMask);
    var offscreenCanvasCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = blurredMask.width * (1.0 / pixelCellWidth);
    offscreenCanvas.height = blurredMask.height * (1.0 / pixelCellWidth);
    offscreenCanvasCtx.drawImage(blurredMask, 0, 0, blurredMask.width, blurredMask.height, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreenCanvas, 0, 0, offscreenCanvas.width, offscreenCanvas.height, 0, 0, canvas.width, canvas.height);
    for (var i = 0; i < offscreenCanvas.width; i++) {
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.moveTo(pixelCellWidth * i, 0);
        ctx.lineTo(pixelCellWidth * i, canvas.height);
        ctx.stroke();
    }
    for (var i = 0; i < offscreenCanvas.height; i++) {
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.moveTo(0, pixelCellWidth * i);
        ctx.lineTo(canvas.width, pixelCellWidth * i);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0 - maskOpacity;
    ctx.drawImage(image, 0, 0);
    ctx.restore();
}
exports.drawPixelatedMask = drawPixelatedMask;
function createPersonMask(segmentation, edgeBlurAmount) {
    var maskBackground = false;
    var backgroundMaskImage = toMaskImageData(segmentation, maskBackground);
    var backgroundMask = renderImageDataToOffScreenCanvas(backgroundMaskImage, CANVAS_NAMES.mask);
    if (edgeBlurAmount === 0) {
        return backgroundMask;
    }
    else {
        return drawAndBlurImageOnOffScreenCanvas(backgroundMask, edgeBlurAmount, CANVAS_NAMES.blurredMask);
    }
}
function drawBokehEffect(canvas, image, personSegmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal) {
    if (backgroundBlurAmount === void 0) { backgroundBlurAmount = 3; }
    if (edgeBlurAmount === void 0) { edgeBlurAmount = 3; }
    if (flipHorizontal === void 0) { flipHorizontal = false; }
    assertSameDimensions(image, personSegmentation, 'image', 'segmentation');
    var blurredImage = drawAndBlurImageOnOffScreenCanvas(image, backgroundBlurAmount, CANVAS_NAMES.blurred);
    var personMask = createPersonMask(personSegmentation, edgeBlurAmount);
    var ctx = canvas.getContext('2d');
    ctx.save();
    if (flipHorizontal) {
        flipCanvasHorizontal(canvas);
    }
    ctx.drawImage(image, 0, 0);
    drawWithCompositing(ctx, personMask, 'destination-in');
    drawWithCompositing(ctx, blurredImage, 'destination-over');
    ctx.restore();
}
exports.drawBokehEffect = drawBokehEffect;
//# sourceMappingURL=output_rendering_util.js.map
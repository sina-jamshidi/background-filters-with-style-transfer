"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tf = require("@tensorflow/tfjs-core");
function toInputTensor(input) {
    return input instanceof tf.Tensor ? input : tf.browser.fromPixels(input);
}
exports.toInputTensor = toInputTensor;
function resizeAndPadTo(imageTensor, _a, flipHorizontal) {
    var targetH = _a[0], targetW = _a[1];
    if (flipHorizontal === void 0) { flipHorizontal = false; }
    var _b = imageTensor.shape, height = _b[0], width = _b[1];
    var targetAspect = targetW / targetH;
    var aspect = width / height;
    var resizeW;
    var resizeH;
    var padL;
    var padR;
    var padT;
    var padB;
    if (aspect > targetAspect) {
        resizeW = targetW;
        resizeH = Math.ceil(resizeW / aspect);
        var padHeight = targetH - resizeH;
        padL = 0;
        padR = 0;
        padT = Math.floor(padHeight / 2);
        padB = targetH - (resizeH + padT);
    }
    else {
        resizeH = targetH;
        resizeW = Math.ceil(targetH * aspect);
        var padWidth = targetW - resizeW;
        padL = Math.floor(padWidth / 2);
        padR = targetW - (resizeW + padL);
        padT = 0;
        padB = 0;
    }
    var resizedAndPadded = tf.tidy(function () {
        var resized;
        if (flipHorizontal) {
            resized = imageTensor.reverse(1).resizeBilinear([resizeH, resizeW]);
        }
        else {
            resized = imageTensor.resizeBilinear([resizeH, resizeW]);
        }
        var padded = tf.pad3d(resized, [[padT, padB], [padL, padR], [0, 0]]);
        return padded;
    });
    return { resizedAndPadded: resizedAndPadded, paddedBy: [[padT, padB], [padL, padR]] };
}
exports.resizeAndPadTo = resizeAndPadTo;
function scaleAndCropToInputTensorShape(tensor, _a, _b, _c) {
    var inputTensorHeight = _a[0], inputTensorWidth = _a[1];
    var resizedAndPaddedHeight = _b[0], resizedAndPaddedWidth = _b[1];
    var _d = _c[0], padT = _d[0], padB = _d[1], _e = _c[1], padL = _e[0], padR = _e[1];
    return tf.tidy(function () {
        var inResizedAndPaddedSize = tensor.resizeBilinear([resizedAndPaddedHeight, resizedAndPaddedWidth], true);
        return removePaddingAndResizeBack(inResizedAndPaddedSize, [inputTensorHeight, inputTensorWidth], [[padT, padB], [padL, padR]]);
    });
}
exports.scaleAndCropToInputTensorShape = scaleAndCropToInputTensorShape;
function removePaddingAndResizeBack(resizedAndPadded, _a, _b) {
    var originalHeight = _a[0], originalWidth = _a[1];
    var _c = _b[0], padT = _c[0], padB = _c[1], _d = _b[1], padL = _d[0], padR = _d[1];
    var _e = resizedAndPadded.shape, height = _e[0], width = _e[1];
    var cropH = height - (padT + padB);
    var cropW = width - (padL + padR);
    return tf.tidy(function () {
        var withPaddingRemoved = tf.slice3d(resizedAndPadded, [padT, padL, 0], [cropH, cropW, resizedAndPadded.shape[2]]);
        var atOriginalSize = withPaddingRemoved.resizeBilinear([originalHeight, originalWidth], true);
        return atOriginalSize;
    });
}
exports.removePaddingAndResizeBack = removePaddingAndResizeBack;
function resize2d(tensor, resolution, nearestNeighbor) {
    return tf.tidy(function () { return tensor.expandDims(2)
        .resizeBilinear(resolution, nearestNeighbor)
        .squeeze(); });
}
exports.resize2d = resize2d;
//# sourceMappingURL=util.js.map
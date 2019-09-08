"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tfconv = require("@tensorflow/tfjs-converter");
var tf = require("@tensorflow/tfjs-core");
var checkpoints_1 = require("./checkpoints");
var decode_part_map_1 = require("./decode_part_map");
var mobilenet_1 = require("./mobilenet");
var model_weights_1 = require("./model_weights");
var util_1 = require("./util");
var segmentationModelImageDimensions = [353, 257];
var BodyPix = (function () {
    function BodyPix(mobileNet) {
        this.mobileNet = mobileNet;
    }
    BodyPix.prototype.predictForSegmentation = function (input, outputStride) {
        var _this = this;
        if (outputStride === void 0) { outputStride = 16; }
        mobilenet_1.assertValidOutputStride(outputStride);
        return tf.tidy(function () {
            var mobileNetOutput = _this.mobileNet.predict(input, outputStride);
            return _this.mobileNet.convToOutput(mobileNetOutput, 'segment_2')
                .sigmoid();
        });
    };
    BodyPix.prototype.predictForPartMap = function (input, outputStride) {
        var _this = this;
        if (outputStride === void 0) { outputStride = 16; }
        mobilenet_1.assertValidOutputStride(outputStride);
        return tf.tidy(function () {
            var mobileNetOutput = _this.mobileNet.predict(input, outputStride);
            var segments = _this.mobileNet.convToOutput(mobileNetOutput, 'segment_2');
            var partHeatmaps = _this.mobileNet.convToOutput(mobileNetOutput, 'part_heatmap_2');
            return {
                segmentScores: segments.sigmoid(),
                partHeatmapScores: partHeatmaps.sigmoid()
            };
        });
    };
    BodyPix.prototype.estimatePersonSegmentationActivation = function (input, outputStride, segmentationThreshold) {
        var _this = this;
        if (outputStride === void 0) { outputStride = 16; }
        if (segmentationThreshold === void 0) { segmentationThreshold = 0.5; }
        mobilenet_1.assertValidOutputStride(outputStride);
        return tf.tidy(function () {
            var imageTensor = util_1.toInputTensor(input);
            var _a = util_1.resizeAndPadTo(imageTensor, segmentationModelImageDimensions), resizedAndPadded = _a.resizedAndPadded, paddedBy = _a.paddedBy;
            var segmentScores = _this.predictForSegmentation(resizedAndPadded, outputStride);
            var _b = resizedAndPadded.shape, resizedHeight = _b[0], resizedWidth = _b[1];
            var _c = imageTensor.shape, height = _c[0], width = _c[1];
            var scaledSegmentScores = util_1.scaleAndCropToInputTensorShape(segmentScores, [height, width], [resizedHeight, resizedWidth], paddedBy);
            return decode_part_map_1.toMask(scaledSegmentScores.squeeze(), segmentationThreshold);
        });
    };
    BodyPix.prototype.estimatePersonSegmentation = function (input, outputStride, segmentationThreshold) {
        if (outputStride === void 0) { outputStride = 16; }
        if (segmentationThreshold === void 0) { segmentationThreshold = 0.5; }
        return __awaiter(this, void 0, void 0, function () {
            var segmentation, _a, height, width, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        segmentation = this.estimatePersonSegmentationActivation(input, outputStride, segmentationThreshold);
                        _a = segmentation.shape, height = _a[0], width = _a[1];
                        return [4, segmentation.data()];
                    case 1:
                        result = _b.sent();
                        segmentation.dispose();
                        return [2, { height: height, width: width, data: result }];
                }
            });
        });
    };
    BodyPix.prototype.estimatePartSegmentationActivation = function (input, outputStride, segmentationThreshold) {
        var _this = this;
        if (outputStride === void 0) { outputStride = 16; }
        if (segmentationThreshold === void 0) { segmentationThreshold = 0.5; }
        mobilenet_1.assertValidOutputStride(outputStride);
        return tf.tidy(function () {
            var imageTensor = util_1.toInputTensor(input);
            var _a = util_1.resizeAndPadTo(imageTensor, segmentationModelImageDimensions), resizedAndPadded = _a.resizedAndPadded, paddedBy = _a.paddedBy;
            var _b = _this.predictForPartMap(resizedAndPadded, outputStride), segmentScores = _b.segmentScores, partHeatmapScores = _b.partHeatmapScores;
            var _c = resizedAndPadded.shape, resizedHeight = _c[0], resizedWidth = _c[1];
            var _d = imageTensor.shape, height = _d[0], width = _d[1];
            var scaledSegmentScores = util_1.scaleAndCropToInputTensorShape(segmentScores, [height, width], [resizedHeight, resizedWidth], paddedBy);
            var scaledPartHeatmapScore = util_1.scaleAndCropToInputTensorShape(partHeatmapScores, [height, width], [resizedHeight, resizedWidth], paddedBy);
            var segmentationMask = decode_part_map_1.toMask(scaledSegmentScores.squeeze(), segmentationThreshold);
            return decode_part_map_1.decodePartSegmentation(segmentationMask, scaledPartHeatmapScore);
        });
    };
    BodyPix.prototype.estimatePartSegmentation = function (input, outputStride, segmentationThreshold) {
        if (outputStride === void 0) { outputStride = 16; }
        if (segmentationThreshold === void 0) { segmentationThreshold = 0.5; }
        return __awaiter(this, void 0, void 0, function () {
            var partSegmentation, _a, height, width, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        partSegmentation = this.estimatePartSegmentationActivation(input, outputStride, segmentationThreshold);
                        _a = partSegmentation.shape, height = _a[0], width = _a[1];
                        return [4, partSegmentation.data()];
                    case 1:
                        data = _b.sent();
                        partSegmentation.dispose();
                        return [2, { height: height, width: width, data: data }];
                }
            });
        });
    };
    BodyPix.prototype.dispose = function () {
        this.mobileNet.dispose();
    };
    return BodyPix;
}());
exports.BodyPix = BodyPix;
function load(multiplier) {
    if (multiplier === void 0) { multiplier = 0.75; }
    return __awaiter(this, void 0, void 0, function () {
        var possibleMultipliers, mobileNet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (tf == null) {
                        throw new Error("Cannot find TensorFlow.js. If you are using a <script> tag, please " +
                            "also include @tensorflow/tfjs on the page before using this model.");
                    }
                    possibleMultipliers = Object.keys(checkpoints_1.checkpoints);
                    tf.util.assert(typeof multiplier === 'number', function () { return "got multiplier type of " + typeof multiplier + " when it should be a " +
                        "number."; });
                    tf.util.assert(possibleMultipliers.indexOf(multiplier.toString()) >= 0, function () { return "invalid multiplier value of " + multiplier +
                        ".  No checkpoint exists for that " +
                        ("multiplier. Must be one of " + possibleMultipliers.join(',') + "."); });
                    return [4, exports.mobilenetLoader.load(multiplier)];
                case 1:
                    mobileNet = _a.sent();
                    return [2, new BodyPix(mobileNet)];
            }
        });
    });
}
exports.load = load;
exports.mobilenetLoader = {
    load: function (multiplier) { return __awaiter(_this, void 0, void 0, function () {
        var checkpoint, baseUrl, model, weights;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    checkpoint = checkpoints_1.checkpoints[multiplier];
                    baseUrl = checkpoint.url;
                    return [4, tfconv.loadGraphModel(baseUrl + "model.json")];
                case 1:
                    model = _a.sent();
                    weights = new model_weights_1.ModelWeights(model);
                    return [2, new mobilenet_1.MobileNet(weights, checkpoint.architecture)];
            }
        });
    }); }
};
//# sourceMappingURL=body_pix_model.js.map
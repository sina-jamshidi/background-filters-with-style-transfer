"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ModelWeights = (function () {
    function ModelWeights(graphModel) {
        this.graphModel = graphModel;
    }
    ModelWeights.prototype.weights = function (layerName) {
        return this.getVariable("MobilenetV1/" + layerName + "/weights");
    };
    ModelWeights.prototype.convBias = function (layerName, doublePrefix) {
        if (doublePrefix === void 0) { doublePrefix = true; }
        return this.getVariable("MobilenetV1/" + layerName + "/Conv2D_bias");
    };
    ModelWeights.prototype.depthwiseBias = function (layerName) {
        return this.getVariable("MobilenetV1/" + layerName + "/depthwise_bias");
    };
    ModelWeights.prototype.depthwiseWeights = function (layerName) {
        return this.getVariable("MobilenetV1/" + layerName + "/depthwise_weights");
    };
    ModelWeights.prototype.getVariable = function (name) {
        return this.graphModel.weights["" + name][0];
    };
    ModelWeights.prototype.dispose = function () {
        this.graphModel.dispose();
    };
    return ModelWeights;
}());
exports.ModelWeights = ModelWeights;
//# sourceMappingURL=model_weights.js.map
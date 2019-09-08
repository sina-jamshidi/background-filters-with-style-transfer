"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mobilenet_1 = require("./mobilenet");
var BASE_URL = 'https://storage.googleapis.com/tfjs-models/savedmodel/';
exports.checkpoints = {
    1.0: {
        url: BASE_URL + 'posenet_mobilenet_100_partmap/',
        architecture: mobilenet_1.mobileNetArchitectures[100]
    },
    0.75: {
        url: BASE_URL + 'posenet_mobilenet_075_partmap/',
        architecture: mobilenet_1.mobileNetArchitectures[75]
    },
    0.5: {
        url: BASE_URL + 'posenet_mobilenet_050_partmap/',
        architecture: mobilenet_1.mobileNetArchitectures[50]
    },
    0.25: {
        url: BASE_URL + 'posenet_mobilenet_025_partmap/',
        architecture: mobilenet_1.mobileNetArchitectures[25]
    }
};
//# sourceMappingURL=checkpoints.js.map
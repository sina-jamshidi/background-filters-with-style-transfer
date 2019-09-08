"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tf = require("@tensorflow/tfjs-core");
var jasmine_util_1 = require("@tensorflow/tfjs-core/dist/jasmine_util");
var body_pix_model_1 = require("./body_pix_model");
jasmine_util_1.describeWithFlags('BodyPix', jasmine_util_1.NODE_ENVS, function () {
    var net;
    beforeAll(function (done) {
        spyOn(body_pix_model_1.mobilenetLoader, 'load').and.callFake(function () {
            return {
                predict: function () { return tf.zeros([1000]); },
                convToOutput: function (mobileNetOutput, outputLayerName) {
                    var shapes = {
                        'segment_2': [23, 17, 1],
                        'part_heatmap_2': [23, 17, 24]
                    };
                    return tf.zeros(shapes[outputLayerName]);
                }
            };
        });
        body_pix_model_1.load()
            .then(function (model) {
            net = model;
        })
            .then(done)
            .catch(done.fail);
    });
    it('estimatePersonSegmentation does not leak memory', function (done) {
        var input = tf.zeros([513, 513, 3]);
        var beforeTensors = tf.memory().numTensors;
        net.estimatePersonSegmentation(input, 16)
            .then(function () {
            expect(tf.memory().numTensors).toEqual(beforeTensors);
        })
            .then(done)
            .catch(done.fail);
    });
    it('estimatePartSegmenation does not leak memory', function (done) {
        var input = tf.zeros([513, 513, 3]);
        var beforeTensors = tf.memory().numTensors;
        net.estimatePartSegmentation(input)
            .then(function () {
            expect(tf.memory().numTensors).toEqual(beforeTensors);
        })
            .then(done)
            .catch(done.fail);
    });
});
//# sourceMappingURL=body_pix_test.js.map
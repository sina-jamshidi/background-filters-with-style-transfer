# Background Filters with Style Transfer
This project uses TensorflowJS's [BodyPix model](https://github.com/tensorflow/tfjs-models/tree/master/body-pix) to perform body segmentation to extract an image background. Then using Reiichiro Nakano's [arbitrary style transfer models](https://github.com/reiinakano/arbitrary-image-stylization-tfjs) a style transfer is applied to the background.

For reference, there's also simple grayscale and sepia filters to use. 

The style transfer model is based on an InceptionV3 model and distilled down in size with a MobileNetV2 network. You can check their repo for more details.

## Demo:
Check out the segmenting and style transfer for yourself! [https://background-filters.herokuapp.com/](https://background-filters.herokuapp.com/)


## Improvements:

Obviously the style transfer is not preserving enough style details (outside of colour) to be really satisfactory. Furthermore, the body segmentation is quite rough. So upcoming improvements are:

1. Experiment with different models. Including porting different models such as Avatar-Net and AdaIN to test their performance
2. Implement feathering into the segmentation processing for a cleaner body segmentation

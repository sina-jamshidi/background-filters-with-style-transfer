tf.ENV.set('WEBGL_PACK', false);

var video = document.getElementById("videoElement");
var canvas = document.createElement('canvas');
var pageBody = document.getElementById('pageBody');
var ctx = canvas.getContext('2d');
var img = document.querySelector("#imageElement");
var styleImg = new Image();
var tempCanvas = new OffscreenCanvas(canvas.width, canvas.height);
var filterDropdown = document.getElementById("filter");
var button = document.getElementById("buttonElement");
var buttonText = document.getElementById("buttonText");
var spinner = document.getElementById("spinner");
var styleNet; 
var transformNet;

(async () => {
  styleNet = await tf.loadGraphModel(
    'saved_model_style_js/model.json');
  transformNet = await tf.loadGraphModel(
    'saved_model_transformer_separable_js/model.json');
})();

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (error) {
      console.log("Something went wrong!");
    });
}

video.onloadedmetadata = (event) => {
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
};

function setStyleImg() {
  var styleImgName = filterDropdown.options[filterDropdown.selectedIndex].value;
  if(styleImgName != "bw" && styleImgName != "sepia") {
    pageBody.style.backgroundImage = `url(\"${styleImgName}\")`;
    styleImg.src = styleImgName;
  } else {
    pageBody.style.backgroundImage = "";
  }
}

async function snapPicture(){
  button.disabled = true;
  buttonText.textContent="Initializing...";
  button.style.backgroundColor ="#4CAF50";
  spinner.style.display ="inline-block";

  //get the user selected filter
  var filter = filterDropdown.options[filterDropdown.selectedIndex].value;

  //get user selection for where to apply filter
  var filterBackground = document.getElementById("backgroundFilter").checked;
  var filterBoth = document.getElementById("bothFilter").checked;
  var whereToFilter;
  if (filterBackground) {
    whereToFilter = "back";
  } else if (filterBoth) {
    whereToFilter = "both";
  } else {
    whereToFilter = "fore";
  }

  //take a picture of video and store it on canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //create a new image to hold our snapshot, get it in the form of imagedata
  tempImg = new Image();
  var tempImageURI = canvas.toDataURL('image/jpeg');
  tempImg.src = tempImageURI;
  var tempImgData = ctx.getImageData(0,0, canvas.width, canvas.height);
  
  //load body segmentation model
  const net = await bodyPix.load();

  //segment body from our tempImg
  buttonText.textContent="Detecting Person...";
  const segmentation = await net.estimatePersonSegmentation(tempImg, 8, 0.6);
  
  //create an offscreen canvas to hold our modified background image
  //this is actually the whole image but later we will paint it only in the back
  const backCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  var backCtx = backCanvas.getContext('2d');

  //apply filter based on selected filter from drop down. Unless doing style transfer
  if(filter == "bw" || filter == "sepia") {
    buttonText.textContent="Stylizing...";
    applyFilter(backCtx, filter);
    backCtx.drawImage(tempImg, 0, 0);
  } else {
    await startStyling(styleImg, tempImg);
    backCtx.drawImage(tempCanvas, 0, 0);
  }  
  buttonText.textContent="Drawing Final Image...";
  
  //get the backCanvas image in the form of image data
  var backImgData = backCtx.getImageData(0,0,canvas.width, canvas.height);

  //give our segmentation data, original image, and background image to this function
  //maskSetBackground will paint the final image and store it in maskedImageData
  const maskedImageData = applyMask(segmentation, tempImgData.data, backImgData.data, 
    whereToFilter);
  
  //create an offscreen canvas to hold our final image
  var maskCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  var maskCtx = maskCanvas.getContext('2d');
  //put final image on maskCanvas
  maskCtx.putImageData(maskedImageData, 0,0);

  //draw final image to the main canvas
  ctx.drawImage(maskCanvas, 0,0);

  //set our visible image element to the main canvas
  var imageURI = canvas.toDataURL('image/jpeg');
  img.src= imageURI;
  button.disabled = false;
  button.style.backgroundColor = "#B22222";
  spinner.style.display="none";
  buttonText.textContent="Take A Picture";
}

//this function will use the dropdown to return the string to be used as a filter
function applyFilter(backCtx, filter) {
  if (filter == "bw") {
    backCtx.filter = 'grayscale(1)';
  } else if (filter == "sepia") {
    backCtx.filter = 'sepia(1)';
  }

  return;
}

//this function will use segmentation data, original image, and background image
//to paint the final image. Returns an ImageData type
function applyMask(segmentation, image, back, whereToFilter){
    // by default this function will apply filter to the background
    // if whereToFilter is foreground, swap image and back, so we filter the foreground
    // if whereToFilter is both, set image to back (because background is filtered version of
    // image)
    if (whereToFilter == "fore"){
      var temp = image;
      image = back;
      back = temp;
    } else if (whereToFilter == "both") {
      image = back
    }

    //break down the segmentation data. The data variable is now 0's and 1's
    //1 if that pixel contains a person
    const {width, height, data} = segmentation;
    //create a new array to hold our final image. multiplied by 4 because 4 channels
    const bytes = new Uint8ClampedArray(width * height * 4);
    //loop through all of the data
    for (let i = 0; i < data.length; ++i) {
        //for each pixel, we will have 4 channels, so we want to jump 4 at a time.
        //ie. pixel 1 is bytes[0],[1],[2], and [3]. So for next iteration we want
        //to start at bytes[4]
        const j = i * 4;

        //if pixel i is 1, then we have a person. So paint the original image
        if (data[i])
        {
            bytes[j] = image[j];
            bytes[j + 1] = image[j + 1];
            bytes[j + 2] = image[j + 2];
            bytes[j + 3] = image[j + 3];
        }
        //if pixel is 0, then we have the background, so paint background image
        else 
        {
            bytes[j] = back[j];
            bytes[j+1] = back[j + 1];
            bytes[j+2] = back[j + 2];
            bytes[j+3] = back[j + 3];
        }
    }
    return new ImageData(bytes, width, height);
}

async function startStyling(styleImg, contentImg) {
  await tf.nextFrame();
  buttonText.textContent="Generating Style...";
  await tf.nextFrame();
  let bottleneck = await tf.tidy(() => {
    return styleNet.predict(tf.browser.fromPixels(styleImg).toFloat().div(tf.scalar(255)).expandDims());
  })
  buttonText.textContent="Stylizing Image...";
  await tf.nextFrame();
  const stylized = await tf.tidy(() => {
    return transformNet.predict([tf.browser.fromPixels(contentImg).toFloat().div(tf.scalar(255)).expandDims(), bottleneck]).squeeze();
  })
  await tf.browser.toPixels(stylized, tempCanvas);
  bottleneck.dispose();
  stylized.dispose();
}
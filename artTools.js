//Main loop timer variables
let clock,i_time,s_time1,s_time2;

//Initialize timers
d = new Date();
i_time = d.getTime();
clock = 0 

//Object URL for the image object
let objectURL;
objectURL = null;

//Array management variables, 
let arrayData,isReady,width,height;
arrayData = null;
isReady = false;

//Queue variables for the undo function
let queueDepth;
queueDepth = 10;
const prevData = [];
document.getElementById('undoCtr').innerHTML= '    ' + prevData.length;

//Main Loop.
setInterval(tickTock,10);

//Image variables to hold the actual image and canvas
const img = new Image();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

//A function to strip the object URL for local save names
function quickStrip(S){
	i = 0;
	uMax = -1;
	while (i<S.length){
		if (S[i] == "/"){uMax = i;} //iterate up to the '/'
		i+=1;
	}
	if (uMax != -1){S=S.slice(uMax+1,S.length);} //Strip everything after the /
	return S
}

//Function to save the image data- called before each transform to enable the undo function
function saveCanvasImage(){
	canvasURL = canvas.toDataURL('image/bmp'); //Grab the image data from the canvas
	const link = document.createElement('a'); //Make a link
	link.download = quickStrip(objectURL)+".bmp"; //Set the download name 
	link.href = canvasURL; //set the link itself to the canvas image
	link.click(); //simulate a click
}

//Function to save the image data
function saveImageData(){
	//If it's at the max queue depth
	if (prevData.length == queueDepth){
		prevData.splice(0,1); //remove the first and push into the last
		prevData.push(ctx.getImageData(0, 0, img.width, img.height));
	}
	else{//Otherwise just push
		prevData.push(ctx.getImageData(0, 0, img.width, img.height));
	}
	document.getElementById('undoCtr').innerHTML= '    ' + prevData.length; //Update list depth indicator
}

//Undu function to walk back changes
function undo(){
	if (prevData.length > 0){ //If there's undoing to do saved
		ctx.putImageData(prevData[prevData.length-1],0,0); //Grab the previous image and load it
		prevData.splice(prevData.length-1,1); //Remove the previous image from queue
	}
	else{alert("End of undo queue.");} //Let the user know they're out of undos
	document.getElementById('undoCtr').innerHTML= '    ' + prevData.length; //update the queue length counter
}

//Function to put a grid on the image
function gridImg(){
	saveImageData(); //Save for the undo function

	//Grab the number and width of lines to draw
	numHorizontal = parseInt(document.getElementById('hLines').value);
	numVertical = parseInt(document.getElementById('vLines').value);
	lWidth = parseInt(document.getElementById('lWidth').value);

	colors = ['black','white']; //Draw white on black for universal visibility

	for (let j = 0;j<2;j++){ //For each coloe
		ctx.lineWidth = lWidth + (2-2*j);//Set width- wider for first line

		//Draw the horizontal lines
		vertDivision = img.height/(numHorizontal+1); //Get the space between lines
		for (let i=1;i<=numHorizontal;i+=1){ 
			ctx.beginPath(); //Draw a line
			ctx.moveTo(0,i*vertDivision);
			ctx.lineTo(img.width,i*vertDivision);
			ctx.strokeStyle = colors[j]; //Set color in order
			ctx.stroke();
		}

		//Draw the vertical lines
		horizDivision = img.width/(numVertical+1)
		for (let i=1;i<=numVertical;i+=1){
			ctx.beginPath();
			ctx.moveTo(i*horizDivision,0);
			ctx.lineTo(i*horizDivision,img.height);
			ctx.strokeStyle = colors[j];
			ctx.stroke();
		}
	}
}

//function to blue an image
function blurImg(){
	saveImageData(); //Save for undo

	//Grab the set kernel size from inputs
	kernel = parseInt(document.getElementById('blurKern').value);

	//Make up the image data to process
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data; //Original data
	const data_o = new Uint8ClampedArray(data.length); //New array for output data

	//Loop over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //Calculate r value index
			cG = cR + 1; //Other colors right past it
			cB = cR + 2;

			//Grab the area in the local kernel
			areaData = ctx.getImageData(i-Math.floor(kernel/2), j-Math.floor(kernel/2), kernel, kernel);
			area = areaData.data;
			
			//Value sums for averaging
			sumR = 0;
			sumG = 0;
			sumB = 0;
			
			//Add up values in kernel
			for (let k=0;k<area.length;k+=4){
				sumR = sumR + area[k];
				sumG = sumG + area[k+1];
				sumB = sumB + area[k+2];
			}

			//Set output values to average
			data_o[cR] = sumR/(kernel*kernel);
			data_o[cG] = sumG/(kernel*kernel);
			data_o[cB] = sumB/(kernel*kernel);
			data_o[cB+1] = 255; //Remember the alpha channel!
		}
	}
	for (let i=0;i<data.length;i++){imageData.data[i] = data_o[i];} //Insert new data into ImageData
	ctx.putImageData(imageData,0,0); //Insert the imageData into the canvas
}

//Function to sharpen an image
function sharpenImg(){
	saveImageData(); //Save for undo

	//Grab kernel and scale from inputs
	kernel = parseInt(document.getElementById('sharpKern').value);
	scale = parseInt(document.getElementById('sharpScale').value)/10.0;

	//Make up the image data to process
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;
	const data_o = new Uint8ClampedArray(data.length); //New array for output data

	//Looping over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //calculate the r value index
			cG = cR + 1;
			cB = cR + 2;

			//Grab the local kernel
			areaData = ctx.getImageData(i-Math.floor(kernel/2), j-Math.floor(kernel/2), kernel, kernel);
			area = areaData.data;
			
			//Values for averaging
			sumR = 0;
			sumG = 0;
			sumB = 0;
			
			//Add up each channel's sum
			for (let k=0;k<area.length;k+=4){
				sumR = sumR + area[k];
				sumG = sumG + area[k+1];
				sumB = sumB + area[k+2];
			}

			//Average values in output array
			data_o[cR] = sumR/(kernel*kernel);
			data_o[cG] = sumG/(kernel*kernel);
			data_o[cB] = sumB/(kernel*kernel);
			data_o[cB+1] = 255; //DON"T FORGET THE ALPHA CHANNEL
		}
	}
	//We just made a blur- upload the unsharp mask values into the original array
	for (let i=0;i<data.length;i++){imageData.data[i] = (1.0+scale)*imageData.data[i] - (scale)*data_o[i];}
	ctx.putImageData(imageData,0,0); //And put into canvas
}

//Function to apply a median filter to an image
function filterImg(){
	saveImageData(); //Save for undo

	//Grab kernel from input
	kernel = parseInt(document.getElementById('filterKern').value);

	//Image variables for processing
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;
	const data_o = new Uint8ClampedArray(data.length); //Copy for new data

	//Looping over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //Calculate r value index
			cG = cR + 1;
			cB = cG + 1;

			//Grab local kernel
			areaData = ctx.getImageData(i-Math.floor(kernel/2), j-Math.floor(kernel/2), kernel, kernel);
			area = areaData.data;

			//Arrays for lists of channel values
			listR = [];
			listG = [];
			listB = [];

			//Grab values from kernel into channel lists
			for (let k=0;k<area.length;k+=4){
				listR.push(area[k]);
				listG.push(area[k+1]);
				listB.push(area[k+2]);
			}

			//Sort the lists in order
			listR.sort();
			listG.sort();
			listB.sort();

			//Grab the median values
			data_o[cR] = listR[Math.floor(listR.length/2)];
			data_o[cG] = listG[Math.floor(listG.length/2)];
			data_o[cB] = listB[Math.floor(listB.length/2)];
			data_o[cB+1] = 255; //forget not thy alpha channel
		}
	}
	//Load the new values into the old imageData
	for (let i=0;i<data.length;i++){imageData.data[i] = data_o[i];}
	ctx.putImageData(imageData,0,0); //and push to cnavas
}

function equalizeHist(){
	saveImageData() //Save for undo

	//Image values for processing
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;
	//single pixel ops don't need an output holder, btw.

	histogram = new Array(256);
	minSeen = 256;
	maxSeen = -1;
	for (let i=0;i<data.length;i++){
		val = data[i];
		for (let j=val;j<255;j++){histogram[j] = histogram[j] + 1;}
		if (val<minSeen){minSeen=val;}
		if (val>maxSeen){maxSeen=val;}
	}
	for (let i=0;i<data.length;i++){
		val = data[i];
		data[i] = Math.ceil(255*(data[i]-minSeen)/(maxSeen-minSeen))-1;
	}
	ctx.putImageData(imageData,0,0);//push to canvas
}

function remapImage(){
	saveImageData() //Save for undo

	//Image values for processing
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;
	//single pixel ops don't need an output holder, btw.

	//thresholds from inputs
	let lower = parseInt(document.getElementById('remapLower').value);
	let upper = parseInt(document.getElementById('remapUpper').value);
	let range = upper-lower;

	//Looping over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //R value index
			cG = cR + 1;
			cB = cR + 2;

			for (let k=0;k<3;k++){
				if (data[cR+k]<lower){data[cR+k]=0;}
				else if (data[cR+k]>upper){data[cR+k]=255;}
				else {data[cR+k]=255*(data[cR+k]-lower)/range;}
			}
		}
	}
	ctx.putImageData(imageData,0,0);//push to canvas
}

//Simple function to do posterizing map
function posterCMap(c){return 128*Math.floor(3*(c/255.0));}

//Function to posterize an image
function posterize(){
	saveImageData() //Save for undo

	//Image values for processing
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;
	//single pixel ops don't need an output holder, btw.

	//Looping over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //R value index
			cG = cR + 1;
			cB = cR + 2;

			//Find the minimum channel value
			minC = Math.min(data[cR],data[cG],data[cB])
			
			//If R is the minimum
			if (data[cR] == minC){
				data[cR] = 0; //clear r
				data[cG] = posterCMap(data[cG]); //map green and blue onto quantized levels
				data[cB] = posterCMap(data[cB]);
			}
			else if (data[cG] == minC){//permute for minimum green
				data[cR] = posterCMap(data[cR]);
				data[cG] = 0;
				data[cB] = posterCMap(data[cB]);
			}
			else if (data[cB] == minC){//permute for minimum blue
				data[cR] = posterCMap(data[cR]);
				data[cG] = posterCMap(data[cG]);
				data[cB] = 0;
			}
		}
	}
	ctx.putImageData(imageData,0,0);//push to canvas
}

//Function to implement a sobel filter
function Sobel(){
	saveImageData(); //save for undo

	//Image variables for processing
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;
	const data_o = new Uint8ClampedArray(data.length); //output value array

	//looping over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //Get r value index
			cG = cR + 1;
			cB = cR + 2;

			//Calculate kernel corner value indices
			UL = 4*((i-1) + img.width*(j-1));
			UR = 4*((i+1) + img.width*(j-1));
			LL = 4*((i-1) + img.width*(j+1));
			LR = 4*((i+1) + img.width*(j+1));

			//Calculate kernel value cardinal indices
			L = 4*((i-1) + img.width*(j));
			R = 4*((i+1) + img.width*(j));
			U = 4*((i) + img.width*(j-1));
			D = 4*((i) + img.width*(j+1));

			//Array to hold gradient for each direction
			Gs = [0,0,0];

			//Looping over channels
			for (let k=0;k<3;k++){
				//Calculate gradients by kernels
				Gx = (data[UR+k] - data[LL+k] + data[LR+k] - data[UL+k]) + 2*(data[R+k] - data[L+k]);
				Gy = (data[LL+k] - data[UR+k] + data[LR+k] - data[UL+k]) + 2*(data[D+k] - data[U+k]);
				G = Math.sqrt(Gx**2 + Gy**2); //Magnitue for full gradient
				Gs[k] = G; //store gradient
			}

			//load gradients into output array
			data_o[cR] = Gs[0];
			data_o[cG] = Gs[1];
			data_o[cB] = Gs[2];
			data_o[cB+1] = 255; //Did you forget the alpha channel? I did.
		}
	}
	for (let i=0;i<data.length;i++){imageData.data[i] = data_o[i];} //load new data into old array
	ctx.putImageData(imageData,0,0);//push to canvas
}

//function to clamp image intensities
function clampColor(){
	saveImageData() //save for undo

	//Grab thresholds from inputs
	lower = parseInt(document.getElementById('clampLower').value);
	upper = parseInt(document.getElementById('clampUpper').value);

	//Image variables for processing- no output var for single pixel ops
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;

	//Iterating over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //Get r value index
			cG = cR + 1;
			cB = cG + 1;

			//For each color channel
			for (let i=0;i<3;i++){
				if (data[cR+i]<lower){data[cR+i] = lower;} //If below low threshold- set to low value
				else if (data[cR+i]>upper){data[cR+i] = upper;} //if above hight threshold, set to high value
			}
		}
	}
	ctx.putImageData(imageData,0,0);//Load into the canvas
}

//Function to invert image color
function invertColor(){
	saveImageData(); //Save for undo

	//Image variables for processing
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;

	//Looping over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //Red value index
			cG = cR + 1;
			cB = cG + 1;

			//Invert each channel
			data[cR] = 255-data[cR];
			data[cG] = 255-data[cG];
			data[cB] = 255-data[cB];
		}
	}
	ctx.putImageData(imageData,0,0); //Push to canvas
}

//Function to convert an image to greyscale
function greyscale(){
	saveImageData(); //Save for undo

	//Image variables for processing - single pixel op, no output var needed
	const imageData = ctx.getImageData(0, 0, img.width, img.height);
	const data = imageData.data;

	//Loop over all pixels
	for (let i=0;i<img.width;i++){
		for (let j=0;j<img.height;j++){
			cR = 4*(i + img.width*j); //Red value index
			cG = cR + 1;
			cB = cG + 1;

			//Calculate average value of all three channels
			avg = (data[cR]+data[cG]+data[cB])/3;

			//Set all channels to average
			data[cR] = avg;
			data[cG] = avg;
			data[cB] = avg;
		}
	}
	ctx.putImageData(imageData,0,0); //Push to canvas
}

//Main loop function
function tickTock(){

	//Timer updates
	d = new Date();
	clock = d.getTime()-i_time;
	document.getElementById('clock').innerHTML="Clocktime: "+(clock/1000.0)+"s";

	//If the image fetching is done	
	if (isReady){
		//Output the width and height to the indicator
		S = '';
		S = S + img.width + "," + img.height;
		document.getElementById('file').innerHTML = S;
		
		//Set canvas dimensions and draw the image to it
		canvas.height = img.height;
		canvas.width = img.width;
		ctx.drawImage(img,0,0);

		//clear isReady flag
		isReady = false;
	}
	
	//Sequence of warnings for the kernel sizes being slow	
	if (document.getElementById('filterKern').value > 15){
		document.getElementById('warnText').innerHTML = "Warning: large convolution kernels are <b>very</b> slow in Javascript.";
		document.getElementById('warnText').className = "warningOn";
	}
	else if (document.getElementById('blurKern').value > 10){
		document.getElementById('warnText').innerHTML = "Warning: large kernels are slow in Javascript.";
		document.getElementById('warnText').className = "warningOn";
	}
	else if (document.getElementById('filterKern').value > 10){
		document.getElementById('warnText').innerHTML = "Warning: large kernels are slow in Javascript.";
		document.getElementById('warnText').className = "warningOn";
	}
	else if (document.getElementById('sharpKern').value > 10){
		document.getElementById('warnText').innerHTML = "Warning: large kernels are slow in Javascript.";
		document.getElementById('warnText').className = "warningOn";
	}
	else{
		document.getElementById('warnText').innerHTML = " ";
		document.getElementById('warnText').className = "warningOff";
	}	
}

//Function to grab image on upload selection
function onChange(){
	//Grab the input files out of the dialog box
	files = document.getElementById("theImage").files;

	//If there's some files available
	if (files.length > 0){
		file = files[0] //Grab only the first one
		if (objectURL!=null){URL.revokeObjectURL(objectURL);} //Remove the previous objectURL if there is one
		objectURL = window.URL.createObjectURL(file); //Make a new objectURL for the new image
		img.src = objectURL; //Put it into the image variable in the DOM
		setTimeout(()=>{isReady = true;},200); //A 200ms delay before marking the file as ready, for load-in time
		prevData = [];
	}
	else{alert("NO FILE!!!");} //If there's not a file loaded, let the user know!
}


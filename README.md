This project is a little tool to help artists- it's basically a free collection of the most common tools we've noticed artists wanting. It's packed up with the back end stuff 100% in javascript to make it universally portable in-browser, so there's no extra downloads or accounts or anything.

**The utility currently includes:**
  - _Image transforms_:
    Greyscale (or black and white)
    Posterize (quantization and minimum level-suppression)
    Sobel filter (edge detection- color and grayscale both)
    Invert (color flipping)
  - _Convolution filters_
    Blur filter (averaging)
    Median filter (noise suppressing)
    Sharpen (unsharp mask)
    Clamp (low and high level suppression)
  - _Overlays_
    Grid
  - _Utilities_
    Undo (with a 10 frame queue depth)
    Save (saves the current frame with a unique file name)

**Notes:**
- The convolution filters all take kernel sizes, and the convolution over the images in JS is very slow. The user is warned when they set the kernels to large values (defined as taking more than a second or two to run on a 512x768 image) so they know it's not freezing.
- The undo function applies to whole images, not individual elements!
- All the filters are applied to RGB channels in parallel. Alpha is left untouched.
- The kernels round down when handling even-size kernels
- The sharpen filter has a 1-20 strength, which is an unsharp mask coefficient of strength/10.0, or [0.1-2.0]
   

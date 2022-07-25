# SPARK WRO 2022 Future Engineers Program Documentation

This is the documentation for all the source code used for the USEL Future Engineers 2022 season.

The code is divided into multiple modular files. `IO` contains source code for camera input and PWM control for throttle and steering. `Util` contains source code for development utilities and is mostly not needed for autonomous driving. `AI` contains source code for computer vision.

During matches, the `server.py` file in `Util` will not be uploaded to ensure compliance with rule 10.9

### How we Implemented Computer Vision
We first start with some basic edge detection. At the same time, we filter the images to find the walls (black pixels) and obstacles (red and green pixels).

<!-- maitian insert the images here -->

We combine those to identify the locations in frame of the walls and obstacles, and then feed that into an AI in TensorRT to determine the direction we should turn.

<!-- maitian insert more images here -->
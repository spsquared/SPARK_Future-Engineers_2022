# July 2022
SPARK USEL Future Engineers Engineering Notebooks

***

# 7/2/22
We attempted to get the Jetson to boot off of a USB drive, as the built-in EMMC doesn't have enough capacity to install the Jetpack SDK. The large 78-tooth diff gear was installed as well.

### Updates
* Successfully changed the boot manager to boot from USB
* 78-tooth diff gear installed

There were issues installing it, as before in mid-June we attempted to do this as well. There were initial issues using NVIDIA's SDK Management tool, as it couldn't find any compatible versions of JetPack for Ubuntu 20.

# 7/4/22
We set up Tensorflow and began working on making a test dataset and making GPIO PWM work.

### Updates
* Following guide to setting up and using TensorFlow.
* The 128GB card was flashed, so we now have a lot more storage available.
* Did some testing to try and get GPIO pins working and also making TensorFlow work.

We used the [guide](http://www.yahboom.net/study/jetson-nano) supplied by Yahboom to set up our environment. We only needed steps 1.3 and the first 1.4, which for whatever reason step 1.4 came before step 1.3, and there was a second step 1.4 after step 1.3. Afterwards we went through section 3, with minimal issues. It completed the test program with flying colors, so we moved on to trying to create a training data set using the camera. We ended with the camera able to capture an image, though unencoded and therefore uncompressed.

Meanwhile, work was being done to test the GPIO. We plan to use the [jetson-gpio](https://github.com/NVIDIA/jetson-gpio) library to control the pins. It installed fine, but we were unable to actually control any of the pins. We eventually found that the BCM and BOARD pinouts were slightly different, and we were able to turn on and off LEDs with the GPIO. Whether the PWM pins work or not is to be found, but we will need to find the correct pinout for this carrier board or we will not even be able to find the pins.

Below is an HTML embed of a video. If it doesn't work, just click the link.

<div>
<video width="480" height="270">
<source src="./July/7-4-22-a.mp4" type="video/mp4">
You cannot play this video here. Click the link below to view it online.
</video>
</div>

[Link to video](./July/7-4-22-a.mp4)

#
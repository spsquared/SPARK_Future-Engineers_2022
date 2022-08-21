<div align=right>

![banner](./banner.png)

</div>

# **The Hardware**

WIP

6 (perspective) views of our vehicle:
| | |
| ------------------------- | --------------------------- |
| ![front](./img/front.png) | ![back](./img/rear.png)     |
| ![left](./img/left.png)   | ![right](./img/right.png)   |
| ![top](./img/top.png)     | ![bottom](./img/bottom.png) |

# **The Software**

## **Operating System**

write stuff

## **IO**
insert documentation about drive throttling and camera

## **Image predictions**

All the code for image filtering and predictions can be found in `/Program/AI/filter.py`.

The filter function takes in a raw image and outputs a filtered image. This image is filtered based on 6 RGB values, `redMax`, `redMin`, `greenMin`, `greenMax`, `wallMin`, `wallMax`. We use `cv2`'s `inRange` function to filter the image based on these values.

The predict function is where all the predictions happen. It starts by creating a blob detector using `cv2.SimpleBlobDetector`. `SimpleBlobDetector_Params` is only for setting the parameters for the blob detector. After this, it takes the raw image from the input and passes it to the filter function. After this, it uses the blob detector on the filtered red and green images to detect red and green pillars. Now it does wall detection. First, it crops the image, removing the top and bottom sections, and then using `numpy.count_nonzero` as a fast way to get how many filtered wall pixels there are. There are 3 sections of the wall that we care about, the left side, center, and right side. Using the `last_nonzero` function from `numpy`, we can find the bottom line of the 3 sections of walls, as this is useful for making predictions based on the walls. We have two equations, `getRedEquation` and `getGreenEquation`. These calculate if we will hit a pillar or not, and we use it on all the blobs detected by the blob detector. After this, it sends all this information to the SPARK Control Panel. If the center wall is very tiny, the car knows it just turned and increases `turnsMade` by one, and if we have turned 12 times, or 3 laps, it returns "stop". After this, we take the largest pillar we will hit and given the pillar size and where it is we get a `pillarSteering`. Then, there are 4 main cases for wall steering:

**1: Crashing into center wall**

This means the center wall value and right wall values are large. However, if the left wall value is also large, it is the second case.

**2: Crashing into left wall**

The left wall value is very large, and the center section which is detected as the center wall may be actually the left wall.

**3: Slanted left**

The left wall value is large.

**4: Slanted right**

The right wall value is large.

Finally, it takes the sum of the pillar steering and wall steering and returns it.

## **SPARK Control**
SPARK Control is our own debugging and testing software. It consists of a WebSocket server running on the car, and a local HTML page on our computers. The page uses a WebSocket connection to communicate with the server on the car. The server can broadcast and recieve data in the form of JSON strings, which allows for the differentiation of events and complex data transfers. The system is modular and is simple to use. As long as the data can be converted to JSON, it can be sent. Broadcasting is as simple as specifying an event name and some data to be sent. To recieve messages, add an event listener, which is a function that is run when the specified event is recieved.

The client control panel consists of a log - which can be appended to by sending a `message` event and some text; filter tuning sliders for changing the ranges of the image filter; capture buttons to save and preview images; and a data display to view what's happening inside the programs running on the car, which will be explained later. The data display can show raw and filtered image streams from the car's camera, visualize the size and location of blobs from the blob detector, and output the predicted steering values from the filter. By default, the last 500 frames of data are saved in history and can be replayed for debugging.

![SPARK Control Panel](./img/SPARK_Control.png)

# **Demonstration Videos (YouTube)**

[WRO 3 laps with pillars](https://youtu.be/0uMp_ExglOw)

[WRO 3 laps without pillars](https://youtu.be/Jp8k1qW5pQU)

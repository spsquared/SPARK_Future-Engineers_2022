# July 2022
SPARK WRO 2022 Future Engineers Engineering Notebooks

***

# 8/1/22
At this point we are trying to make the car drive around traffic signals. We added the detection for traffic signals and turning accordingly. We encountered some conflicts, where the car would have to turn left but refuse to since it wants to stay in the center of the path. Sometimes the traffic signals would appear too small in the filtered image and then blob detection ignore it, assuming that it's a filtering error. There were other issues, like typos. Those were relatively simple fixes, and now we can reliably sort of drive around the course.

# 8/4/22
Today we fixed some bugs and added a live video stream from the car. The blob detector had an issue where if the blob is touching the edge of the image, it wouldn't detect it. We solved this using cv2 to create a border around the image. We added a live video stream from the car to make debugging easier, since it can display the live feed from the camera, the filtered image that the car processes, and the blobs detected, all on the screen. In the future we plan to display more data on the screen.

In other news, we orded a wide-angle camera, and it arrived today. A new mount was 3D-printed to accomodate the larger lens (huge in comparison to the narrow-frame IMX219).

![new camera mount](./August/8-4-22-a.png)
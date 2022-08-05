# July 2022
SPARK WRO 2022 Future Engineers Engineering Notebooks

***

# 8/1/22
At this point we are trying to make the car drive around traffic signals. We added the detection for traffic signals and turning accordingly. We encountered some conflicts, where the car would have to turn left but refuse to since it wants to stay in the center of the path. Sometimes the traffic signals would appear too small in the filtered image and then blob detection ignore it, assuming that it's a filtering error. There were other issues, like typos. Those were relatively simple fixes, and now we can reliably sort of drive around the course.


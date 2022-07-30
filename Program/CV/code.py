
wallColors = [50,50,50]

def checkWallColor(array):
    if abs(array[0] - wallColors[0]) < 25 and abs(array[1] - wallColors[1]) < 25 and abs(array[2] - wallColors[2]) < 25:
        return True
    return False

image = cv2.imread("/home/nano/Documents/SPARK_FutureEngineers_2022/image_out/1659201876634.png")
image2 = image[45:100,130:143]
display(Image.fromarray(image2))
wallHeights = numpy.count_nonzero((image2[:,:,0] > wallColors[0] - 25) & (image2[:,:,0] < wallColors[0] + 25) & (image2[:,:,1] > wallColors[1] - 25) & (image2[:,:,1] < wallColors[1] + 25) & (image2[:,:,2] > wallColors[2] - 25) & (image2[:,:,2] < wallColors[2] + 25),axis=0)
wallHeights2 = []

for i in range(len(wallHeights)):
    if wallHeights[i] != 0:
        wallHeights2.append(wallHeights[i])
    
print(statistics.median(wallHeights2))



#sdalllllllllllllll

from PIL import Image,ImageFilter
import time
import numpy
import math
import statistics
import os
import cv2

# im = cv2.imread("/home/nano/Documents/SPARK_FutureEngineers_2022/image_out/1659201876634.png", cv2.IMREAD_GRAYSCALE)
im = cv2.imread("/home/nano/Documents/SPARK_FutureEngineers_2022/image_filtered/1659209694809.png",cv2.IMREAD_GRAYSCALE)

im = 255 - im

start = time.time()

params = cv2.SimpleBlobDetector_Params()

params.filterByColor = True
params.minThreshold = 30
params.maxThreshold = 255
# params.thresholdStep = 1

detector = cv2.SimpleBlobDetector_create(params)
detector.empty()
keypoints = detector.detect(im)
print(keypoints[0])
print(time.time()-start)

blank = numpy.zeros((1, 1))
blobs = cv2.drawKeypoints(im, keypoints, blank, (255, 0, 0),cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)

display(Image.fromarray(blobs))
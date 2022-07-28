from turtle import heading
import numpy
import cv2
from IO import io
import time

# preprocessing filter module

# colors
rM = redMax = [0, 0, 0]
rm = redMin = [0, 0, 0]
gM = greenMax = [0, 0, 0]
gm = greenMin = [0, 0, 0]
wM = wallMax = [0, 0, 0]
wm = wallMin = [0, 0, 0]

# possibly filter with median filter (cv2)
def filter(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    hsvImg = cv2.cvtColor(imgIn, cv2.COLOR_RGB2HSV)
    rMask = cv2.inRange(hsvImg, redMin, redMax)
    gMask = cv2.inRange(hsvImg, greenMin, greenMax)
    wMask = cv2.inRange(hsvImg, wallMin, wallMax)
def saveFilter(filterIn: numpy.ndarray):
    width = len(filterIn)
    height = len(filterIn[0])
    imgOut = numpy.zeros(width, height, 3, int)
    for y in range(width):
        for x in range(height):
            # 1 is 
            return
    cv2.imwrite('image_filtered/' + str(round(time.time()*1000)) + '.png', imgOut)
    return imgOut

def setColors(data):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
def getColors():
    global rM, rm, gM, gm, wM, wm
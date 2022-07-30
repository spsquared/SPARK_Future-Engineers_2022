from turtle import heading
import numpy
import cv2
from IO import io
import time

# preprocessing filter module

# colors
rM = redMax = (255, 255, 255)
rm = redMin = (0, 0, 0)
gM = greenMax = (1, 1, 1)
gm = greenMin = (0, 0, 0)
wM = wallMax = (1, 1, 1)
wm = wallMin = (0, 0, 0)

# possibly filter with median filter (cv2)
def filter(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    rMask = cv2.inRange(imgIn, redMin, redMax)
    gMask = cv2.inRange(imgIn, greenMin, greenMax)
    wMask = cv2.inRange(imgIn, wallMin, wallMax)
    imgOut = cv2.merge((wMask, gMask, rMask))
    return imgOut

def setColors(data):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    redMax = (int(data[0]), int(data[3]), int(data[6]))
    greenMax = (int(data[1]), int(data[4]), int(data[7]))
    wallMax = (int(data[2]), int(data[5]), int(data[8]))
    redMin = (int(data[9]), int(data[12]), int(data[15]))
    greenMin = (int(data[10]), int(data[13]), int(data[16]))
    wallMin = (int(data[11]), int(data[14]), int(data[17]))
    print('-- New ----------')
    print(redMax, redMin)
    print(greenMax, greenMin)
    print(wallMax, wallMin)
def getColors():
    global rM, rm, gM, gm, wM, wm
    print(type(rM))
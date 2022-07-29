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
    hsvImg = cv2.cvtColor(imgIn, cv2.COLOR_RGB2HSV)
    rMask = cv2.inRange(hsvImg, redMin, redMax)
    gMask = cv2.inRange(hsvImg, greenMin, greenMax)
    wMask = cv2.inRange(hsvImg, wallMin, wallMax)
    imgOut = cv2.merge((wMask, gMask, rMask))
    return imgOut

def setColors(data):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
def getColors():
    global rM, rm, gM, gm, wM, wm
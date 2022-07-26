from operator import gt
import numpy
from IO import io

# preprocessing filter module

# colors
red = [140, 60, 60]
rTolerance = 15
green = [10, 90, 70]
gTolerance = 15
wall = [55, 55, 60]
wTolerance = 15

def filter(imgIn: numpy.ndarray):
    global red, rTolerance, green, gTolerance, wall, wTolerance
    try:
        width = len(imgIn)
        height = len(imgIn[0])
        imgOut = numpy.zeros((width, height, 3), int)
        for y in range(width):
            for x in range(height):
                if abs(imgIn[y][x][2]-red[0]) < rTolerance and abs(imgIn[y][x][1]-red[1]) < rTolerance and abs(imgIn[y][x][0]-red[2]) < rTolerance:
                    imgOut[y][x] = [0, 0, 255]
                elif abs(imgIn[y][x][2]-green[0]) < gTolerance and abs(imgIn[y][x][1]-green[1]) < gTolerance and abs(imgIn[y][x][0]-green[2]) < gTolerance:
                    imgOut[y][x] = [0, 255, 0]
                if abs(imgIn[y][x][2]-wall[0]) < wTolerance and abs(imgIn[y][x][1]-wall[1]) < wTolerance and abs(imgIn[y][x][0]-wall[2]) < wTolerance:
                    imgOut[y][x] = [255, 0, 0]
    except:
        io.error()
    return imgOut

def setColors(data):
    # [
    # [r, g, b, tolerance]
    # [r, g, b, tolerance]
    # [r, g, b, tolerance]
    # ]
    global red, rTolerance, green, gTolerance, wall, wTolerance
    red = [int(data[0][0]), int(data[0][1]), int(data[0][2])]
    rTolerance = int(data[0][3])
    green = [int(data[1][0]), int(data[1][1]), int(data[1][2])]
    gTolerance = int(data[1][3])
    wall = [int(data[2][0]), int(data[2][1]), int(data[2][2])]
    wTolerance = int(data[2][3])
def getColors():
    global red, rTolerance, green, gTolerance, wall, wTolerance
    return [
        [red[0], red[1], red[2], rTolerance],
        [green[0], green[1], green[2], gTolerance],
        [wall[0], red[1], wall[2], wTolerance],
    ]
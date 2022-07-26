from operator import gt
import numpy
from IO import io

# preprocessing filter module

# colors
red = [125, 60, 60]
rTolerance = 30
green = [-5, 90, 70]
gTolerance = 30
wall = [50, 50, 50]
wTolerance = 25
red2 = red
rTolerance2 = rTolerance
green2 = green
gTolerance2 = gTolerance
wall2 = wall
wTolerance2 = wTolerance

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


# [
# [r, g, b, tolerance]
# [r, g, b, tolerance]
# [r, g, b, tolerance]
# ]
def setColors(data):
    global red, rTolerance, green, gTolerance, wall, wTolerance
    red = [int(data[0][0]), int(data[0][1]), int(data[0][2])]
    rTolerance = int(data[0][3])
    green = [int(data[1][0]), int(data[1][1]), int(data[1][2])]
    gTolerance = int(data[1][3])
    wall = [int(data[2][0]), int(data[2][1]), int(data[2][2])]
    wTolerance = int(data[2][3])
def getColors():
    global red2, rTolerance2, green2, gTolerance2, wall2, wTolerance2
    return [
        [red2[0], red2[1], red2[2], rTolerance2],
        [green2[0], green2[1], green2[2], gTolerance2],
        [wall2[0], wall2[1], wall2[2], wTolerance2],
    ]
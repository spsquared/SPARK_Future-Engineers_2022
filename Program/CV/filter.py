from operator import gt
import numpy
from IO import io

# preprocessing filter module

# colors
red = [137, 65, 60]
rTolerance = 30
green = [0, 0, 0]
gTolerance = 0
wall = [60, 60, 60]
wTolerance = 20

def filter(imgIn: numpy.ndarray):
    global red, rTolerance, green, gTolerance, wall, wTolerance
    try:
        width = len(imgIn)
        height = len(imgIn[0])
        imgOut = numpy.zeros((width, height, 3), int)
        for y in range(width):
            for x in range(height):
                if abs(imgIn[y][x][0]-red[0]) < rTolerance and abs(imgIn[y][x][1]-red[1]) < rTolerance and abs(imgIn[y][x][2]-red[2]) < rTolerance:
                    imgOut[y][x] = [255, 0, 0]
                elif abs(imgIn[y][x][0]-green[0]) < gTolerance and abs(imgIn[y][x][1]-green[1]) < gTolerance and abs(imgIn[y][x][2]-green[2]) < gTolerance:
                    imgOut[y][x] = [0, 255, 0]
                elif abs(imgIn[y][x][0]-wall[0]) < wTolerance and abs(imgIn[y][x][1]-wall[1]) < wTolerance and abs(imgIn[y][x][2]-wall[2]) < wTolerance:
                    imgOut[y][x] = [0, 0, 255]
    except:
        io.error()
    return imgOut
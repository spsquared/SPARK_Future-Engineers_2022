from curses import raw
import numpy
import cv2

# preprocessing filter module with cv prediction

# colors
rM = redMax = (190, 80, 80)
rm = redMin = (105, 45, 35)
gM = greenMax = (25, 140, 110)
gm = greenMin = (0, 50, 45)
wM = wallMax = (70, 80, 90)
wm = wallMin = (20, 20, 20)

wallColors = [50,50,50]
def checkWallColor(array):
    if abs(array[0] - wallColors[0]) < 25 and abs(array[1] - wallColors[1]) < 25 and abs(array[2] - wallColors[2]) < 25:
        return True
    return False

# possibly filter with median filter (cv2)
def filter(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    rMask = cv2.inRange(imgIn, redMin, redMax)
    gMask = cv2.inRange(imgIn, greenMin, greenMax)
    wMask = cv2.inRange(imgIn, wallMin, wallMax)
    rawImg = cv2.merge((wMask, gMask, rMask))
    filteredImg = cv2.medianBlur(rawImg, 5)
    return filteredImg

def predict(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    params = cv2.SimpleBlobDetector_Params()
    params.minThreshold = 30
    params.maxThreshold = 255
    blobs = cv2.SimpleBlobDetector_create(params)
    blobs.empty()
    rMask = cv2.inRange(imgIn, redMin, redMax)
    gMask = cv2.inRange(imgIn, greenMin, greenMax)
    wMask = cv2.inRange(imgIn, wallMin, wallMax)
    rImg = cv2.medianBlur(rMask, 5)
    gImg = cv2.medianBlur(gMask, 5)
    wImg = cv2.medianBlur(wMask, 5)
    rKps = blobs.detect(rImg)
    gKps = blobs.detect(gImg)
    wKps = blobs.detect(wImg)
    croppedWMask = wMask[45:100,130:143]
    wallHeights = numpy.count_nonzero(croppedWMask > 1,axis=0)
    wallHeights2 = []
    for i in range(len(wallHeights)):
        if wallHeights[i] != 0:
            wallHeights2.append(wallHeights[i])

    wallHeight = statistics.median(wallHeights2)
    # -3 = turn left a lot
    # 3 = turn right a lot
    for i in range(len(rKps)):
        if 131 < rKps[i].pt[0] * 5 / 12 + rKps[i].pt[1] + rKps[i].sizeof:
            return -2
    for i in range(len(gKps)):
        if 131 < (272 - gKps[i].pt[0]) * 5 / 12 + gKps[i].pt[1] + rKps[i].sizeof:
            return 2
    if wallHeight > 30:
        return -2
    return 0

def setColors(data):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    redMax = (int(data[0]), int(data[3]), int(data[6]))
    greenMax = (int(data[1]), int(data[4]), int(data[7]))
    wallMax = (int(data[2]), int(data[5]), int(data[8]))
    redMin = (int(data[9]), int(data[12]), int(data[15]))
    greenMin = (int(data[10]), int(data[13]), int(data[16]))
    wallMin = (int(data[11]), int(data[14]), int(data[17]))

    redMax = (int(data[6]), int(data[3]), int(data[0]))
    greenMax = (int(data[7]), int(data[4]), int(data[1]))
    wallMax = (int(data[8]), int(data[5]), int(data[2]))
    redMin = (int(data[15]), int(data[12]), int(data[9]))
    greenMin = (int(data[16]), int(data[13]), int(data[10]))
    wallMin = (int(data[17]), int(data[14]), int(data[11]))
    print('-- New ----------')
    print(redMax, redMin)
    print(greenMax, greenMin)
    print(wallMax, wallMin)
def getColors():
    global rM, rm, gM, gm, wM, wm
    print(type(rM))
from torch import true_divide
from IO import io
import numpy
import cv2
import statistics

# preprocessing filter module with cv prediction

# colors
rM = redMax = (80, 80, 190)
rm = redMin = (35, 45, 95)
gM = greenMax = (110, 140, 25)
gm = greenMin = (45, 50, 0)
wM = wallMax = (90, 80, 70)
wm = wallMin = (20, 20, 20)

# possibly filter with median filter (cv2)
def filter(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    try:
        rMask = cv2.inRange(imgIn, redMin, redMax)
        gMask = cv2.inRange(imgIn, greenMin, greenMax)
        wMask = cv2.inRange(imgIn, wallMin, wallMax)
        rawImg = cv2.merge((wMask, gMask, rMask))
        filteredImg = cv2.medianBlur(rawImg, 5)
        return filteredImg
    except Exception as err:
        print(err)
        io.error()

def predict(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    try:
        params = cv2.SimpleBlobDetector_Params()
        params.filterByColor = True
        params.minThreshold = 1
        params.maxThreshold = 255
        params.filterByInertia = True
        params.minInertiaRatio = 0.01
        blobs = cv2.SimpleBlobDetector_create(params)
        rMask = cv2.inRange(imgIn, redMin, redMax)
        gMask = cv2.inRange(imgIn, greenMin, greenMax)
        wMask = cv2.inRange(imgIn, wallMin, wallMax)
        rawImg = cv2.merge((wMask, gMask, rMask))
        blurredImg = cv2.medianBlur(rawImg, 10)
        wImg, gImg, rImg = cv2.split(blurredImg)
        blobs.empty()
        rKps = blobs.detect(255 - rImg)
        blobs.empty()
        gKps = blobs.detect(255 - gImg)
        blobs.empty()
        cv2.imwrite("e.png",(255 - rImg))
        cv2.imwrite("d.png",blurredImg)
        cv2.imwrite("g.png",rawImg)
        cv2.imwrite("h.png",imgIn)
        wKps = blobs.detect(255 - wImg)
        croppedWImgLeft = wImg[45:100,20:35]
        croppedWImgCenter = wImg[45:100,130:143]
        croppedWImgRight = wImg[45:100,237:252]
        wallHeightsLeft = numpy.count_nonzero(croppedWImgLeft > 1,axis=0)
        wallHeights2Left = []
        for i in range(len(wallHeightsLeft)):
            if wallHeightsLeft[i] != 0:
                wallHeights2Left.append(wallHeightsLeft[i])
        if len(wallHeights2Left) == 0:
            wallHeightLeft = 0
        else:
            wallHeightLeft = statistics.median(wallHeights2Left)
        wallHeightsCenter = numpy.count_nonzero(croppedWImgCenter > 1,axis=0)
        wallHeights2Center = []
        for i in range(len(wallHeightsCenter)):
            if wallHeightsCenter[i] != 0:
                wallHeights2Center.append(wallHeightsCenter[i])
        if len(wallHeights2Center) == 0:
            wallHeightCenter = 0
        else:
            wallHeightCenter = statistics.median(wallHeights2Center)
        wallHeightsRight = numpy.count_nonzero(croppedWImgRight > 1,axis=0)
        wallHeights2Right = []
        for i in range(len(wallHeightsRight)):
            if wallHeightsRight[i] != 0:
                wallHeights2Right.append(wallHeightsRight[i])
        if len(wallHeights2Right) == 0:
            wallHeightRight = 0
        else:
            wallHeightRight = statistics.median(wallHeights2Right)
        # -100 = turn left a lot
        # 100 = turn right a lot
        if len(gKps) != 0:
            blank = numpy.zeros((1, 1))
            blobs = cv2.drawKeypoints(rawImg, gKps, blank, (255, 0, 0),cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)

            cv2.imwrite("f.png",blobs)
        for i in range(len(rKps)):
            # if 131 < rKps[i].pt[0] * 5 / 12 + rKps[i].pt[1] + rKps[i].size * 2:
            return 100
        for i in range(len(gKps)):
            # if 131 < (272 - gKps[i].pt[0]) * 5 / 12 + gKps[i].pt[1] + gKps[i].size * 2:
            return -100
        if wallHeightCenter > 23:
            return -100
        if wallHeightRight > 25:
            return -50
        if wallHeightLeft > 25:
            return 50
        return 0
    except Exception as err:
        print(err)
        io.error()

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
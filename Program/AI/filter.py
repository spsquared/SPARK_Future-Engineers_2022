from IO import io
import numpy
import cv2
import base64
import statistics

# preprocessing filter module with cv prediction

# colors
rM = redMax = (80, 100, 210)
rm = redMin = (25, 35, 100)
# rM = redMax = (90, 80, 190)
# rm = redMin = (35, 40, 95)
gM = greenMax = (90, 130, 60)
gm = greenMin = (35, 65, 0)
wM = wallMax = (85, 85, 80)
wm = wallMin = (15, 15, 15)

rightOnRed = True
counterClockwise = True

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

lastSend = 0
def predict(imgIn: numpy.ndarray, server = None):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin, lastSend
    try:
        params = cv2.SimpleBlobDetector_Params()
        params.filterByCircularity = True
        params.minCircularity = 0
        params.filterByConvexity = True
        params.minConvexity = 0
        params.filterByInertia = True
        params.minInertiaRatio = 0
        blobs = cv2.SimpleBlobDetector_create(params)

        rMask = cv2.inRange(imgIn, redMin, redMax)
        gMask = cv2.inRange(imgIn, greenMin, greenMax)
        wMask = cv2.inRange(imgIn, wallMin, wallMax)

        rawImg = cv2.merge((wMask, gMask, rMask))
        blurredImg = cv2.medianBlur(rawImg, 5)
        blurredImg = cv2.medianBlur(blurredImg, 5)

        wImg, gImg, rImg = cv2.split(blurredImg)

        rImg = cv2.copyMakeBorder(rImg,1,1,1,1, cv2.BORDER_CONSTANT, value=[0,0,0])
        gImg = cv2.copyMakeBorder(gImg,1,1,1,1, cv2.BORDER_CONSTANT, value=[0,0,0])

        if rightOnRed == True:
            blobs.empty()
            rKps = blobs.detect(255 - rImg)
            blobs.empty()
            gKps = blobs.detect(255 - gImg)
        else:
            blobs.empty()
            rKps = blobs.detect(255 - gImg)
            blobs.empty()
            gKps = blobs.detect(255 - rImg)

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

        dangerSize = 20

        brKps = 0
        for i in range(len(rKps)):
            rKps[i].size /= 2
            if rKps[i].pt[1] + rKps[i].size > rKps[i].pt[0] * -0.315 + 121 - dangerSize:
                if brKps == 0:
                    brKps = rKps[i]
                elif brKps.size < rKps[i].size:
                    brKps = rKps[i]
        bgKps = 0
        for i in range(len(gKps)):
            gKps[i].size /= 2
            if gKps[i].pt[1] + gKps[i].size > (272 - gKps[i].pt[0]) * -0.315 + 121 - dangerSize:
                if bgKps == 0:
                    bgKps = gKps[i]
                elif bgKps.size < gKps[i].size:
                    bgKps = gKps[i]
        
        if server != None and blurredImg.all() != None:
            lastSend += 1
            if (lastSend > 2):
                lastSend = 0
                encoded = base64.b64encode(cv2.imencode('.png', blurredImg)[1]).decode()
                server.broadcast('capture', encoded)
                arrayR = []
                for i in range(len(rKps)):
                    arrayR.append([rKps[i].pt[0],rKps[i].pt[1],rKps[i].size])
                arrayG = []
                for i in range(len(gKps)):
                    arrayG.append([gKps[i].pt[0],gKps[i].pt[1],gKps[i].size])
                if brKps != 0 and bgKps != 0:
                    server.broadcast('blobs',[[brKps.pt[0],brKps.pt[1],brKps.size],arrayR,[bgKps.pt[0],bgKps.pt[1],bgKps.size],arrayG])
                elif brKps != 0:
                    server.broadcast('blobs',[[brKps.pt[0],brKps.pt[1],brKps.size],arrayR,0,arrayG])
                elif bgKps != 0:
                    server.broadcast('blobs',[0,arrayR,[bgKps.pt[0],bgKps.pt[1],bgKps.size],arrayG])
                else:
                    server.broadcast('blobs',[0,arrayR,0,arrayG])
        steeringArray = [0]
        blobSizeRequirement = 5
        if brKps != 0:
            if bgKps != 0:
                if brKps.size > bgKps.size and brKps.size > blobSizeRequirement:
                    steeringArray.append(brKps.size ** 2 * 0.15)
                elif bgKps.size > blobSizeRequirement:
                    steeringArray.append(-bgKps.size ** 2 * 0.15)
            elif brKps.size > blobSizeRequirement:
                steeringArray.append(brKps.size ** 2 * 0.15)
        elif bgKps != 0 and bgKps.size > blobSizeRequirement:
            steeringArray.append(-bgKps.size ** 2 * 0.15)
        
        if wallHeightCenter > 12 and wallHeightRight > 12:
            steeringArray.append(-(wallHeightCenter + wallHeightRight) * 2)
            # if counterClockwise == True:
            #     steeringArray.append(-(wallHeightCenter + wallHeightRight) ** 2 * 0.035)
            # else:
            #     steeringArray.append((wallHeightCenter + wallHeightRight) ** 2 * 0.035)
        elif wallHeightRight > 35:
            steeringArray.append(-wallHeightRight ** 2 * 0.003)
        elif wallHeightLeft > 35:
            steeringArray.append(wallHeightLeft ** 2 * 0.003)
        
        steeringMax = max(steeringArray)
        steeringMin = min(steeringArray)
        if steeringMax > abs(steeringMin):
            if server != None:
                server.broadcast('strPredict', str(steeringMax))
            return steeringMax
        if server != None:
            server.broadcast('strPredict', str(steeringMin))
        return steeringMin
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
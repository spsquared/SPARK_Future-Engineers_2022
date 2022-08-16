from IO import io
import numpy
import cv2
import base64
import statistics

# preprocessing filter module with cv prediction

# colors
rM = redMax = (95, 100, 210)
rm = redMin = (25, 35, 100)
gM = greenMax = (95, 140, 70)
gm = greenMin = (35, 65, 0)
wM = wallMax = (85, 70, 80)
wm = wallMin = (5, 5, 5)

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
        # create blob detector
        params = cv2.SimpleBlobDetector_Params()
        params.filterByCircularity = True
        params.minCircularity = 0
        params.filterByConvexity = True
        params.minConvexity = 0
        params.filterByInertia = True
        params.minInertiaRatio = 0
        blobs = cv2.SimpleBlobDetector_create(params)

        # filter to colors and split
        blurredImg = filter(imgIn)
        wImg, gImg, rImg = cv2.split(blurredImg)

        # crop for blob detection
        blobStart = 50
        blobEnd = 129

        # add borders to fix blob detection
        rImg = cv2.copyMakeBorder(rImg[blobStart:blobEnd],1,1,1,1, cv2.BORDER_CONSTANT, value=[0,0,0])
        gImg = cv2.copyMakeBorder(gImg[blobStart:blobEnd],1,1,1,1, cv2.BORDER_CONSTANT, value=[0,0,0])

        # detect blobs
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

        # crop for wall detection
        wallStart = 55
        wallEnd = 90
        croppedWImgLeft = wImg[wallStart:wallEnd,0:1]
        for i in range(19):
            croppedWImgLeft = numpy.concatenate((croppedWImgLeft, wImg[wallStart:wallEnd,i * 4:i * 4 + 1]), axis=1)
        croppedWImgCenter = wImg[wallStart:wallEnd,96:97]
        for i in range(19):
            croppedWImgCenter = numpy.concatenate((croppedWImgCenter, wImg[wallStart:wallEnd,i * 4 + 100:i * 4 + 101]), axis=1)
        croppedWImgRight = wImg[wallStart:wallEnd,192:193]
        for i in range(19):
            croppedWImgRight = numpy.concatenate((croppedWImgRight, wImg[wallStart:wallEnd,i * 4 + 196:i * 4 + 197]), axis=1)
        
        def last_nonzero(arr, axis, invalid_val):
            mask = arr!=0
            val = arr.shape[axis] - numpy.flip(mask, axis=axis).argmax(axis=axis) - 1
            return numpy.where(mask.any(axis=axis), val, invalid_val)

        # find wall heights
        # left
        wallHeightsLeft = numpy.count_nonzero(croppedWImgLeft > 1,axis=0)
        wallHeights2Left = []
        for i in range(len(wallHeightsLeft)):
            if wallHeightsLeft[i] != 0:
                wallHeights2Left.append(wallHeightsLeft[i])
        if len(wallHeights2Left) == 0:
            wallHeightLeft = 0
        else:
            wallHeightLeft = statistics.median(wallHeights2Left)
        wallMaximumLeft = max(last_nonzero(croppedWImgLeft, axis=0, invalid_val=-1))
        # center
        wallHeightsCenter = numpy.count_nonzero(croppedWImgCenter > 1,axis=0)
        wallHeights2Center = []
        for i in range(len(wallHeightsCenter)):
            if wallHeightsCenter[i] != 0:
                wallHeights2Center.append(wallHeightsCenter[i])
        if len(wallHeights2Center) == 0:
            wallHeightCenter = 0
        else:
            wallHeightCenter = statistics.median(wallHeights2Center)
        wallMaximumCenter = max(last_nonzero(croppedWImgCenter, axis=0, invalid_val=-1))
        # right
        wallHeightsRight = numpy.count_nonzero(croppedWImgRight > 1,axis=0)
        wallHeights2Right = []
        for i in range(len(wallHeightsRight)):
            if wallHeightsRight[i] != 0:
                wallHeights2Right.append(wallHeightsRight[i])
        if len(wallHeights2Right) == 0:
            wallHeightRight = 0
        else:
            wallHeightRight = statistics.median(wallHeights2Right)
        wallMaximumRight = max(last_nonzero(croppedWImgRight, axis=0, invalid_val=-1))

        # pillar calculations

        dangerSize = 30
        def getRedEquation(x):
            return x * -0.315 + 121 - dangerSize
        def getGreenEquation(x):
            return (272 - x) * -0.315 + 121 - dangerSize

        # find signals that will collide with car
        brKps = 0
        for i in range(len(rKps)):
            rKps[i].size /= 2
            position = list(rKps[i].pt)
            position[1] += blobStart
            rKps[i].pt = tuple(position)
            if rKps[i].pt[1] + rKps[i].size > getRedEquation(rKps[i].pt[0]):
                if brKps == 0:
                    brKps = rKps[i]
                elif brKps.size < rKps[i].size:
                    brKps = rKps[i]
        bgKps = 0
        for i in range(len(gKps)):
            gKps[i].size /= 2
            position = list(gKps[i].pt)
            position[1] += blobStart
            gKps[i].pt = tuple(position)
            if gKps[i].pt[1] + gKps[i].size > getGreenEquation(gKps[i].pt[0]):
                if bgKps == 0:
                    bgKps = gKps[i]
                elif bgKps.size < gKps[i].size:
                    bgKps = gKps[i]
        
        # send data to SPARK Control
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

        # decide steering for each signal that will collide
        reducedSteering = 7
        blobSizeRequirement = 5
        if brKps != 0:
            if bgKps != 0:
                if brKps.size > bgKps.size and brKps.size > blobSizeRequirement:
                    steeringArray.append(-(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size + reducedSteering) * brKps.size ** 2 * 0.02)
                    # steeringArray.append(brKps.size ** 2 * 0.2)
                elif bgKps.size > blobSizeRequirement:
                    steeringArray.append((getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size + reducedSteering) * bgKps.size ** 2 * 0.02)
                    # steeringArray.append(-bgKps.size ** 2 * 0.2)
            elif brKps.size > blobSizeRequirement:
                steeringArray.append(-(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size + reducedSteering) * brKps.size ** 2 * 0.02)
                # steeringArray.append(brKps.size ** 2 * 0.2)
        elif bgKps != 0 and bgKps.size > blobSizeRequirement:
            steeringArray.append((getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size + reducedSteering) * bgKps.size ** 2 * 0.02)
            # steeringArray.append(-bgKps.size ** 2 * 0.2)
        
        # decide steering for each wall section
        # print(wallMaximumRight)
        if wallHeightCenter > 7 and wallHeightRight > 14 and (wallMaximumCenter > 24 or wallMaximumRight > 27):
            if wallMaximumLeft > 30 and wallMaximumCenter > 24:
                steeringArray.append(-(wallHeightCenter + wallHeightRight) ** 2 * 0.15)
            else:
                steeringArray.append(-(wallHeightCenter + wallHeightRight) ** 2 * 0.035)
            # if counterClockwise == True:
            #     steeringArray.append(-(wallHeightCenter + wallHeightRight) ** 2 * 0.035)
            # else:
            #     steeringArray.append((wallHeightCenter + wallHeightRight) ** 2 * 0.035)
        if wallHeightRight > 25 and wallMaximumRight > 27:
            steeringArray.append(-wallHeightRight ** 2 * 0.06)
        if wallHeightLeft > 25 and wallMaximumLeft > 27:
            steeringArray.append(wallHeightLeft ** 2 * 0.06)

        # decide final steering
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
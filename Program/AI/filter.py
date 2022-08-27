from IO import io
import numpy
import cv2
import base64
import statistics
import builtins

# preprocessing filter module with cv prediction

# colors
rM = redMax = (110, 110, 255)
rm = redMin = (25, 35, 100)
gM = greenMax = (120, 140, 95)
gm = greenMin = (55, 85, 10)
wM = wallMax = (90, 75, 85)
wm = wallMin = (0, 0, 0)
# sM = greyMax = 65
# sm = greyMin = 0

def filter(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    try:
        rMask = cv2.inRange(imgIn, redMin, redMax)
        gMask = cv2.inRange(imgIn, greenMin, greenMax)
        blurredR = cv2.medianBlur(rMask, 5)
        blurredG = cv2.medianBlur(gMask, 5)
        # colorWallMask = cv2.inRange(imgIn, wallMin, wallMax)
        # imgray = cv2.cvtColor(imgIn, cv2.COLOR_BGR2GRAY)
        # grayscaleFilter = cv2.inRange(imgray, 0, 65)
        # wMask = cv2.bitwise_and(colorWallMask, grayscaleFilter, mask = None)
        # rawImg = cv2.merge((wMask, gMask, rMask))
        gray_image = cv2.cvtColor(imgIn, cv2.COLOR_RGB2GRAY)
        blurredImg = cv2.GaussianBlur(gray_image, (3,3),0)
        edgesImage = cv2.Canny(blurredImg, 50, 125, 3)
        filteredImg = cv2.merge((edgesImage, blurredG, blurredR))
        return filteredImg
    except Exception as err:
        print(err)
        io.error()

rightOnRed = True
counterClockwise = 0
turnsMade = 0
turnCooldown = 0
passedPillar = 0
lastSend = 0
def predict(imgIn: numpy.ndarray, server = None, infinite = False):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin, lastSend, rightOnRed, counterClockwise, turnsMade, turnCooldown, passedPillar
    try:
        # useless thing
        if infinite: turnsMade = 0

        # create blob detector
        params = cv2.SimpleBlobDetector_Params()
        params.filterByArea = True
        params.minArea = 100
        params.filterByCircularity = True
        params.minCircularity = 0
        params.filterByConvexity = True
        params.minConvexity = 0
        params.filterByInertia = True
        params.minInertiaRatio = 0
        blobs = cv2.SimpleBlobDetector_create(params)

        # filter to colors and split
        blurredImg = filter(imgIn)
        edgesImage, gImg, rImg = cv2.split(blurredImg)

        # crop for blob detection
        blobStart = 50
        blobEnd = 100

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
        croppedEdgesImg = edgesImage[0:,0:1]
        for i in range(19):
            croppedEdgesImg = numpy.concatenate((croppedEdgesImg, edgesImage[0:,i * 4:i * 4 + 1]), axis=1)
        for i in range(20):
            croppedEdgesImg = numpy.concatenate((croppedEdgesImg, edgesImage[0:,i * 4 + 96:i * 4 + 97]), axis=1)
        for i in range(20):
            croppedEdgesImg = numpy.concatenate((croppedEdgesImg, edgesImage[0:,i * 4 + 192:i * 4 + 193]), axis=1)

        #flip wall

        croppedEdgesImg = numpy.flip(croppedEdgesImg,axis=0)

        # find wall heights

        transposedArray = numpy.transpose(numpy.nonzero(croppedEdgesImg))

        def getWallHeights(offset):
            wallHeightsMax = []
            wallHeightsDiff = []
            for i in range(20):
                i += offset
                nonzeroList = list(builtins.filter(lambda x: x[1] == i,transposedArray))
                if len(nonzeroList) >= 2:
                    firstNonzero = nonzeroList[0][0]
                    secondNonzero = nonzeroList[1][0]
                    index = 3
                    while secondNonzero - firstNonzero < 5 and len(nonzeroList) >= index:
                        secondNonzero = nonzeroList[index - 1][0]
                        index += 1
                else:
                    firstNonzero = 0
                    secondNonzero = 0
                wallHeightsDiff.append(secondNonzero - firstNonzero)
                wallHeightsMax.append(firstNonzero)
            filteredWallHeightsDiff = list(builtins.filter(lambda x:x > 2,wallHeightsDiff))
            print(offset)
            print(filteredWallHeightsDiff)
            if len(filteredWallHeightsDiff) > 0:
                return [max(wallHeightsMax),statistics.median(filteredWallHeightsDiff),filteredWallHeightsDiff]
            else:
                return [max(wallHeightsMax),0,[]]

        wallHeightsLeft = getWallHeights(0)
        wallMaximumLeft = wallHeightsLeft[0]
        wallHeightLeft = wallHeightsLeft[1]
        filteredWallHeightsDiffLeft = wallHeightsLeft[2]
        wallHeightsCenter = getWallHeights(20)
        wallMaximumCenter = wallHeightsCenter[0]
        wallHeightCenter = wallHeightsCenter[1]
        filteredWallHeightsDiffCenter = wallHeightsRight[2]
        wallHeightsRight = getWallHeights(40)
        wallMaximumRight = wallHeightsRight[0]
        wallHeightRight = wallHeightsRight[1]
        filteredWallHeightsDiffRight = wallHeightsRight[2]
        print(wallHeightLeft)
        print(wallHeightCenter)
        print(wallHeightRight)

        # pillar calculations

        blobSizeRequirement = 0
        dangerSize = 35
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
            if rKps[i].pt[1] + rKps[i].size > getRedEquation(rKps[i].pt[0]) and rKps[i].size > blobSizeRequirement:
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
            if gKps[i].pt[1] + gKps[i].size > getGreenEquation(gKps[i].pt[0]) and gKps[i].size > blobSizeRequirement:
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

        pillarSteering = 0

        # decide steering for each signal that will collide
        reducedSteering = 0
        if brKps != 0:
            if bgKps != 0:
                if brKps.size > bgKps.size:
                    pillarSteering = -(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size - reducedSteering) * (brKps.size + 1) ** 2 * 0.02
                    # steeringArray.append(brKps.size ** 2 * 0.2)
                else:
                    pillarSteering = (getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size - reducedSteering) * (bgKps.size + 1) ** 2 * 0.02
                    # steeringArray.append(-bgKps.size ** 2 * 0.2)
            else:
                pillarSteering = -(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size - reducedSteering) * (brKps.size + 1) ** 2 * 0.02
                # steeringArray.append(brKps.size ** 2 * 0.2)
        elif bgKps != 0:
            pillarSteering = (getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size - reducedSteering) * (bgKps.size + 1) ** 2 * 0.02
            # steeringArray.append(-bgKps.size ** 2 * 0.2)
        passedPillar *= 0.8
        if pillarSteering != 0:
            passedPillar = pillarSteering
        else:
            pillarSteering = passedPillar
        
        # decide steering for each wall section
        counterClockwise += wallHeightRight - wallHeightLeft

        counterClockwise *= 0.9

        def wallCalculations(left,center,right):
            if center > 9 and right > 9:
                if left > 20:
                    steeringArray.append(-(center + right) ** 2 * 0.08)
                else:
                    steeringArray.append(-(center + right) ** 2 * 0.16)
            if right > 15:
                steeringArray.append(-right ** 2 * 0.04)
            if left > 15:
                steeringArray.append(left ** 2 * 0.04)
        
        if counterClockwise >= 0:
            wallCalculations(wallHeightLeft,wallHeightCenter,wallHeightRight)
        else:
            wallCalculations(wallHeightRight,wallHeightCenter,wallHeightLeft)
        
        # very far, just turned

        if wallHeightCenter < 9 and turnCooldown <= 0:
            turnCooldown = 180
            turnsMade += 1
            print(turnsMade)
        
        turnCooldown -= 1

        if turnsMade == 13:
            return "stop"


        # decide final steering
        steeringMax = max(steeringArray)
        steeringMin = min(steeringArray)
        if steeringMax > abs(steeringMin):
            if pillarSteering > 0:
                if steeringMax < pillarSteering and (steeringMax < 75 or pillarSteering >= 75):
                    steeringMax += pillarSteering * 3 / 2
                else:
                    steeringMax += pillarSteering / 2
                if server != None:
                    server.broadcast('values', [steeringMax, wallHeightLeft, wallHeightCenter, wallHeightRight, filteredWallHeightsDiffLeft, filteredWallHeightsDiffCenter, filteredWallHeightsDiffRight])
                return steeringMax
            else:
                if steeringMax < abs(pillarSteering) and (steeringMax < 75 or pillarSteering <= -75):
                    steeringMax += pillarSteering * 3 / 2
                else:
                    steeringMax += pillarSteering / 2
                if server != None:
                    server.broadcast('values', [steeringMax, wallHeightLeft, wallHeightCenter, wallHeightRight, filteredWallHeightsDiffLeft, filteredWallHeightsDiffCenter, filteredWallHeightsDiffRight])
                return steeringMax
        else:
            if pillarSteering > 0:
                if abs(steeringMin) < pillarSteering and (abs(steeringMin) < 75 or pillarSteering >= 75):
                    steeringMin += pillarSteering * 3 / 2
                else:
                    steeringMin += pillarSteering / 2
                if server != None:
                    server.broadcast('values', [steeringMin, wallHeightLeft, wallHeightCenter, wallHeightRight, filteredWallHeightsDiffLeft, filteredWallHeightsDiffCenter, filteredWallHeightsDiffRight])
                return steeringMin
            else:
                if abs(steeringMin) < abs(pillarSteering) and (abs(steeringMin) < 75 or pillarSteering <= -75):
                    steeringMin += pillarSteering * 3 / 2
                else:
                    steeringMin += pillarSteering / 2
                if server != None:
                    server.broadcast('values', [steeringMin, wallHeightLeft, wallHeightCenter, wallHeightRight, filteredWallHeightsDiffLeft, filteredWallHeightsDiffCenter, filteredWallHeightsDiffRight])
                return steeringMin

        # steeringMax += pillarSteering
        # steeringMin += pillarSteering
        # if steeringMax > abs(steeringMin):
        #     if server != None:
        #         server.broadcast('strPredict', str(steeringMax))
        #     return steeringMax
        # if server != None:
        #     server.broadcast('strPredict', str(steeringMin))
        # return steeringMin
    except Exception as err:
        print(err)
        io.error()

def setColors(data, server = None):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    redMax = (int(data[6]), int(data[3]), int(data[0]))
    greenMax = (int(data[7]), int(data[4]), int(data[1]))
    wallMax = (int(data[8]), int(data[5]), int(data[2]))
    redMin = (int(data[15]), int(data[12]), int(data[9]))
    greenMin = (int(data[16]), int(data[13]), int(data[10]))
    wallMin = (int(data[17]), int(data[14]), int(data[11]))
    # greyMax = int(data[18])
    # greyMin = int(data[19])
    print('-- New ----------')
    print(redMax, redMin)
    print(greenMax, greenMin)
    print(wallMax, wallMin)
    # print(greyMax, greyMin)
    if server != None:
        server.broadcast('colors', getColors())
def getColors():
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    return [redMax[2], greenMax[2], wallMax[2], redMax[1], greenMax[1], wallMax[1], redMax[0], greenMax[0], wallMax[0], redMin[2], greenMin[2], wallMin[2], redMin[1], greenMin[1], wallMin[1], redMin[0], greenMin[0], wallMin[0]]
def setDefaultColors():
    global rM, rm, gM, gm, wM, wm
    print('-- New ----------')
    print(rM, rm)
    print(gM, gm)
    print(wM, wm)
    return [rM[2], gM[2], wM[2], rM[1], gM[1], wM[1], rM[0], gM[0], wM[0], rm[2], gm[2], wm[2], rm[1], gm[1], wm[1], rm[0], gm[0], wm[0]]
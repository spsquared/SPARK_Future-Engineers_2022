from IO import io
import numpy
import cv2
import base64
import statistics
import math

# preprocessing filter module with cv prediction

# colors
# rm = redMin1 = (175, 0, 0)
# rM = redMax1 = (140, 140, 255)
rm = redMin = (0, 75, 75)
rM = redMax = (30, 255, 255)
# rm = redMin = (150, 75, 100)
# rM = redMax = (180, 255, 255)
gm = greenMin = (30, 30, 30)
gM = greenMax = (110, 255, 255)
# gM = greenMax = (85, 140, 95)
# gm = greenMin = (60, 65, 10)
# wM = wallMax = (90, 75, 85)
# wm = wallMin = (0, 0, 0)
# sM = greyMax = 65
# sm = greyMin = 0

def filter(imgIn: numpy.ndarray):
    global redMax, redMin, greenMax, greenMin, wallMax, wallMin
    try:
        hsv = cv2.cvtColor(imgIn, cv2.COLOR_BGR2HSV)
        # rMask = cv2.inRange(imgIn, redMin1, redMax1)
        rMask1 = cv2.inRange(hsv, redMin, redMax)
        redMaxH = redMax[0]
        redMinList = list(redMin)
        redMinList = [180 - redMaxH,redMinList[1],redMinList[2]]
        redMin2 = tuple(redMinList)
        redMaxList = list(redMax)
        redMaxList = [180,redMaxList[1],redMaxList[2]]
        redMax2 = tuple(redMaxList)
        rMask2 = cv2.inRange(hsv, redMin2, redMax2)
        rMask = cv2.bitwise_or(rMask1, rMask2)
        # gMask = cv2.inRange(imgIn, greenMin, greenMax)
        gMask = cv2.inRange(hsv, greenMin, greenMax)
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
doPillars = True
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
        params.minArea = 75
        params.filterByCircularity = True
        params.minCircularity = 0.4
        params.filterByConvexity = True
        params.minConvexity = 0.7
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
            if rKps[i].pt[1] + rKps[i].size > getRedEquation(rKps[i].pt[0]) and rKps[i].pt[1] + rKps[i].size > 70 and rKps[i].size > blobSizeRequirement:
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
            if gKps[i].pt[1] + gKps[i].size > getGreenEquation(gKps[i].pt[0]) and gKps[i].pt[1] + gKps[i].size > 70 and gKps[i].size > blobSizeRequirement:
                if bgKps == 0:
                    bgKps = gKps[i]
                elif bgKps.size < gKps[i].size:
                    bgKps = gKps[i]

        # crop for wall detection
        wallStart = 50
        wallEnd = 100
        croppedEdgesImg = edgesImage[wallStart:wallEnd,0:1]
        for i in range(19):
            croppedEdgesImg = numpy.concatenate((croppedEdgesImg, edgesImage[wallStart:wallEnd,i * 4:i * 4 + 1]), axis=1)
        for i in range(20):
            croppedEdgesImg = numpy.concatenate((croppedEdgesImg, edgesImage[wallStart:wallEnd,i * 4 + 96:i * 4 + 97]), axis=1)
        for i in range(20):
            croppedEdgesImg = numpy.concatenate((croppedEdgesImg, edgesImage[wallStart:wallEnd,i * 4 + 192:i * 4 + 193]), axis=1)

        #flip wall

        croppedEdgesImg = numpy.flip(croppedEdgesImg,axis=0)
        croppedEdgesImg = numpy.swapaxes(croppedEdgesImg,0,1)

        # find wall heights

        def getWallHeights(offset):
            wallHeightsMax = []
            wallHeightsDiff = []
            for i in range(20):
                i += offset
                nonzeroList = numpy.nonzero(croppedEdgesImg[i])[0]
                if len(nonzeroList) >= 2:
                    firstNonzero = nonzeroList[0]
                    secondNonzero = nonzeroList[1]
                    index = 2
                    while secondNonzero - firstNonzero < 5:
                        if len(nonzeroList) <= index:
                            secondNonzero = 50
                            break
                        secondNonzero = nonzeroList[index]
                        index += 1
                elif len(nonzeroList) == 1:
                    firstNonzero = nonzeroList[0]
                    secondNonzero = 50
                else:
                    firstNonzero = 0
                    secondNonzero = 50
                wallHeightsDiff.append(secondNonzero - firstNonzero)
                wallHeightsMax.append(firstNonzero)
            if len(wallHeightsDiff) > 0:
                return [max(wallHeightsMax),wallHeightsMax,statistics.median(wallHeightsDiff),wallHeightsDiff]
            else:
                return [max(wallHeightsMax),wallHeightsMax,0,[]]

        wallHeightsLeft = getWallHeights(0)
        wallMaximumLeft = wallHeightsLeft[0]
        wallHeightsMaxLeft = wallHeightsLeft[1]
        wallHeightLeft = wallHeightsLeft[2]
        filteredWallHeightsDiffLeft = wallHeightsLeft[3]
        wallHeightsCenter = getWallHeights(20)
        wallMaximumCenter = wallHeightsCenter[0]
        wallHeightsMaxCenter = wallHeightsCenter[1]
        wallHeightCenter = wallHeightsCenter[2]
        filteredWallHeightsDiffCenter = wallHeightsCenter[3]
        wallHeightsRight = getWallHeights(40)
        wallMaximumRight = wallHeightsRight[0]
        wallHeightsMaxRight = wallHeightsRight[1]
        wallHeightRight = wallHeightsRight[2]
        filteredWallHeightsDiffRight = wallHeightsRight[3]
        
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

        #steering reason
        steeringReason = ""

        # decide steering for each signal that will collide
        reducedSteering = 0
        if doPillars == True:
            if brKps != 0:
                if bgKps != 0:
                    if brKps.size > bgKps.size:
                        pillarSteering = -(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size - reducedSteering) * (brKps.size) ** 2 * 0.015
                        steeringReason += "red pillar "
                        # steeringArray.append(brKps.size ** 2 * 0.2)
                    else:
                        pillarSteering = (getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size - reducedSteering) * (bgKps.size) ** 2 * 0.015
                        steeringReason += "green pillar "
                        # steeringArray.append(-bgKps.size ** 2 * 0.2)
                else:
                    pillarSteering = -(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size - reducedSteering) * (brKps.size) ** 2 * 0.015
                    steeringReason += "red pillar "
                    # steeringArray.append(brKps.size ** 2 * 0.2)
            elif bgKps != 0:
                pillarSteering = (getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size - reducedSteering) * (bgKps.size) ** 2 * 0.015
                steeringReason += "green pillar "
                # steeringArray.append(-bgKps.size ** 2 * 0.2)
            passedPillar *= 0.8
            if pillarSteering != 0:
                passedPillar = pillarSteering
            else:
                pillarSteering = passedPillar
        
        # decide steering for each wall section
        counterClockwise += wallHeightRight - wallHeightLeft

        counterClockwise *= 0.9

        leftSteering = "no"
        centerSteering = "no"
        rightSteering = "no"

        def centerWallCalculations(left,center,right,direction):
            nonlocal centerSteering
            if center > 15 and right > 15:
                if left > 20:
                    steering = min(center,right) ** 2 * 0.1 * direction
                    steeringArray.append(steering)
                    centerSteering = steering
                else:
                    steering = min(center,right) ** 2 * 0.2 * direction
                    steeringArray.append(steering)
                    centerSteering = steering
        
        if counterClockwise >= 0:
            centerWallCalculations(wallHeightLeft,wallHeightCenter,wallHeightRight,-1)
        else:
            centerWallCalculations(wallHeightRight,wallHeightCenter,wallHeightLeft,1)
        if wallHeightRight > 18:
            steering = -wallHeightRight ** 2 * 0.04
            steeringArray.append(steering)
            rightSteering = steering
        if wallHeightLeft > 18:
            steering = wallHeightLeft ** 2 * 0.04
            steeringArray.append(steering)
            leftSteering = steering
        
        # very far, just turned

        justTurned = False

        if wallHeightCenter < 9 and turnCooldown <= 0:
            turnCooldown = 150
            turnsMade += 1
            justTurned = True
            print(turnsMade)
        
        turnCooldown -= 1

        if turnsMade == 13:
            return "stop"


        # decide final steering
        steeringMax = max(steeringArray)
        steeringMin = min(steeringArray)

        wallSteering = 0

        if steeringMax > abs(steeringMin):
            if steeringMax == leftSteering:
                steeringReason += "left wall"
            elif steeringMax == centerSteering:
                steeringReason += "center wall"
            elif steeringMax == rightSteering:
                steeringReason += "right wall"
            elif steeringMax == 0:
                steeringReason += ""
            else:
                steeringReason += "BORKEN"
            wallSteering = steeringMax
            if pillarSteering > 0:
                if steeringMax < pillarSteering and (steeringMax < 75 or pillarSteering >= 75):
                    steeringMax += pillarSteering * 3 / 2
                else:
                    steeringMax += pillarSteering / 2
            else:
                if steeringMax < abs(pillarSteering) and (steeringMax < 75 or pillarSteering <= -75):
                    steeringMax += pillarSteering * 3 / 2
                else:
                    steeringMax += pillarSteering / 2
            if server != None:
                server.broadcast('values', [[str(steeringMax),steeringReason,str(wallSteering),str(pillarSteering)], str(wallHeightLeft), str(wallHeightCenter), str(wallHeightRight), str(filteredWallHeightsDiffLeft), str(filteredWallHeightsDiffCenter), str(filteredWallHeightsDiffRight),str(wallHeightsMaxLeft),str(wallHeightsMaxCenter),str(wallHeightsMaxRight),[str(justTurned),str(turnCooldown),str(turnsMade)],str(passedPillar)])
            return steeringMax
        else:
            if steeringMin == leftSteering:
                steeringReason += "left wall"
            elif steeringMin == centerSteering:
                steeringReason += "center wall"
            elif steeringMin == rightSteering:
                steeringReason += "right wall"
            elif steeringMin == 0:
                steeringReason += ""
            else:
                steeringReason += "BORKEN"
            wallSteering = steeringMin
            if pillarSteering > 0:
                if abs(steeringMin) < pillarSteering and (abs(steeringMin) < 75 or pillarSteering >= 75):
                    steeringMin += pillarSteering * 3 / 2
                else:
                    steeringMin += pillarSteering / 2
            else:
                if abs(steeringMin) < abs(pillarSteering) and (abs(steeringMin) < 75 or pillarSteering <= -75):
                    steeringMin += pillarSteering * 3 / 2
                else:
                    steeringMin += pillarSteering / 2
            if server != None:
                server.broadcast('values', [[str(steeringMin),steeringReason,str(wallSteering),str(pillarSteering)], str(wallHeightLeft), str(wallHeightCenter), str(wallHeightRight), str(filteredWallHeightsDiffLeft), str(filteredWallHeightsDiffCenter), str(filteredWallHeightsDiffRight),str(wallHeightsMaxLeft),str(wallHeightsMaxCenter),str(wallHeightsMaxRight),[str(justTurned),str(turnCooldown),str(turnsMade)],str(passedPillar)])
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
    print(data)
    global redMax, redMin, greenMax, greenMin
    redMax = (int(data[0]), int(data[2]), int(data[4]))
    greenMax = (int(data[1]), int(data[3]), int(data[5]))
    # wallMax = (int(data[8]), int(data[5]), int(data[2]))
    redMin = (int(data[6]), int(data[8]), int(data[10]))
    greenMin = (int(data[7]), int(data[9]), int(data[11]))
    # wallMin = (int(data[17]), int(data[14]), int(data[11]))
    # greyMax = int(data[18])
    # greyMin = int(data[19])
    print('-- New ----------')
    print(redMax, redMin)
    print(greenMax, greenMin)
    # print(wallMax, wallMin)
    # print(greyMax, greyMin)
    if server != None:
        server.broadcast('colors', getColors())
def getColors():
    global redMax, redMin, greenMax, greenMin
    array = []
    for i in range(6):
        if i % 2 == 0:
            array.append(redMax[int(i/2)])
        else:
            array.append(greenMax[math.floor(i/2)])
    for i in range(6):
        if i % 2 == 0:
            array.append(redMin[int(i/2)])
        else:
            array.append(greenMin[math.floor(i/2)])
    return array
def setDefaultColors():
    global rM, rm, gM, gm, wM, wm
    print('-- New ----------')
    print(rM, rm)
    print(gM, gm)
    print(wM, wm)
    return [rM[2], gM[2], wM[2], rM[1], gM[1], wM[1], rM[0], gM[0], wM[0], rm[2], gm[2], wm[2], rm[1], gm[1], wm[1], rm[0], gm[0], wm[0]]
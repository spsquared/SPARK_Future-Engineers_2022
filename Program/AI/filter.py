from IO import io
import numpy
import cv2
import base64
import statistics
import math
import json

# preprocessing filter module with cv prediction

# colors
rm = redMin = (0, 95, 75)
rM = redMax = (25, 255, 255)
gm = greenMin = (30, 30, 80)
gM = greenMax = (100, 255, 255)
bm = blueMin = (95, 80, 70)
bM = blueMax = (120, 255, 255)

LEFT = 0
CENTER = 1
RIGHT = 2

def filter(imgIn: numpy.ndarray, checkBlue: bool):
    global redMax, redMin, greenMax, greenMin, blueMax, blueMin
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
        bMask = cv2.inRange(hsv, blueMin, blueMax)
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
        if checkBlue:
            filteredImg = cv2.merge((edgesImage, blurredG, blurredR, bMask))
        else:
            filteredImg
            filteredImg = cv2.merge((edgesImage, blurredG, blurredR))
        return filteredImg
    except Exception as err:
        print(err)
        io.error()

rightOnRed = True
doPillars = True
counterClockwise = 0
turnsMade = 0
turnCooldown = 40
passedPillar = 0
lastSend = 0
def predict(imgIn: numpy.ndarray, server = None, infinite = False):
    global redMax, redMin, greenMax, greenMin, lastSend, rightOnRed, counterClockwise, turnsMade, turnCooldown, passedPillar
    try:
        # useless thing
        if infinite: turnsMade = 0

        # create blob detector
        params = cv2.SimpleBlobDetector_Params()
        params.filterByArea = True
        params.minArea = 75
        params.filterByCircularity = True
        params.minCircularity = 0.3
        params.filterByConvexity = True
        params.minConvexity = 0.7
        params.filterByInertia = True
        params.minInertiaRatio = 0
        blobs = cv2.SimpleBlobDetector_create(params)

        # filter to colors and split
        blurredImg = filter(imgIn)
        edgesImage, gImg, rImg, bImg = cv2.split(blurredImg)

        # steering reason
        steeringReason = ""

        ################# PILLAR STEERING #################

        # crop for blob detection
        blobStart = 65
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

        # find pillars that will collide with car
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

        # pillar steering
        pillarSteering = 0

        # decide steering for each signal that will collide
        reducedSteering = 0
        if doPillars == True:
            if brKps != 0:
                if bgKps != 0:
                    if brKps.size > bgKps.size:
                        pillarSteering = -(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size - reducedSteering) * (brKps.size - 3) ** 2 * 0.012
                        steeringReason += "red pillar "
                        # steeringArray.append(brKps.size ** 2 * 0.2)
                    else:
                        pillarSteering = (getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size - reducedSteering) * (bgKps.size - 3) ** 2 * 0.017
                        steeringReason += "green pillar "
                        # steeringArray.append(-bgKps.size ** 2 * 0.2)
                else:
                    pillarSteering = -(getRedEquation(brKps.pt[0]) - brKps.pt[1] - brKps.size - reducedSteering) * (brKps.size - 3) ** 2 * 0.012
                    steeringReason += "red pillar "
                    # steeringArray.append(brKps.size ** 2 * 0.2)
            elif bgKps != 0:
                pillarSteering = (getGreenEquation(bgKps.pt[0]) - bgKps.pt[1] - bgKps.size - reducedSteering) * (bgKps.size - 3) ** 2 * 0.017
                steeringReason += "green pillar "
                # steeringArray.append(-bgKps.size ** 2 * 0.2)
            passedPillar *= 0.9
            if pillarSteering != 0:
                pillarSteering += passedPillar * 0.9
                passedPillar = pillarSteering
            else:
                pillarSteering = passedPillar

        ################# WALL STEERING #################

        # crop for wall detection
        wallStart = 78
        wallEnd = 125
        croppedEdgesImg = numpy.concatenate((edgesImage[wallStart:wallEnd], numpy.full((2,272),1,dtype=int)), axis=0)

        #flip wall
        # croppedEdgesImg = numpy.flip(croppedEdgesImg,axis=1)
        croppedEdgesImg = numpy.swapaxes(croppedEdgesImg,0,1)

        firstWallValues = (croppedEdgesImg!=0).argmax(axis=1)

        # zipX = numpy.arange(0,272)

        # indices = numpy.dstack((zipX,firstWallValues))

        # croppedEdgesImg[indices] = 0

        # secondWallValues = (croppedEdgesImg!=0).argmax(axis=1)

        # wallHeightsAll = firstWallValues - secondWallValues

        wallHeightsAll = firstWallValues

        oneEighth = 34
        wallHeightsRaw = [wallHeightsAll[0:oneEighth],wallHeightsAll[oneEighth:oneEighth * 2],wallHeightsAll[oneEighth * 2:oneEighth * 3],wallHeightsAll[oneEighth * 3:oneEighth * 4],wallHeightsAll[oneEighth * 4:oneEighth * 5],wallHeightsAll[oneEighth * 5:oneEighth * 6],wallHeightsAll[oneEighth * 6:oneEighth * 7],wallHeightsAll[oneEighth * 7:oneEighth * 8]]

        wallDifferences = [[],[],[],[],[],[],[],[]]
        wallDifferences2 = [[],[],[],[],[],[],[],[]]
        wallSlopes = [0,0,0,0,0,0,0,0]
        wallHeights = [0,0,0,0,0,0,0,0]

        for i in range(8):
            wallDifferences[i] = numpy.diff(wallHeightsRaw[i],n=10)
            wallDifferences2[i] = numpy.diff(wallHeightsRaw[i])
            wallSlopes[i] = statistics.mean(wallSlopes)
            wallHeights[i] = statistics.mean(wallHeightsRaw[i])
        
        wallLabels = [0,0,0,0,0,0,0,0]

        for i in range(8):
            if wallSlopes[i] < -0.1:
                wallLabels[i] = LEFT
            elif wallSlopes[i] > 0.1:
                wallLabels[i] = RIGHT
            else:
                wallLabels[i] = CENTER
        
        jumped = False
        for i in range(7):
            if jumped == True:
                if wallLabels[i + 1] == CENTER:
                    wallLabels[i + 1] = RIGHT
            if wallHeights[i + 1] - wallHeights[i] > 4:
                if wallLabels[i + 1] == CENTER:
                    wallLabels[i + 1] = RIGHT
                jumped = True
        
        jumped = False
        for i in range(7):
            if jumped == True:
                if wallLabels[i] == CENTER:
                    wallLabels[i] = LEFT
            if wallHeights[i] - wallHeights[i + 1] > 4:
                if wallLabels[i] == CENTER:
                    wallLabels[i] = LEFT
                jumped = True
        
        wallLabels[0] = LEFT
        wallLabels[1] = LEFT

        wallLabels[6] = RIGHT
        wallLabels[7] = RIGHT
        
        if counterClockwise == 0:
            jumpedLeft = 0
            hitPillarLeft = False
            for i in range(4):
                for j in range(len(wallDifferences2[i])):
                    # print(wallDifferences2[i][j - 1] - wallDifferences2[i][j])
                    if wallDifferences2[i][j] * -1 > 4:
                        if wallDifferences2[i][j] * -1 > jumpedLeft:
                            jumpedLeft = wallDifferences2[i][j] * -1
                    if wallDifferences2[i][j] > 2:
                        hitPillarLeft = True
                        break
                if hitPillarLeft == True:
                    break
            jumpedRight = 0
            hitPillarRight = False
            for i in range(4):
                for j in range(len(wallDifferences2[7 - i])):
                    if wallDifferences2[7 - i][len(wallDifferences2[7 - i]) - j - 1] > 4:
                        if wallDifferences2[7 - i][len(wallDifferences2[7 - i]) - j - 1] > jumpedRight:
                            jumpedRight = wallDifferences2[7 - i][len(wallDifferences2[7 - i]) - j - 1]
                    if wallDifferences2[7 - i][len(wallDifferences2[7 - i]) - j - 1] < -2:
                        hitPillarRight = True
                        break
                if hitPillarRight == True:
                    break
            if jumpedRight > jumpedLeft:
                counterClockwise = 1
            elif jumpedRight < jumpedLeft:
                counterClockwise = -1
            else:
                if wallHeightsRaw[0][0] > wallHeightsRaw[7][len(wallHeightsRaw[7]) - 1]:
                    counterClockwise = 1
                else:
                    counterClockwise = -1
            print(counterClockwise)
            print(jumpedLeft)
            print(jumpedRight)

        leftSteering = 0
        centerSteering = 0
        rightSteering = 0
        
        for i in range(8):
            if wallLabels[i] == LEFT:
                if wallHeights[i] > 14:
                    steering = 15
                    if i <= 3:
                        steering += 3 * (4 - i)
                    steering += wallHeights[i]
                    leftSteering += steering
            elif wallLabels[i] == CENTER:
                if wallHeights[i] > 8:
                    steering = 60
                    steering += wallHeights[i]
                    centerSteering += steering * counterClockwise
            else:
                if wallHeights[i] > 14:
                    steering = 15
                    if i >= 4:
                        steering += 3 * (i - 3)
                    steering += wallHeights[i]
                    rightSteering -= steering
        
        # decide final steering

        wallSteering = 0
        if abs(leftSteering) > abs(rightSteering):
            if abs(leftSteering) > abs(centerSteering):
                wallSteering = leftSteering
                steeringReason += "left wall"
            elif centerSteering != 0:
                wallSteering = centerSteering
                steeringReason += "center wall"
        else:
            if abs(rightSteering) > abs(centerSteering):
                wallSteering = rightSteering
                steeringReason += "right wall"
            elif centerSteering != 0:
                wallSteering = centerSteering
                steeringReason += "center wall"
        
        # BLU #
        
        if numpy.count_nonzero(bImg[wallStart:]) > 100 and turnCooldown <= 0:
            turnsMade += 1
            turnCooldown = 180
            print(turnsMade)

        turnCooldown -= 1

        # send images to SPARK Control
        if server != None and blurredImg.all() != None:
            lastSend += 1
            if (lastSend > 2):
                lastSend = 0
                encoded = base64.b64encode(cv2.imencode('.png', cv2.merge((edgesImage, gImg, rImg)))[1]).decode()
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

        if turnsMade >= 13:
            return "stop"

        finalSteering = wallSteering

        if wallSteering > 0:
            if pillarSteering > 0:
                if wallSteering < pillarSteering and (wallSteering < 75 or pillarSteering >= 75):
                    finalSteering += pillarSteering * 3 / 2
                else:
                    finalSteering += pillarSteering / 2
            else:
                if wallSteering < abs(pillarSteering) and (wallSteering < 75 or pillarSteering <= -75):
                    finalSteering += pillarSteering * 3 / 2
                else:
                    finalSteering += pillarSteering / 2
        else:
            if pillarSteering > 0:
                if abs(wallSteering) < pillarSteering and (abs(wallSteering) < 75 or pillarSteering >= 75):
                    finalSteering += pillarSteering * 3 / 2
                else:
                    finalSteering += pillarSteering / 2
            else:
                if abs(wallSteering) < abs(pillarSteering) and (abs(wallSteering) < 75 or pillarSteering <= -75):
                    finalSteering += pillarSteering * 3 / 2
                else:
                    finalSteering += pillarSteering / 2
        if server != None:
            serailzed=[[],[],[],[],[],[],[],[]]
            for i in range(8):
                serailzed[i] = json.dumps(wallHeightsRaw[i].tolist())
            server.broadcast('values', [[str(finalSteering),steeringReason,str(wallSteering),str(pillarSteering)],serailzed])
        return finalSteering
    except Exception as err:
        print(err)
        io.error()

def setColors(data, server = None):
    global redMax, redMin, greenMax, greenMin, blueMax, blueMin
    redMax = (int(data[0]), int(data[2]), int(data[4]))
    greenMax = (int(data[1]), int(data[3]), int(data[5]))
    redMin = (int(data[6]), int(data[8]), int(data[10]))
    greenMin = (int(data[7]), int(data[9]), int(data[11]))
    blueMax = (int(data[12]), int(data[13]), int(data[14]))
    blueMin = (int(data[15]), int(data[16]), int(data[17]))
    print('-- New ----------')
    print(redMax, redMin)
    print(greenMax, greenMin)
    print(blueMax, blueMin)
    if server != None:
        server.broadcast('colors', getColors())
def getColors():
    global redMax, redMin, greenMax, greenMin, blueMax, blueMin
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
    global rM, rm, gM, gm, bM, bm
    print('-- New ----------')
    print(rM, rm)
    print(gM, gm)
    print(bM, bm)
    return [rM[2], gM[2], bM[2], rM[1], gM[1], bM[1], rM[0], gM[0], bM[0], rm[2], gm[2], bm[2], rm[1], gm[1], bm[1], rm[0], gm[0], bm[0]]

# find wall heights
# def getWallHeights(offset):
#     wallHeightsMax = []
#     wallHeightsDiff = []
#     for i in range(20):
#         i += offset
#         nonzeroList = numpy.nonzero(croppedEdgesImg[i])[0]
#         if len(nonzeroList) >= 2:
#             firstNonzero = nonzeroList[0]
#             secondNonzero = nonzeroList[1]
#             index = 2
#             minimumValue = 7
#             if offset == 20:
#                 minimumValue = 5
#             while secondNonzero - firstNonzero < minimumValue:
#                 if len(nonzeroList) <= index:
#                     secondNonzero = 50
#                     break
#                 secondNonzero = nonzeroList[index]
#                 index += 1
#         elif len(nonzeroList) == 1:
#             firstNonzero = nonzeroList[0]
#             secondNonzero = 50
#         else:
#             firstNonzero = 0
#             secondNonzero = 50
#         wallHeightsDiff.append(secondNonzero - firstNonzero)
#         wallHeightsMax.append(firstNonzero)
#     if len(wallHeightsDiff) > 0:
#         return [max(wallHeightsMax),wallHeightsMax,statistics.median(wallHeightsDiff),wallHeightsDiff]
#     else:
#         return [max(wallHeightsMax),wallHeightsMax,0,[]]

# wallHeightsLeft = getWallHeights(0)
# wallMaximumLeft = wallHeightsLeft[0]
# wallHeightsMaxLeft = wallHeightsLeft[1]
# wallHeightLeft = wallHeightsLeft[2]
# filteredWallHeightsDiffLeft = wallHeightsLeft[3]
# wallHeightsCenter = getWallHeights(20)
# wallMaximumCenter = wallHeightsCenter[0]
# wallHeightsMaxCenter = wallHeightsCenter[1]
# wallHeightCenter = wallHeightsCenter[2]
# filteredWallHeightsDiffCenter = wallHeightsCenter[3]
# wallHeightsRight = getWallHeights(40)
# wallMaximumRight = wallHeightsRight[0]
# wallHeightsMaxRight = wallHeightsRight[1]
# wallHeightRight = wallHeightsRight[2]
# filteredWallHeightsDiffRight = wallHeightsRight[3]


# decide steering for each wall section
# counterClockwise += wallHeightRight - wallHeightLeft

# counterClockwise *= 0.95

# counterClockwise = 1

# def centerWallCalculations(left,center,right,direction):
#     global counterClockwise
#     nonlocal centerSteering
#     if center > 15 and right > 15:
#         if left > 20:
#             steering = min(center,right) ** 2 * 0.15 * direction
#             steeringArray.append(steering)
#             centerSteering = steering
#         else:
#             steering = min(center,right) ** 2 * 0.3 * direction
#             steeringArray.append(steering)
#             centerSteering = steering
#         counterClockwise *= 2

# if counterClockwise >= 0:
#     centerWallCalculations(wallHeightLeft,wallHeightCenter,wallHeightRight,-1)
# else:
#     centerWallCalculations(wallHeightRight,wallHeightCenter,wallHeightLeft,1)
# if wallHeightRight > 18:
#     steering = -wallHeightRight ** 2 * 0.045
#     steeringArray.append(steering)
#     rightSteering = steering
# if wallHeightLeft > 18:
#     steering = wallHeightLeft ** 2 * 0.045
#     steeringArray.append(steering)
#     leftSteering = steering

# # very far, just turned

# justTurned = False

# if wallHeights[3] < 11 and wallHeights[4] < 11 and turnCooldown <= 0:
#     if turnOnStart >= 0:
#         turnOnStart = -1
#     turnCooldown = 140
#     turnsMade += 1
#     # justTurned = True
#     print(turnsMade)
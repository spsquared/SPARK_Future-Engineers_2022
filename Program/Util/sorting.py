from numpy import ndarray


redColors = [75,75,100]
greenColors = [50,75,40]

wallColors = [80,75,75]

def checkWallColor(array):
    if array[0] < wallColors[0] and array[1] < wallColors[1] and array[2] < wallColors[2]:
        return True
    return False

for images in os.listdir("C:\\Users\\guliz\\Documents\\images"):
    if images.endswith(".png"):
        image = Image.open("C:\\Users\\guliz\\Documents\\images\\" + images)
        array = numpy.array(image)
        array2 = numpy.array(image)
        for i in range(len(array2)):
            for j in range(len(array2[i])):
                array2[i][j] = [0,0,0]

        redPixelsX = []
        redPixelsY = []
        greenPixelsX = []
        greenPixelsY = []
        for i in range(len(array)):
            for j in range(len(array[i])):
                if array[i][j][0] < redColors[0] and array[i][j][1] < redColors[1] and array[i][j][2] > redColors[2]:
                    array[i][j] = [255,0,0]
                    array2[i][j] = [255,0,0]
                    redPixelsX.append(j)
                    redPixelsY.append(i)
                elif array[i][j][0] > greenColors[0] and array[i][j][1] > greenColors[1] and array[i][j][2] < greenColors[2]:
                    array[i][j] = [0,255,0]
                    array2[i][j] = [0,255,0]
                    greenPixelsX.append(j)
                    greenPixelsY.append(i)
        
        folderName = "straight"
        
        if folderName == "straight" and len(redPixelsX) > 15 and len(redPixelsX) > len(greenPixelsX):
            redPixelMedianX = round(statistics.median(redPixelsX))
            redPixelMedianY = round(statistics.median(redPixelsY))
            array[redPixelMedianY][redPixelMedianX] = [255,125,0]
            array2[redPixelMedianY][redPixelMedianX] = [255,125,0]
            if redPixelMedianY >= 50 and redPixelMedianX > 85:
                folderName = "right"
        if folderName == "straight" and len(greenPixelsX) > 15:
            greenPixelMedianX = round(statistics.median(greenPixelsX))
            greenPixelMedianY = round(statistics.median(greenPixelsY))
            array[greenPixelMedianY][greenPixelMedianX] = [0,255,125]
            array2[greenPixelMedianY][greenPixelMedianX] = [0,255,125]
            if greenPixelMedianY >= 50 and greenPixelMedianX < 171:
                folderName = "left"
                
        

        wallPixelsX = []
        wallPixelsY = []
        
        wallHeights = []
        
        for i in range(256):
            foundHeight = False
            for j in range(30):
                if checkWallColor(array[65 - j][i]) == False:
                    if i == 0:
                        if checkWallColor(array[65 - j][i + 1]) == True and checkWallColor(array[65 - j - 1][i]) == True:
                            continue;
                    elif i == 255:
                        if checkWallColor(array[65 - j][i - 1]) == True and checkWallColor(array[65 - j - 1][i]) == True:
                            continue;
                    else:
                        if checkWallColor(array[65 - j][i - 1]) == True and checkWallColor(array[65 - j][i + 1]) == True and checkWallColor(array[65 - j - 1][i]) == True:
                            continue;
                    array[65 - j][i] = [0,125,255]
                    array2[65 - j][i] = [0,125,255]
                    wallHeights.append(j)
                    foundHeight = True
                    break;
            if foundHeight == False:
                array[35][i] = [0,125,255]
                array2[35][i] = [0,125,255]
                wallHeights.append(30)
        for i in range(256):
            foundHeight = False
            for j in range(35):
                if checkWallColor(array[65 + j][i]) == False:
                    if i == 0:
                        if checkWallColor(array[65 + j][i + 1]) == True and checkWallColor(array[65 + j + 1][i]) == True:
                            continue;
                    elif i == 255:
                        if checkWallColor(array[65 + j][i - 1]) == True and checkWallColor(array[65 + j + 1][i]) == True:
                            continue;
                    else:
                        if checkWallColor(array[65 + j][i - 1]) == True and checkWallColor(array[65 + j][i + 1]) == True and checkWallColor(array[65 + j + 1][i]) == True:
                            continue;
                    array[65 + j][i] = [0,125,255]
                    array2[65 + j][i] = [0,125,255]
                    wallHeights[i] += j
                    foundHeight = True
                    break;
            if foundHeight == False:
                array[100][i] = [0,125,255]
                array2[100][i] = [0,125,255]
                wallHeights.append(35)
        for i in range(len(array) - 79):
            for j in range(len(array[i])):
                x = j
                y = i + 35
                if checkWallColor(array[y][x]):
                    array[y][x] = [0,0,255]
                    array2[y][x] = [0,0,255]
                    wallPixelsX.append(x)
                    wallPixelsY.append(y)
        
        wallHeightMedian = round(statistics.median(wallHeights))
        
        if folderName == "straight" and wallHeightMedian > 35:
            folderName = "left"

        image2 = Image.fromarray(array2)
        image2.save("C:\\Users\\guliz\\Documents\\images\\" + folderName + "\\" + images)
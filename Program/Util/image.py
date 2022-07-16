from PIL import Image
import numpy
import math

apple = Image.open("apple.png")
array = numpy.array(apple)
for i in range(len(array)):
    for j in range(len(array[i])):
        if array[i][j][0] > 150:
            array[i][j] = [0,min(255,10 * array[i][j][1]),min(255,10 * array[i][j][2]),255]

apple2 = Image.fromarray(array)
apple2.show()
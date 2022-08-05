from jetcam.csi_camera import CSICamera
import cv2
from threading import Thread
from IO import io
import base64
import time

# camera module for capturing input data

camera = CSICamera(width=272, height=154, capture_width=3264, capture_height=1848, capture_fps=28)
running = False
currentImage = [[[]]]
thread = None

def start():
    global running, camera, thread
    if running == False:
        camera.running = True
        running = True
        def __capture():
            try:
                global running, camera, currentImage
                # update loop that constantly updates the most recent image which can be read at any time
                while running:
                    start = time.time()
                    currentImage = camera.value
                    time.sleep(max(0.0125-(time.time()-start), 0))
            except Exception as err:
                print(err)
                io.error()
        thread = Thread(target = __capture)
        thread.start()

def stop():
    global running, camera, thread
    if running == True:
        running = False
        thread.join()
        camera.running = False

# read current image
def read():
    global currentImage
    return currentImage

# single image save
def capture(filter = None, server = None, drive = None):
    global currentImage
    try:
        name = str(round(time.time()*1000))
        if filter != None:
            filteredImg = filter.filter(currentImage)
            cv2.imwrite('filtered_out/' + name + '.png', filteredImg)
            if server != None:
                server.broadcast('message', 'Captured (filtered) ' + name + '.png')
                encoded = base64.b64encode(cv2.imencode('.png', filteredImg)[1]).decode()
                server.broadcast('capture', encoded)
        else:
            cv2.imwrite('image_out/' + name + '.png', currentImage)
            if server != None:
                server.broadcast('message', 'Captured ' + name + '.png')
                encoded = base64.b64encode(cv2.imencode('.png', currentImage)[1]).decode()
                server.broadcast('capture', encoded)
        if drive != None:
            fd = open('./steering_vals/' + name + '.txt', 'w')
            fd.write(name + ' ' + str(drive.currentSteering()))
            fd.close()
        return currentImage
    except Exception as err:
        print(err)
        io.error()

# save a stream of images at 10 fps
streamThread = None
streaming = False
saveFd = None
totalCaptured = 0
def startSaveStream(filter = None, server = None, drive = None):
    global streamThread, saveFd, streaming
    if streaming == False:
        streaming = True
        if drive != None:
            saveFd = open('./steering_vals/' + str(round(time.time()*1000)) + '.txt', 'a')
        def loop():
            global currentImage, streaming, saveFd, totalCaptured
            try:
                while streaming:
                    start = time.time()
                    name = str(round(time.time()*1000))
                    if filter != None:
                        filteredImg = filter.filter(currentImage)
                        cv2.imwrite('filtered_out/' + name + '.png', filteredImg)
                        if server != None:
                            encoded = base64.b64encode(cv2.imencode('.png', filteredImg)[1]).decode()
                            server.broadcast('capture', encoded)
                    else:
                        cv2.imwrite('image_out/' + name + '.png', currentImage)
                        if server != None:
                            encoded = base64.b64encode(cv2.imencode('.png', currentImage)[1]).decode()
                            server.broadcast('capture', encoded)
                    totalCaptured += 1
                    if saveFd != None:
                        saveFd.write(name + ' ' + str(drive.currentSteering()) + '\n')
                    time.sleep(max(0.1-(time.time()-start), 0))
            except Exception as err:
                print(err)
                saveFd.close()
                saveFd = None
        streamThread = Thread(target = loop)
        streamThread.start()
        if server != None:
            server.broadcast('message', 'Began save stream')
        return True
    return False
def stopSaveStream(server = None):
    global streamThread, streaming, saveFd, totalCaptured
    if streaming == True:
        streaming = False
        streamThread.join()
        if server != None:
            server.broadcast('message', 'Ended save stream:<br>&emsp;Saved ' + str(totalCaptured) + ' images')
        if saveFd != None:
            saveFd.close()
            saveFd = None
        totalCaptured = 0
        return True
    return False
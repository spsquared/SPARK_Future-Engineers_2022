from jetcam.csi_camera import CSICamera
import cv2
from threading import Thread
from IO import io
import time

camera = CSICamera(width=320, height=180, capture_width=1280, capture_height=720, capture_fps=120)
running = False
currentImage = "hi"
thread = None

def start():
    global running, camera, thread
    camera.running = True
    running = True
    def __capture():
        try:
            global running, camera, currentImage
            while running:
                start = time.time()
                currentImage = camera.value
                time.sleep(max(0.0125-(time.time()-start), 0))
        except:
            io.error()
    thread = Thread(target = __capture)
    thread.start()

def stop():
    global running, camera, thread
    running = False
    thread.join()
    camera.running = False

def capture(server = None):
    global currentImage
    try:
        name = str(round(time.time()*1000))
        cv2.imwrite('image_out/' + name + '.png', currentImage)
        if server != None:
            server.broadcast('message', 'Captured ' + name + '.png')
            # server.broadcast('capture', currentImage.tolist())
        return currentImage
    except:
        io.error()

streamThread = None
streaming = False
totalCaptured = 0
def startSaveStream(server = None):
    global streamThread, streaming
    if streaming == False:
        streaming = True
        def loop():
            try:
                global currentImage, streaming, totalCaptured
                while streaming:
                    start = time.time()
                    name = str(round(time.time()*1000))
                    cv2.imwrite('image_out/' + name + '.png', currentImage)
                    totalCaptured += 1
                    time.sleep(max(0.1-(time.time()-start), 0))
            except:
                io.error()
            streamThread = Thread(target = loop)
            streamThread.start()
        if server != None:
            server.broadcast('message', 'Began save stream')
        return True
    return False
def stopSaveStream(server = None):
    global streamThread, streaming, totalCaptured
    if streaming == True:
        streaming = False
        streamThread.join()
        totalCaptured = 0
        if server != None:
            server.broadcast('message', 'Ended save stream')
        return True
    return False
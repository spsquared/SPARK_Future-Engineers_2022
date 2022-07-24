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
        global running, camera, currentImage
        while running:
            start = time.time()
            currentImage = camera.value
            time.sleep(max(0.0125-(time.time()-start), 0))
    try:
        thread = Thread(target = __capture)
        thread.start()
    except:
        io.error()

def stop():
    global running, camera, thread
    running = False
    thread.join()
    camera.release()

index = 0
def capture(server):
    global currentImage, index
    # try:
    cv2.imwrite('image_out/' + str(index) + '.png', currentImage)
    index += 1
    # if server != None:
    #     server.broadcast('capture', currentImage.tolist())
    return currentImage
    # except:
    #     io.error()

streamThread = None
streaming = False
def beginSaveStream():
    global streamThread, streaming
    if streaming == False:
        def loop():
            global currentImage, index, streaming
            while streaming:
                start = time.time()
                cv2.imwrite('image_out/' + str(index) + '.png', currentImage)
                index += 1
                time.sleep(max(0.05-(time.time()-start), 0))
        try:
            streamThread = Thread(target = loop)
            streamThread.start()
        except:
            io.error()
        return True
    return False
def endSaveStream():
    global streamThread, streaming
    if streaming == True:
        streaming = False
        streamThread.join()
        return True
    return False
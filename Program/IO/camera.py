from jetcam.csi_camera import CSICamera
import cv2
from threading import Thread
from IO import io
import time

camera = CSICamera(width=320, height=180, capture_width=1280, capture_height=720, capture_fps=120)
running = False
currentImage = [[]]
thread = None

def start():
    global running, camera, thread
    camera.running = True
    running = True
    def __capture():
        global running, camera, currentImage
        while running:
            currentImage = camera.value
    try:
        thread = Thread(target = __capture)
        thread.start()
    except KeyboardInterrupt:
        camera.release()
        return
    except:
        io.error()

def stop():
    global running, camera, thread
    running = False
    thread.join()
    camera.release()

index = 0
def capture():
    global currentImage, index
    try:
        cv2.imwrite('../image_out/' + index + '.png')
        index += 1
        return currentImage
    except:
        io.error()

streamThread = None
streaming = False
def beginSaveStream():
    global streamThread, streaming
    if streaming == False:
        def loop():
            global currentImage, index, streaming
            while streaming:
                cv2.imwrite('../image_out/' + index + '.png')
                index += 1
        try:
            streamThread = Thread(target = loop)
            streamThread.start()
        except KeyboardInterrupt:
            return
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
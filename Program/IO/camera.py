from jetcam.csi_camera import CSICamera
from PIL import Image
from threading import Thread
import io
import time

__camera = CSICamera(width=320, height=180, capture_width=1280, capture_height=720, capture_fps=120)
__running = False
__currentImage = [[]]
__thread = None

def start():
    global __running, __camera, __thread
    __camera.running = True
    __running = True
    def __capture():
        global __running, __camera, __currentImage
        while __running:
            __currentImage = __camera.value
    try:
        __thread = Thread(target = __capture)
        __thread.start()
    except KeyboardInterrupt:
        __camera.release()
        return
    except:
        io.error()

def stop():
    global __running, __camera, __thread
    __running = False
    __thread.join()
    __camera.release()

__index = 0
def capture():
    global __currentImage, __index
    img = Image.fromarray(__currentImage)
    img.save('./image_out/' + str(__index) + '.png')
    __index += 1
    return img

__streamThread = None
def beginSaveStream():
    global __streamThread
    if __streamThread != None:
        def loop():
            global __currentImage, __index
            while True:
                img = Image.fromarray(__currentImage)
                img.save('./image_out/' + str(__index) + '.png')
        try:
            __streamThread = Thread(target = loop)
            __streamThread.start()
        except KeyboardInterrupt:
            return
from jetcam.csi_camera import CSICamera
from PIL import Image
from threading import Thread
import time

__camera = CSICamera(width=1280, height=720, capture_width=1280, capture_height=720, capture_fps=30)
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
        return

def stop():
    global __running, __thread
    __running = False
    __thread.join()

__index = 0
def capture():
    global __currentImage, __index
    img = Image.fromarray(__currentImage)
    img.save('./../image_out/' + str(__index) + '.png')
    __index += 1
    return img
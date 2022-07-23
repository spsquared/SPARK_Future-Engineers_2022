from jetcam.csi_camera import CSICamera
import time
from PIL import Image
import datetime

camera = CSICamera(width=1080, height=720, capture_width=1080, capture_height=720, capture_fps=30)
camera.running = True

index = 1

while True:
    array = camera.value
    image = Image.fromarray(array)
    image.save('./../images/' + str(index) + ' ' + str(datetime.datetime.now()) + '.png')
    # time.sleep(0.02)
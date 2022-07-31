from IO import io
io.setup()
from IO import drive
from IO import camera
from CV import filter
import time

def main():
    try:
        drive.start()
        camera.start()
        drive.throttle(100)
        while True:
            drive.steer(filter.predict(camera.read()))
        #code here
    except KeyboardInterrupt:
        camera.stop()
        drive.stop()
        io.close()
    except Exception as err:
        print(err)
from IO import io
io.setup()
from IO import drive
from IO import camera
from Util import server
from CV import filter
import time

def main():
    try:
        drive.start()
        camera.start()
        time.sleep(1)
        drive.throttle(90)
        while True:
            image = camera.read()
            prediction = filter.predict(image,server)
            drive.steer(prediction)
            print("Current Prediction: " + str(prediction))
        #code here
    except KeyboardInterrupt:
        camera.stop()
        drive.stop()
        io.close()
    except Exception as err:
        print(err)
        io.error()

if __name__ == '__main__':
    main()
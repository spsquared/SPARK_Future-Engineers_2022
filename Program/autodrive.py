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
        time.sleep(1)
        drive.throttle(100)
        while True:
            image = camera.read()
            prediction = filter.predict(image)
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
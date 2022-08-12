from IO import io
io.setup()
from IO import drive
from IO import camera
from Util import server
from AI import filter
import time

running = True
def main():
    global running
    try:
        drive.start()
        camera.start()
        time.sleep(1)
        def stop(data):
            global running
            running = False
            camera.stop()
            drive.stop()
            io.close()
        server.addListener('stop', stop)
        drive.throttle(90)
        while running:
            image = camera.read()
            prediction = filter.predict(image,server)
            drive.steer(prediction)
            # print("Current Prediction: " + str(prediction))
        #code here
        print("stopped by emergency stop button")
    except KeyboardInterrupt:
        camera.stop()
        drive.stop()
        io.close()
    except Exception as err:
        print(err)
        io.error()

if __name__ == '__main__':
    main()
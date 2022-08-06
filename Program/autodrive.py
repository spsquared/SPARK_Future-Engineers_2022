from IO import io
io.setup()
from IO import drive
from IO import camera
from Util import server
from CV import filter
import time

running = True
def main():
    global running
    try:
        drive.start()
        camera.start()
        camera.startSaveStream(filter, server, drive)
        time.sleep(1)
        def stop(data):
            global running
            running = False
            camera.stopSaveStream(server)
            camera.stop()
            drive.stop()
            io.close()
        server.addListener('stop', stop)
        drive.throttle(100)
        while running:
            image = camera.read()
            prediction = filter.predict(image,server)
            drive.steer(prediction)
            # print("Current Prediction: " + str(prediction))
        #code here
        print("stopped by emergency stop button")
    except KeyboardInterrupt:
        camera.stopSaveStream(server)
        camera.stop()
        drive.stop()
        io.close()
    except Exception as err:
        print(err)
        io.error()

if __name__ == '__main__':
    main()
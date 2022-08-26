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
            print('stopped by emergency stop button')
            exit(0)
        def stop2(data):
            global running
            running = False
            camera.stop()
            drive.stop()
            io.close()
            print('stopped by 3 laps')
            exit(0)
        server.addListener('stop', stop)
        drive.throttle(30)
        while running:
            image = camera.read()
            prediction = filter.predict(image,server)
            if prediction == "stop":
                drive.throttle(-100)
                time.sleep(0.2)
                stop2(1)
                break
            drive.steer(prediction)
            # print("Current Prediction: " + str(prediction))
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
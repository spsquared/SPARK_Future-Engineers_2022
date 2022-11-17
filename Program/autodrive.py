from IO import io
io.setup()
from IO import drive
from IO import camera
from Util import server
from AI import filter
import time
import sys

running = True
def main():
    global running
    try:
        infinite = False
        wait = False
        openServer = True
        for i, arg in enumerate(sys.argv):
            if i != 0:
                if arg == 'infinite':
                    infinite = True
                if arg == 'wait_for_button':
                    wait = False
                    #change back to true
                if arg == 'no_server':
                    openServer = False
        if infinite:
            print('PROGRAM RUNNING IN INFINITE MODE!')
        if openServer:
            server.open()
        print("start")
        # time.sleep(10)
        # print("10 seconds")
        drive.start()
        camera.start()
        print("started")
        if wait:
            print('Waiting for button')
            io.waitForButton()
        else:
            time.sleep(1)
        print("after button")
        def stop(data):
            global running
            running = False
            camera.stop()
            server.close()
            drive.stop()
            io.close()
            print('stopped by emergency stop button')
            exit(0)
        def stop2(data):
            global running
            running = False
            camera.stop()
            server.close()
            drive.stop()
            io.close()
            print('stopped by 3 laps')
            exit(0)
        server.addListener('stop', stop)
        drive.throttle(50)
        while running:
            image = camera.read()
            prediction = filter.predict(image,server, infinite)
            if prediction == "stop":
                drive.throttle(-100)
                drive.steer(0)
                time.sleep(0.2)
                drive.throttle(0)
                stop2(1)
                break
            drive.steer(prediction)
            # print("Current Prediction: " + str(prediction))
        #code here
    except KeyboardInterrupt:
        camera.stop()
        drive.stop()
        io.close()
    # except Exception as err:
    #     print(err)
    #     io.error()

if __name__ == '__main__':
    main()
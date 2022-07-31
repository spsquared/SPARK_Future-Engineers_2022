from IO import io
io.setup()
from IO import drive
from IO import camera
from Util import server
from CV import filter
import cv2
import base64
import time

__forward = 0
__backward = 0
__left = 0
__right = 0
def main():
    try:
        drive.start()
        camera.start()
        def keys(data):
            global __forward, __backward, __left, __right
            key = data['key']
            if key == 'w':
                __forward = 100
            elif key == 'W':
                __forward = 0
            elif key == 's':
                __backward = -100
            elif key == 'S':
                __backward = 0
            elif key == 'a':
                __left = -100
            elif key == 'A':
                __left = 0
            elif key == 'd':
                __right = 100
            elif key == 'D':
                __right = 0
            drive.throttle(__forward+__backward)
            drive.steer(__left+__right)
        def joystick(data):
            drive.throttle(data['throttle'])
            drive.steer(data['steering'])
        def capture(data):
            image = camera.capture(server, drive)
            encoded = base64.b64encode(image).decode()
            server.broadcast('capture', encoded)
        def captureStream(data):
            # filter.predict(camera.capture(server))
            if data['state'] == True:
                camera.startSaveStream(server, drive)
            else:
                camera.stopSaveStream(server)
        def capturefilter(data):
            filter.setColors(data)
            image = filter.filter(camera.read())
            name = str(round(time.time()*1000))
            cv2.imwrite('image_filtered/' + name + '.png', image)
            server.broadcast('message', 'Captured (filtered) ' + name + '.png')
            encoded = base64.b64encode(image).decode()
            server.broadcast('capture', encoded)
        def colors(data):
            filter.setColors(data)
        server.addListener('key', keys)
        server.addListener('joystick', joystick)
        server.addListener('capture', capture)
        server.addListener('captureStream', captureStream)
        server.addListener('colors', colors)
        server.addListener('captureFilter', capturefilter)
        try:
            while True:
                msg = input()
                if msg == 'reset':
                    server.broadcast('colors', filter.getColors())
                    print(filter.getColors())
                elif msg != '':
                    server.broadcast('message', msg)
        except KeyboardInterrupt:
            True
        except:
            io.error()
    except KeyboardInterrupt:
        server.close()
        camera.stop()
        drive.stop()
        io.close()
    except Exception as err:
        print(err)

if __name__ == '__main__':
    main()
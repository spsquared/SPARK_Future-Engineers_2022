import asyncio
from IO import io
from IO import drive
from IO import camera
from Util import server

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
            camera.capture()
            return
        server.addListener('key', keys)
        server.addListener('joystick', joystick)
        server.addListener('capture', capture)
        # while (True):
        #     msg = input()
        #     server.broadcast(msg)
    except KeyboardInterrupt:
        server.close()
        drive.stop()
        camera.stop()
        io.close()

if __name__ == '__main__':
    main()
from IO import io
io.setup()
from IO import drive
from IO import camera
from Util import server
from CV import filter
import base64

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
            image = camera.capture(server=server, drive=drive)
            encoded = base64.b64encode(image).decode()
            server.broadcast('capture', encoded)
        def captureStream(data):
            if data['state'] == True:
                camera.startSaveStream(server=server, drive=drive)
            else:
                camera.stopSaveStream(server)
        def captureFilter(data):
            filter.setColors(data)
            image = camera.capture(filter=filter, server=server, drive=drive)
            encoded = base64.b64encode(image).decode()
            server.broadcast('capture', encoded)
        def captureFilterStream(data):
            if data['state'] == True:
                camera.startSaveStream(filter=filter, server=server, drive=drive)
            else:
                camera.stopSaveStream(server)
        def colors(data):
            filter.setColors(data)
        server.addListener('key', keys)
        server.addListener('joystick', joystick)
        server.addListener('capture', capture)
        server.addListener('captureStream', captureStream)
        server.addListener('colors', colors)
        server.addListener('captureFilter', captureFilter)
        server.addListener('captureFilterStream', captureFilterStream)
        running = True
        def stop():
            running = False
            server.close()
            camera.stop()
            drive.stop()
            io.close()
        try:
            while running:
                msg = input()
                if msg == 'reset':
                    server.broadcast('colors', filter.getColors())
                    print(filter.getColors())
                elif msg != '':
                    server.broadcast('message', msg)
        except KeyboardInterrupt:
            server.close()
            camera.stop()
            drive.stop()
            io.close()
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
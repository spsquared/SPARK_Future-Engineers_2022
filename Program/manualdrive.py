from IO import io
io.setup()
from IO import drive
from IO import camera
from Util import server
from CV import filter
from threading import Thread
import cv2
import time
import base64

__forward = 0
__backward = 0
__left = 0
__right = 0
running = True
streamThread = None
streamThread2 = None
streaming = False
streaming2 = False
def main():
    global running
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
            camera.capture(server=server, drive=drive)
        def captureStream(data):
            if data['state'] == True:
                camera.startSaveStream(server=server, drive=drive)
            else:
                camera.stopSaveStream(server)
        def captureFilter(data):
            filter.setColors(data)
            camera.capture(filter=filter, server=server, drive=drive)
        def captureFilterStream(data):
            if data['state'] == True:
                camera.startSaveStream(filter=filter, server=server, drive=drive)
            else:
                camera.stopSaveStream(server)
        def stream(data):
            global streamThread, streaming
            if data['state'] == True:
                if streaming == False:
                    streaming = True
                    def loop():
                        global streaming, running
                        try:
                            while streaming and running:
                                start = time.time()
                                encoded = base64.b64encode(cv2.imencode('.png', camera.read())[1]).decode()
                                server.broadcast('capture', encoded)
                                time.sleep(max(0.05-(time.time()-start), 0))
                        except Exception as err:
                            print(err)
                    streamThread = Thread(target = loop)
                    streamThread.start()
                    server.broadcast('message', 'Began stream')
            else:
                if streaming == True:
                    streaming = False
                    streamThread.join()
                    server.broadcast('message', 'Ended stream')
        def filterstream(data):
            global streamThread2, streaming2
            if data['state'] == True:
                if streaming2 == False:
                    streaming2 = True
                    def loop():
                        global streaming2, running
                        try:
                            while streaming2 and running:
                                start = time.time()
                                encoded = base64.b64encode(cv2.imencode('.png', filter.filter(camera.read()))[1]).decode()
                                server.broadcast('capture', encoded)
                                time.sleep(max(0.05-(time.time()-start), 0))
                        except Exception as err:
                            print(err)
                    streamThread2 = Thread(target = loop)
                    streamThread2.start()
                    server.broadcast('message', 'Began stream')
            else:
                if streaming2 == True:
                    streaming2 = False
                    streamThread2.join()
                    server.broadcast('message', 'Ended stream')
        def colors(data):
            filter.setColors(data)
        server.addListener('key', keys)
        server.addListener('joystick', joystick)
        server.addListener('capture', capture)
        server.addListener('captureStream', captureStream)
        server.addListener('colors', colors)
        server.addListener('captureFilter', captureFilter)
        server.addListener('captureFilterStream', captureFilterStream)
        server.addListener('stream', stream)
        server.addListener('filterstream', filterstream)
        global running
        running = True
        def stop(data):
            global running
            running = False
            server.close()
            camera.stop()
            drive.stop()
            io.close()
            exit(0)
        server.addListener('stop', stop)
        while running:
            msg = input()
            if msg == 'reset':
                server.broadcast('colors', filter.getColors())
                print(filter.getColors())
            elif msg != '':
                server.broadcast('message', msg)
    except KeyboardInterrupt:
        print('\nSTOPPING PROGRAM. DO NOT INTERRUPT.')
        running = False
        server.close()
        camera.stop()
        drive.stop()
        io.close()
    except Exception as err:
        print(err)
        io.error()

if __name__ == '__main__':
    main()
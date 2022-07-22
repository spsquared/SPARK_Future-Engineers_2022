from IO import io
from IO import drive
from Util import server

def main():
    try:
        drive.start()
        def control(data):
            forward = 0
            left = 0
            right = 0
            key = data['key']
            if (key == 'w'):
                forward = 20
            elif (key == 'W'):
                forward = 0
            elif (key == 'a'):
                left = -100
            elif (key == 'A'):
                left = 0
            elif (key == 'd'):
                right = 100
            elif (key == 'D'):
                right = 0
            drive.throttle(forward)
            drive.steer(left+right)
            print(forward)
        server.addCallback('key', control)
    except KeyboardInterrupt:
        server.close()
        drive.stop()
        io.close()

if __name__ == '__main__':
    main()
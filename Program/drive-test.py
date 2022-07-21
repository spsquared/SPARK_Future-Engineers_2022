from IO import io
from IO import drive

def main():
    try:
        drive.start()
        print('w = throttle up')
        print('s = throttle down')
        print('a = steer left')
        print('d = steer right')
        print('x = reset steering')
        steering = 0
        throttle = 0
        while True:
            letter = input('')
            if (letter == 'w'):
                throttle += 10
            elif (letter == 's'):
                throttle -= 10
            elif (letter == 'a'):
                steering -= 10
            elif (letter == 'd'):
                steering += 10
            elif (letter == 'x'):
                steering = 0
            print('throttle:', throttle, 'steering:', steering)
            drive.throttle(throttle)
            drive.steer(steering)
    except KeyboardInterrupt:
        drive.stop()
        io.close()

if __name__ == '__main__':
    main()
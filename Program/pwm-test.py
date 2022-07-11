import Jetson.GPIO as GPIO
import time

def main():
    # setup
    GPIO.setwarnings(False)
    GPIO.cleanup()
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup([12, 13], GPIO.OUT)

    try:
        t = GPIO.PWM(12, 50)
        s = GPIO.PWM(13, 50)
        throttle = 0
        thrT = 1
        steering = 0
        steT = 2
        t.start(throttle)
        s.start(steering)
        while True:
            time.sleep(0.05)
            if throttle <= 0:
                thrT = 1
            elif throttle >= 100:
                thrT = -1
            if steering <= 0:
                steT = 2
            elif steering >= 100:
                steT = -2
            throttle += thrT
            steering += steT
            t.ChangeDutyCycle(throttle)
            s.ChangeDutyCycle(steering)
            print(throttle, steering)
    finally:
        t.stop()
        s.stop()
        GPIO.cleanup()

if __name__ == '__main__':
    main()
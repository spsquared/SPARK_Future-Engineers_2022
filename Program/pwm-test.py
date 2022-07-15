import Jetson.GPIO as GPIO
import time
from IO import drive

def main():
    # setup
    # GPIO.setwarnings(False)
    # GPIO.cleanup()
    # GPIO.setmode(GPIO.BOARD)
    # GPIO.setup([32, 33], GPIO.OUT)

    try:
        # t = GPIO.PWM(32, 200)
        # s = GPIO.PWM(33, 200)
        throttle = 0
        thrT = 1
        steering = 0
        steT = 2
        # below 30 is backwards until 15
        # thrMAX = 32
        # thrMIN = 30
        # strMAX = 45
        # strMIN = 30
        # t.start((throttle/100)*(thrMAX-thrMIN)+thrMIN)
        # s.start((steering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2))
        drive.start()
        while True:
            time.sleep(0.02)
            if throttle <= 0:
                thrT = 1
            elif throttle >= 100:
                thrT = -1
            if steering <= -100:
                steT = 1
            elif steering >= 100:
                steT = -1
            throttle += thrT
            steering += steT
            throttle = int(input("throttle: "))
            drive.throttle(throttle)
            # drive.steer(steering)
            # print(throttle, steering)
            # t.ChangeDutyCycle((throttle/100)*(thrMAX-thrMIN)+thrMIN)
            # print(throttle, (throttle/100)*(thrMAX-thrMIN)+thrMIN)
            # # s.ChangeDutyCycle((steering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2))
            # # print(steering, (steering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2))
    finally:
        drive.stop()
        # t.stop()
        # s.stop()
        # GPIO.cleanup()

if __name__ == '__main__':
    main()
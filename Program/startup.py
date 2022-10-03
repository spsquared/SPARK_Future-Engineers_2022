import Jetson.GPIO as GPIO
import time
import os

if __name__ == '__main__':
    GPIO.setwarnings(False)
    GPIO.cleanup()
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup([11, 13], GPIO.OUT)
    GPIO.output([11, 13], GPIO.LOW)

    # in competition, wait for button press
    fd = open('./run_on_startup.txt', 'r')
    run_startup = fd.readlines()[0]
    if run_startup == 'true':
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(18, GPIO.IN)
        GPIO.wait_for_edge(18, GPIO.RISING)
        GPIO.wait_for_edge(18, GPIO.FALLING)
        GPIO.cleanup()
        os.system('python3 autodrive.py')
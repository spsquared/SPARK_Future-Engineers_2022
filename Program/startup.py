import Jetson.GPIO as GPIO
import time

if __name__ == '__main__':
    GPIO.setwarnings(False)
    GPIO.cleanup()
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup([11, 13], GPIO.OUT)
    GPIO.output([11, 13], GPIO.LOW)
    time.sleep(1000)
    GPIO.cleanup()

    # in competition, wait for button press
    fd = open('./run_on_startup.txt', 'r')
    run_startup = fd.readlines()[0]
    if run_startup == 'true':
        GPIO.setup(15, GPIO.IN)
        GPIO.wait_for_edge(15, GPIO.RISING)
        GPIO.wait_for_edge(15, GPIO.FALLING)
import Jetson.GPIO as GPIO
import time
import os

path = '/home/nano/Documents/SPARK_FutureEngineers_2022/'

if __name__ == '__main__':
    print("test")
    GPIO.setwarnings(False)
    GPIO.cleanup()
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup([11, 13], GPIO.OUT)
    GPIO.output([11, 13], GPIO.LOW)

    # in competition, wait for button press
    fd = open(path + 'run_on_startup.txt', 'r')
    run_startup = fd.readlines()[0]
    if run_startup == 'true\n':
        print('Run-on-startup enabled!')
        GPIO.output(11, GPIO.HIGH)
        GPIO.setup(18, GPIO.IN)
        GPIO.wait_for_edge(18, GPIO.RISING)
        GPIO.output(11, GPIO.LOW)
        time.sleep(0.5)
        GPIO.cleanup()
        print('Button pressed - starting!')
        # no_server
        os.system('python3 ' + path + 'autodrive.py wait_for_button')
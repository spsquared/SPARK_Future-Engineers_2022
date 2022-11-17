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
    fd = open('/home/nano/Documents/SPARK_Future_Engineers_2022/run_on_startup.txt', 'r')
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
        os.system('python3 autodrive.py wait_for_button no_server')
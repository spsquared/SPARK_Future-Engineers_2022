import Jetson.GPIO as GPIO
from threading import Thread
import time

def setup():
    GPIO.setwarnings(False)
    GPIO.cleanup()
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup(13, GPIO.OUT)
    GPIO.output(13, GPIO.LOW)

__errorRunning = False
def error():
    global __errorRunning
    if __errorRunning == False:
        __errorRunning = True
        def blink():
            while True:
                GPIO.output(13, GPIO.HIGH)
                time.sleep(0.5)
                GPIO.output(13, GPIO.LOW)
                time.sleep(0.5)
        try:
            thread = Thread(target = blink)
            thread.start()
        except KeyboardInterrupt:
            return

def close():
    GPIO.cleanup()
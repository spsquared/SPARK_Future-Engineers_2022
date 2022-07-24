import Jetson.GPIO as GPIO
from threading import Thread
import time

finInit = False
def setup():
    global finInit
    if finInit == False:
        GPIO.setwarnings(False)
        GPIO.cleanup()
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup([11, 13], GPIO.OUT)
        GPIO.output([11, 13], GPIO.LOW)
        def blink():
            while True:
                GPIO.output(11, GPIO.HIGH)
                time.sleep(0.5)
                GPIO.output(11, GPIO.LOW)
                time.sleep(0.5)
        try:
            thread = Thread(target = blink)
            thread.start()
        except:
            error()
        return True
    return False

errorRunning = False
def error():
    global errorRunning
    if errorRunning == False:
        errorRunning = True
        def blink():
            while True:
                GPIO.output(13, GPIO.HIGH)
                time.sleep(0.05)
                GPIO.output(13, GPIO.LOW)
                time.sleep(0.1)
                GPIO.output(13, GPIO.HIGH)
                time.sleep(0.05)
                GPIO.output(13, GPIO.LOW)
                time.sleep(0.55)
        thread = Thread(target = blink)
        thread.start()
        return True
    return False

def close():
    GPIO.cleanup()
    return True
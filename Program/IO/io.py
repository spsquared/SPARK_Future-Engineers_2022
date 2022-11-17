import Jetson.GPIO as GPIO
from threading import Thread
import time

# general io module

path = '/home/nano/Documents/SPARK_FutureEngineers_2022/'

running = False
thread = None
def setup():
    global running, thread, path
    if running == False:
        running = True
        fd = open(path + '../lock.txt', 'w+')
        if fd.read() == '1':
            error()
            raise Exception('ERROR: SETUP HAS DETECTED THAT SETUP IS CURRENTLY RUNNING. PLEASE CLOSE SETUP TO CONTINUE')
        fd.write('1')
        fd.close()
        GPIO.setwarnings(False)
        GPIO.cleanup()
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup([11, 13, 32, 33], GPIO.OUT)
        GPIO.setup(18, GPIO.IN)
        GPIO.output([11, 13], GPIO.LOW)
        # IO active indicator
        def blink():
            global running
            while running:
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

def close():
    global thread, running, path
    if running == True:
        fd = open(path + '../lock.txt', 'w+')
        fd.write('0')
        fd.close()
        running = False
        thread.join()
        GPIO.output([11, 13], GPIO.LOW)
        time.sleep(0.1)
        GPIO.cleanup()
        return True
    return False

# button wait
def waitForButton():
    GPIO.wait_for_edge(18, GPIO.RISING)

# error indicator
errorRunning = False
def error():
    global errorRunning
    if errorRunning == False:
        errorRunning = True
        def blink():
            while True:
                GPIO.output(13, GPIO.HIGH)
                time.sleep(0.1)
                GPIO.output(13, GPIO.LOW)
                time.sleep(0.1)
                GPIO.output(13, GPIO.HIGH)
                time.sleep(0.1)
                GPIO.output(13, GPIO.LOW)
                time.sleep(0.45)
        thread = Thread(target = blink)
        thread.start()
        return True
    return False
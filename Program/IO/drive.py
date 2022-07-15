import Jetson.GPIO as GPIO
from threading import Thread
import time

# setup
GPIO.setwarnings(False)
GPIO.cleanup()
GPIO.setmode(GPIO.BOARD)
GPIO.setup([32, 33], GPIO.OUT)
t = GPIO.PWM(32, 200)
s = GPIO.PWM(33, 200)

# pwm min max and speed
thrMIN = 30
thrMAX = 35
strMAX = 45
strMIN = 30
strTRIM = 12
targetThrottle = 0
targetSteering = 0
currThrottle = 0
currSteering = 0
thrAcceleration = 1
strAcceleration = 10
running = True
controlThread = None

def trim(trim):
    global strTRIM
    strTRIM = trim

def start():
    t.start(thrMIN)
    s.start((strMIN+strMAX)/2)
    def loop():
        global running
        while running:
            time.sleep(0.01)
            currThrottle = targetThrottle
            currSteering = targetSteering
            t.ChangeDutyCycle((currThrottle/100)*(thrMAX-thrMIN)+thrMIN)
            s.ChangeDutyCycle((currSteering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2)+(strTRIM/10))
    global controlThread
    controlThread = Thread(target = loop)
    controlThread.start()

def stop():
    global running
    running = False
    controlThread.join()
    t.ChangeDutyCycle(0)
    s.ChangeDutyCycle(0)
    t.stop()
    s.stop()
    GPIO.cleanup()

def steer(steering):
    global targetSteering
    targetSteering = -steering

def throttle(throttle):
    global targetThrottle
    targetThrottle = throttle
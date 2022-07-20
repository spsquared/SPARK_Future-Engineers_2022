import Jetson.GPIO as GPIO
from threading import Thread
import time

# setup
GPIO.setup([5, 32, 33], GPIO.OUT)
t = GPIO.PWM(32, 200)
s = GPIO.PWM(33, 200)

# pwm min max and speed
thrMIN = 30
thrMAX = 35
strMAX = 45
strMIN = 30
strTRIM = 8
targetThrottle = 0
targetSteering = 0
currThrottle = 0
currSteering = 0
thrAcceleration = 1
strAcceleration = 10
running = True
blinkThread = None
controlThread = None

def trim(trim):
    global strTRIM
    strTRIM = trim

def start():
    t.start(thrMIN)
    s.start((strMIN+strMAX)/2)
    # def loop():
    #     global running
    #     while running:
    #         time.sleep(0.01)
    #         # possibly add smoothing if neccessary
    #         currThrottle = targetThrottle
    #         currSteering = targetSteering
    #         t.ChangeDutyCycle((currThrottle/100)*(thrMAX-thrMIN)+thrMIN)
    #         s.ChangeDutyCycle((currSteering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2)+(strTRIM/10))
    # global controlThread
    # controlThread = Thread(target = loop)
    def blink():
        global running
        while running:
            GPIO.output(5, GPIO.HIGH)
            time.sleep(0.5)
            GPIO.output(5, GPIO.LOW)
            time.sleep(0.5)
    global blinkThread
    blinkThread = Thread(target = blink)
    # controlThread.start()
    blinkThread.start()

def stop():
    global running
    running = False
    # controlThread.join()
    blinkThread.join()
    t.ChangeDutyCycle(0)
    s.ChangeDutyCycle(0)
    t.stop()
    s.stop()

def steer(steering):
    global targetSteering
    targetSteering = max(-100, min(-steering, 100))
    s.ChangeDutyCycle((targetSteering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2)+(strTRIM/10))

def throttle(throttle):
    global targetThrottle
    targetThrottle = max(0, min(throttle, 100))
    t.ChangeDutyCycle((targetThrottle/100)*(thrMAX-thrMIN)+thrMIN)
import Jetson.GPIO as GPIO
from threading import Thread
from IO import io
import math
import time

# setup
GPIO.setup([11, 32, 33], GPIO.OUT)
t = GPIO.PWM(32, 200)
s = GPIO.PWM(33, 200)

# pwm min max and speed
thrBACK = 28
thrMIN = 30
thrMAX = 31
strMAX = 47
strMIN = 28
strTRIM = 8
thrFeaFREQ = 10
targetThrottle = 0
targetSteering = 0
currThrottle = 0
currSteering = 0
tickrate = 200
thrAcceleration = 1
strAcceleration = 10
running = False
controlThread = None

def trim(trim):
    global strTRIM
    strTRIM = trim

def start():
    global controlThread, running
    if running == False:
        running = True
        t.start(thrMIN)
        s.start((strMIN+strMAX)/2)
        def loop():
            try:
                global running, t, s, currThrottle, currSteering, targetThrottle, targetSteering, thrFeaFREQ, thrFeaACT, tickrate
                timer = 0
                while running:
                    start = time.time()
                    thrFeaACT = math.floor(abs(targetThrottle)/20)/50
                    if timer > 1: timer = 0
                    if timer <= thrFeaACT and targetThrottle > 10: currThrottle = 100
                    elif targetThrottle < -10: currThrottle = targetThrottle
                    else: currThrottle = 0
                    currSteering = targetSteering
                    if (currThrottle < 0): t.ChangeDutyCycle((currThrottle/100)*(thrMIN-thrBACK)+thrMIN)
                    else: t.ChangeDutyCycle((currThrottle/100)*(thrMAX-thrMIN)+thrMIN)
                    s.ChangeDutyCycle((currSteering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2)+(strTRIM/10))
                    timer += thrFeaFREQ/tickrate
                    time.sleep(max((1/tickrate)-(time.time()-start), 0))
            except:
                io.error()
        controlThread = Thread(target = loop)
        controlThread.start()
        return True
    return False

def stop():
    global running, controlThread
    if running == True:
        running = False
        controlThread.join()
        t.ChangeDutyCycle(0)
        s.ChangeDutyCycle(0)
        t.stop()
        s.stop()
        return True
    return False

def steer(steering):
    global targetSteering
    targetSteering = max(-100, min(-steering, 100))

def throttle(throttle):
    global targetThrottle
    targetThrottle = max(-100, min(throttle, 100))
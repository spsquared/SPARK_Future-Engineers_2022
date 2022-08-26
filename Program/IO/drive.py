import Jetson.GPIO as GPIO
from threading import Thread
from IO import io
import math
import time

# drive module for controlling throttle and steering output

# setup
t = GPIO.PWM(32, 200)
s = GPIO.PWM(33, 200)

# pwm min max and speed
thrBACK = 28
thrMIN = 30
thrMAX = 31
strMAX = 47
strMIN = 28
strTRIM = 8
# throttle feathering
thrFeaFREQ = 10
thrFeaDiv = 20
targetThrottle = 0
targetSteering = 0
currThrottle = 0
currSteering = 0
# PID control loop
tickrate = 200
strkP = 1
strkD = 0
running = False
controlThread = None

def start():
    global controlThread, running
    if running == False:
        # begin
        running = True
        t.start(thrMIN)
        s.start((strMIN+strMAX)/2)
        def loop():
            try:
                global running, t, s, currThrottle, currSteering, targetThrottle, targetSteering, thrFeaFREQ, thrFeaDiv, tickrate
                timer = 0
                while running:
                    start = time.time()
                    # convert throttle to active time
                    thrFeaACT = math.floor(abs(targetThrottle)/20)/thrFeaDiv
                    if timer > 1: timer = 0
                    if timer <= thrFeaACT and targetThrottle > 10: currThrottle = 100
                    elif targetThrottle < -10: currThrottle = targetThrottle
                    else: currThrottle = 0
                    # PID for steering (TODO)
                    currSteering = targetSteering
                    # apply throttle and steering
                    if (currThrottle < 0): t.ChangeDutyCycle((currThrottle/100)*(thrMIN-thrBACK)+thrMIN)
                    else: t.ChangeDutyCycle((currThrottle/100)*(thrMAX-thrMIN)+thrMIN)
                    s.ChangeDutyCycle((currSteering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2)+(strTRIM/10))
                    # advance timer
                    timer += thrFeaFREQ/tickrate
                    time.sleep(max((1/tickrate)-(time.time()-start), 0))
            except Exception as err:
                print(err)
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
        t.stop()
        s.stop()
        return True
    return False

# inputs
def steer(steering: int):
    global targetSteering
    targetSteering = max(-100, min(-steering, 100))

def throttle(throttle: int):
    global targetThrottle
    targetThrottle = max(-100, min(throttle, 100))

def trim(trim: int):
    global strTRIM
    strTRIM = trim

# get current
def currentSteering():
    global currSteering
    return -currSteering
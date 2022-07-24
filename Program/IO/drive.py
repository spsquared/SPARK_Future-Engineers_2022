import Jetson.GPIO as GPIO
from threading import Thread
from IO import io
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
targetThrottle = 0
targetSteering = 0
currThrottle = 0
currSteering = 0
thrAcceleration = 1
strAcceleration = 10
running = False
blinkThread = None
controlThread = None

def trim(trim):
    global strTRIM
    strTRIM = trim

def start():
    global controlThread, blinkThread
    if running == False:
        running = True
        t.start(thrMIN)
        s.start((strMIN+strMAX)/2)
        def loop():
            global running
            while running:
                time.sleep(0.02)
                # possibly add smoothing if neccessary
                currThrottle = targetThrottle
                currSteering = targetSteering
                if (currThrottle < 0): t.ChangeDutyCycle((currThrottle/100)*(thrMIN-thrBACK)+thrMIN)
                else: t.ChangeDutyCycle((currThrottle/100)*(thrMAX-thrMIN)+thrMIN)
                s.ChangeDutyCycle((currSteering/100)*((strMAX-strMIN)/2)+((strMIN+strMAX)/2)+(strTRIM/10))
        def blink():
            global running
            while running:
                GPIO.output(11, GPIO.HIGH)
                time.sleep(0.5)
                GPIO.output(11, GPIO.LOW)
                time.sleep(0.5)
        try:
            controlThread = Thread(target = loop)
            blinkThread = Thread(target = blink)
            controlThread.start()
            blinkThread.start()
        except KeyboardInterrupt:
            t.stop()
            s.stop()
        except:
            io.error()
        return True
    return False

def stop():
    global running, controlThread, blinkThread
    if running == True:
        running = False
        controlThread.join()
        blinkThread.join()
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
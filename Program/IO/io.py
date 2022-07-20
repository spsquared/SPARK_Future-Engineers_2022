import Jetson.GPIO as GPIO

def init():
    GPIO.setwarnings(False)
    GPIO.cleanup()
    GPIO.setmode(GPIO.BOARD)

def close():
    GPIO.cleanup()
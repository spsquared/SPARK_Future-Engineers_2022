import asyncio
import websockets
import json as JSON
from threading import Thread
import time

__callbacks = {}
__sendlist = []
def addListener(event, cb):
    global __callbacks
    if event in __callbacks:
        __callbacks[event].append(cb)
    else:
        __callbacks[event] = [cb]
def broadcast(data):
    global __sendlist
    for arr in __sendlist:
        arr.append(data)

__running = True
__thread = None

def close():
    global __running, __thread
    __running = False
    __thread.join()

async def __server(websocket, path):
    global __sendlist
    index = len(__sendlist)
    __sendlist.append([])
    try:
        async def recieve():
            global __callbacks, __running
            while (__running):
                json = await websocket.recv()
                res = JSON.loads(json)
                if res['event'] in __callbacks:
                    for cb in __callbacks[res['event']]:
                        cb(res['data'])
        async def send():
            global __sendlist, __running
            while (__running):
                if len(__sendlist[index]) > 0:
                    msg = __sendlist[index][0]
                    del __sendlist[index][0]
                    await websocket.send(msg)
                else:
                    time.sleep(0.1)
        def send2():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(send())
            loop.close()
        sendThread = Thread(target = send2)
        sendThread.start()
        await recieve()
        sendThread.join()
    except websockets.exceptions.ConnectionClosedOK:
        del __sendlist[index]
        return

def __start():
    global __running, __server
    __running = True
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        server = websockets.serve(__server, '192.168.1.151', 4040)
        loop.run_until_complete(server)
        loop.run_forever()
    except KeyboardInterrupt:
        return

__thread = Thread(target = __start)
__thread.start()
import asyncio
import websockets
import json as JSON
from threading import Thread

callbacks = {}
def addCallback(event, cb):
    if event in callbacks:
        callbacks[event].append(cb)
    else:
        callbacks[event] = [cb]

__running = True
__thread = None

def close():
    global __running, __thread
    __running = False
    __thread.join()

async def __server(websocket, path):
    global __running
    try:
        await websocket.send('connected yay')
        while (True):
            json = await websocket.recv()
            res = JSON.loads(json)
            if res['event'] in callbacks:
                for cb in callbacks[res['event']]:
                    cb(res['data'])
    except ConnectionClosedOK:
        return

def __start():
    global __running, __server
    __running = True
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = websockets.serve(__server, '192.168.1.151', 4040)
    loop.run_until_complete(server)
    loop.run_forever()

try:
    __thread = Thread(target = __start)
    __thread.start()
except KeyboardInterrupt: True
import asyncio
import websockets
import json as JSON
from threading import Thread
import time

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
    # __thread.join()

async def __server(websocket, path):
    global __running
    await websocket.send('connected yay')
    while (True):
        json = await websocket.recv()
        res = JSON.loads(json)
        if res['event'] in callbacks:
            for cb in callbacks[res['event']]:
                cb(res['data'])

__running = True
start_server = websockets.serve(__server, '192.168.1.151', 4040)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

# async def __start():
#     global __running
#     __running = True
#     async with websockets.serve(__server, '192.168.1.151', 4040):
#         await asyncio.Future()

# __thread = Thread(target = __start)
# __thread.start()
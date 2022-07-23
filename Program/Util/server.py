import asyncio
import websockets
import json as JSON
from threading import Thread

__callbacks = {}
__connections = []
def addListener(event, cb):
    global __callbacks
    if event in __callbacks:
        __callbacks[event].append(cb)
    else:
        __callbacks[event] = [cb]
def broadcast(data):
    global __connections
    for socket in __connections:
        socket.send(data)

__running = True
__thread = None

def close():
    global __running, __thread
    __running = False
    __thread.join()

async def __server(websocket, path):
    global __running, __callbacks, __connections
    index = len(__connections)
    __connections.append(websocket)
    try:
        await websocket.send('Connected!')
        while (True):
            json = await websocket.recv()
            res = JSON.loads(json)
            if res['event'] in __callbacks:
                for cb in __callbacks[res['event']]:
                    cb(res['data'])
    except websockets.exceptions.ConnectionClosedOK:
        __connections[index] = None
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
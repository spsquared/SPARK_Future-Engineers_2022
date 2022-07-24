import asyncio
import websockets
import json as JSON
from threading import Thread
from IO import io
import time

callbacks = {}
sendlist = []
def addListener(event, cb):
    global callbacks
    if event in callbacks:
        callbacks[event].append(cb)
    else:
        callbacks[event] = [cb]
def broadcast(data):
    global sendlist
    for arr in sendlist:
        arr.append(data)

running = True
thread = None

def close():
    global running, thread
    running = False
    thread.join()

async def __server(websocket, path):
    global sendlist
    index = len(sendlist)
    sendlist.append([])
    connected = True
    try:
        async def recieve():
            global callbacks, running
            while connected and running:
                json = await websocket.recv()
                res = JSON.loads(json)
                if res['event'] in callbacks:
                    for cb in callbacks[res['event']]:
                        cb(res['data'])
        async def send():
            global sendlist, running
            while connected and running:
                if len(sendlist[index]) > 0:
                    msg = sendlist[index][0]
                    del sendlist[index][0]
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
        connected = False
        del sendlist[index]
    except websockets.exceptions.ConnectionClosedError:
        connected = False
        del sendlist[index]
    except:
        connected = False
        del sendlist[index]
        io.error()

def __start():
    global running, __server
    running = True
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        server = websockets.serve(__server, '192.168.1.151', 4040)
        loop.run_until_complete(server)
        loop.run_forever()
    except KeyboardInterrupt:
        return

thread = Thread(target = __start)
thread.start()
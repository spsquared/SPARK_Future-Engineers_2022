import asyncio
import websockets
# import contextvars
import json as JSON
import typing
from threading import Thread
from IO import io
import time

# WebSocket server module for testing only

# listeners and broadcast
callbacks = {}
sendlist = []
def addListener(event: str, cb: typing.Callable[[typing.Any], None]):
    global callbacks
    if event in callbacks:
        callbacks[event].append(cb)
    else:
        callbacks[event] = [cb]
def broadcast(event: str, data: typing.Any):
    global sendlist
    for arr in sendlist:
        arr.append(JSON.dumps({'event': event, 'data': data}))

running = True
thread = None
threadLoop = asyncio.new_event_loop()

def close():
    global running, thread, threadLoop
    if running == True:
        running = False
        threadLoop.stop()
        thread.join()
        return True
    return False

async def __server(websocket, path):
    global sendlist, threadLoop
    index = len(sendlist)
    sendlist.append([])
    print('connected')
    try:
        async def recieve():
            global callbacks, running
            # recieve events
            while running:
                json = await websocket.recv()
                res = JSON.loads(json)
                if res['event'] in callbacks:
                    for cb in callbacks[res['event']]:
                        cb(res['data'])
        async def send():
            global sendlist, running
            # send events
            while running:
                await websocket.send('ping')
                if len(sendlist[index]) > 0:
                    data = sendlist[index][0]
                    sendlist[index].pop(0)
                    await websocket.send(data)
                else:
                    time.sleep(0.1)
        await asyncio.gather(recieve, send)
    except websockets.exceptions.ConnectionClosedOK:
        print('disconnected')
        del sendlist[index]
    except websockets.exceptions.ConnectionClosedError:
        print('disconnected')
        del sendlist[index]
    except Exception as err:
        del sendlist[index]
        print(err)
        io.error()

def __start():
    global running, __server, threadLoop
    running = True
    asyncio.set_event_loop(threadLoop)
    server = websockets.serve(__server, '192.168.1.151', 4040)
    threadLoop.run_until_complete(server)
    threadLoop.run_forever()

thread = Thread(target = __start)
thread.start()
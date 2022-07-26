import asyncio
import websockets
import json as JSON
from threading import Thread
from IO import io
import time

# listeners and broadcast
callbacks = {}
sendlist = []
def addListener(event, cb):
    global callbacks
    if event in callbacks:
        callbacks[event].append(cb)
    else:
        callbacks[event] = [cb]
def broadcast(event, data):
    global sendlist
    for arr in sendlist:
        arr.append(JSON.dumps({'event': event, 'data': data}))

running = True
thread = None

def close():
    global running, thread
    if running == True:
        running = False
        thread.join()
        return True
    return False

async def __server(websocket, path):
    global sendlist
    index = len(sendlist)
    sendlist.append([])
    connected = True
    try:
        async def recieve():
            global callbacks, running
            # recieve events
            while connected and running:
                json = await websocket.recv()
                res = JSON.loads(json)
                if res['event'] in callbacks:
                    for cb in callbacks[res['event']]:
                        cb(res['data'])
        async def send():
            global sendlist, running
            # send events
            while connected and running:
                if len(sendlist[index]) > 0:
                    data = sendlist[index][0]
                    del sendlist[index][0]
                    await websocket.send(data)
                else:
                    time.sleep(0.1)
        def send2():
            # middle function that allows async functions running in separate thread
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
    except KeyboardInterrupt:
        connected = False
        del sendlist[index]
    except:
        connected = False
        del sendlist[index]
        io.error()

def __start():
    global running, __server
    running = True
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = websockets.serve(__server, '192.168.1.151', 4040)
    loop.run_until_complete(server)
    loop.run_forever()

thread = Thread(target = __start)
thread.start()
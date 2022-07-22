import asyncio
import websockets

async def server(websocket, path):
    print('dasfadsfads dsgasdf asdf ')
    await websocket.send('asdfasdf')
    response = await websocket.recv()
    print(response)

start_server = websockets.serve(server, "192.168.1.151", 4040)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
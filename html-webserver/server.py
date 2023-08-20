import asyncio
import websockets
import json
import os

EDIT_FOLDER = 'edit'
EXPORT_FOLDER = 'export'

async def echo(websocket, path):
    async for message in websocket:
        data = json.loads(message)

        if data['action'] == 'load':
            filename = os.path.join(EDIT_FOLDER, data['filename'])
            if os.path.exists(filename):
                with open(filename, 'r') as f:
                    content = f.read()
                    await websocket.send(json.dumps({"action": "load", "content": content}))
            else:
                await websocket.send(json.dumps({"action": "error", "message": "File not found"}))

        elif data['action'] == 'save':
            with open(os.path.join(EDIT_FOLDER, 'example.ts'), 'w') as ts_file:
                ts_file.write(data['tsContent'])
            with open(os.path.join(EXPORT_FOLDER, 'example.js'), 'w') as js_file:
                js_file.write(data['jsContent'])

        elif data['action'] == 'list':
            files = [f for f in os.listdir(EDIT_FOLDER) if os.path.isfile(os.path.join(EDIT_FOLDER, f)) and f.endswith('.ts')]
            await websocket.send(json.dumps({"action": "list", "files": files}))

start_server = websockets.serve(echo, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

import os
import asyncio
import json
import random
import time
import asyncio
import websockets

PORT = int(os.environ.get('PORT', '8081'))

INSTRUMENTS = ['EURUSD','USDJPY','GBPUSD','AUDUSD','USDCAD']

state = {}
for sym in INSTRUMENTS:
    state[sym] = {
        'symbol': sym,
        'price': round(random.uniform(0.4, 1.7), 4),
        'qty': random.randint(100, 900)
    }

clients = set()

async def broadcast_state():
    payload = { 'type': 'update', 'instruments': list(state.values()) }
    raw = json.dumps(payload)
    to_remove = []
    for ws in clients:
        try:
            await ws.send(raw)
        except Exception:
            to_remove.append(ws)
    for ws in to_remove:
        clients.discard(ws)

async def tick_loop():
    while True:
        for sym in INSTRUMENTS:
            s = state[sym]
            delta = (random.random() - 0.5) * 0.02
            s['price'] = round(max(0.0001, s['price'] + delta), 4)
            s['qty'] = max(1, s['qty'] + int((random.random() - 0.5) * 20))
        await broadcast_state()
        await asyncio.sleep(1)

async def log_received(obj):
    line = f"{time.strftime('%Y-%m-%dT%H:%M:%S')} {json.dumps(obj)}\n"
    try:
        await asyncio.to_thread(lambda: open('received_params.log','a').write(line))
    except Exception:
        pass

async def handler(ws, path):
    print('client connected')
    clients.add(ws)
    try:
        await ws.send(json.dumps({ 'type': 'update', 'instruments': list(state.values()) }))
        async for message in ws:
            try:
                obj = json.loads(message)
                print('received', obj.get('user') if isinstance(obj, dict) else 'msg')
                await log_received(obj)
                received_for = []
                if isinstance(obj, dict):
                    received_for = [p.get('symbol') for p in obj.get('params', []) if isinstance(p, dict)]
                await ws.send(json.dumps({ 'status': 'ok', 'receivedFor': received_for }))
            except Exception as e:
                print('invalid msg', e)
    finally:
        clients.discard(ws)

async def main():
    server = await websockets.serve(handler, '0.0.0.0', PORT)
    print('WS server listening on', PORT)
    asyncio.create_task(tick_loop())
    await asyncio.Future()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

import json
import asyncio
from aiohttp import web

class BaseItems:
    def __init__(self):
        self.items = {}
        self.ws = None

    def view_items(self) -> str:
        return json.dumps(self.items)
    
    def add_item(self, name: str, quantity=1):
        assert self.ws is not None
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        if name in self.items:
            self.items[name] += quantity
        else:
            self.items[name] = quantity

        data = json.dumps(self.items)
        loop.run_until_complete(self.ws.send_str(f"cart:{data}"))

        loop.close()
        return f"{quantity} of {name} added to the cart"

    def remove_item(self, name: str):
        assert self.ws is not None

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        removed_item = self.items.pop(name, None)
        data = json.dumps(self.items)
        loop.run_until_complete(self.ws.send_str(f"cart:{data}"))

        loop.close()

        if removed_item:
            return f"Removed {name} from the cart"
        else:
            return f"There's no such item in the cart"

    def sync_items(self, data):
        self.items = data

    def set_ws(self, ws: web.WebSocketResponse):
        self.ws = ws

class Screen:
    def __init__(self):
        self.ws = None
        self.screen_id = "Idle"
    
    def set_ws(self, ws: web.WebSocketResponse):
        self.ws = ws

    def set_id(self, screen_id: str):
        assert self.ws is not None

        self.screen_id = screen_id

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        loop.run_until_complete(self.ws.send_str(screen_id))
        loop.close()

        return f"Set screen state to {screen_id}"
from person_detector import PersonDetection

class Screen:
    def __init__(self):
        self.ws = None
        self.screen_id = "Idle"
    
    def set_ws(self, ws: web.WebSocketResponse):
        self.ws = ws

    def set_id(self, screen_id: str):
        assert self.ws is not None
        assert screen_id in ["/", "/order", "/payment", "/payment/cash", "/payment/card"]

        self.screen_id = screen_id
        
        self.ws._loop.create_task(self.ws.send_str('scrn:'+screen_id))

        return f"Set screen state to {screen_id}"
    
    def get_id(self):
        return self.screen_id
    
class Cart:
    def __init__(self):
        self.items = {}
    

class Products:
    def __init__(self):
        self.items = {}


cart = Cart()
products = Products()
screen = Screen()
detection = PersonDetection()
detection.start()
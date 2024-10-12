from frontend_data import Screen
from person_detector import PersonDetection

cart: dict[str, int] = {}
products = []
screen = Screen()
detection = PersonDetection()
detection.start()
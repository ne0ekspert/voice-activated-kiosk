import os
import cv2
import numpy as np
from keras.models import load_model
from dotenv import load_dotenv
import logging
import threading
from pathlib import Path
from aiohttp import web
from websocket import ws_voice, ws_prod, ws_nfc

load_dotenv()

model = load_model("keras_Model.h5", compile=False)
class_names = open("labels.txt", "r").readlines()

def person_detection():
    cap = cv2.VideoCapture(0)

    while True:
        # Grab the webcamera's image.
        ret, image = cap.read()

        # Resize the raw image into (224-height,224-width) pixels
        image = cv2.resize(image, (224, 224), interpolation=cv2.INTER_AREA)

        # Show the image in a window
        cv2.imshow("Webcam Image", image)

        # Make the image a numpy array and reshape it to the models input shape.
        image = np.asarray(image, dtype=np.float32).reshape(1, 224, 224, 3)

        # Normalize the image array
        image = (image / 127.5) - 1

        # Predicts the model
        prediction = model.predict(image)
        index = np.argmax(prediction)
        class_name = class_names[index]
        confidence_score = prediction[0][index]

        # Print prediction and confidence score
        print("Class:", class_name[2:], end="")
        print("Confidence Score:", str(np.round(confidence_score * 100))[:-2], "%")

if not Path('voice-activated-kiosk-ui/build').is_dir():
    os.chdir("voice-activated-kiosk-ui")
    print("웹페이지가 빌드되지 않았습니다!")
    print("빌드 중...")
    os.system("npm install")
    os.system("npm run build")
    os.chdir("..")

app = web.Application()
logging.basicConfig(level=logging.DEBUG)
async def index(request):
    return web.FileResponse('voice-activated-kiosk-ui/build/index.html')

app.router.add_static('/static/', 'voice-activated-kiosk-ui/build/static/', name='static')
app.router.add_get('/', index)
app.router.add_get('/ws/voice', ws_voice)
app.router.add_get('/ws/prod', ws_prod)
app.router.add_get('/ws/nfc', ws_nfc)
app.router.add_get('/{path:.*}', index)

if __name__ == '__main__':
    print("서버 시작!")
    web.run_app(app)
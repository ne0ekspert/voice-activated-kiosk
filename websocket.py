import os
from playsound import playsound
from gtts import gTTS
import vertexai
from vertexai.language_models import TextGenerationModel
import speech_recognition as sr
from aiohttp import web
import threading
import asyncio
import json

vertexai.init(project="gemini-test-415008", location="us-central1")
model = TextGenerationModel.from_pretrained("text-bison")

try:
    import pynfc
    n = pynfc.Nfc("pn532_i2c:/dev/i2c-1")
except:
    n = None

cart = []
products = []

async def ws_prod(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        global cart, products

        if msg.type == web.WSMsgType.TEXT:
            if msg.data.startswith("cart:"):
                cart = json.loads(msg.data[5:])
                print(f"Cart data updated: {cart}")
            elif msg.data.startswith("prod:"):
                products = json.loads(msg.data[5:])
                print(f"Products updated: {products}")
        elif msg.type == web.WSMsgType.ERROR:
            print(f"Error: {msg.data}")

    return ws

async def ws_voice(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    print(ws.status)

    async def listen_async(r):
        result_future = asyncio.Future()
        def threaded_listen():
            with sr.Microphone() as s:
                try:
                    print('listening...')
                    audio = r.listen(s)
                    ws._loop.call_soon_threadsafe(result_future.set_result, audio)
                except Exception as e:
                    ws._loop.call_soon_threadsafe(result_future.set_exception, e)
        listener_thread = threading.Thread(target=threaded_listen)
        listener_thread.daemon = True
        listener_thread.start()
        return await result_future

    while not ws.closed:
        # Create an instance of the Recognizer class
        r = sr.Recognizer()

        audio = await listen_async(r)

        # Recognize speech using Google Speech Recognition
        text: str = ""
        try:
            print("Recognizing...")
            text = r.recognize_google(audio, language='ko-KR')
            print(f"You said: {text}")
            await ws.send_str(text)

        except sr.UnknownValueError:
            print("Google Speech Recognition could not understand audio")
            await ws.send_str("***")

        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")
            await ws.send_str(f"Error: {e}")


        if text != "":
            def getPriceByName(name):
                product = list(filter(lambda p: p['name'] == name, products))[0]
                price = int(product['price'])

                return price
            
            await ws.send_str(f"INPUT:{text}")
            # Process the recognized speech using the model and send the response
            products_text = '\n'.join(
                map(lambda x: f"{x['name']}: {x['price']}원",
                    products
                )
            )
            cart_text = '\n'.join(
                map(lambda x: f"[{x['id']}] {x['name']} {x['count']}개: {getPriceByName(x['name']) * x['count']}",
                    cart
                )
            )

            input_text = f"""주문을 받는 AI로 역할
사용 가능한 기능: 음성 인식
주문을 받고 다음 포맷으로 정리: <품명ID:수량>
결제 방식은 다음 포맷으로 정리: <payment:card> <payment:cash>
친근한 대화체로 대답

주문 가능한 품목
{products_text}
---
주문한 품목
{cart_text}
---

input: 카드로 결제할게요
output: <payment:card>
## 대답
카드를 리더기에 터치해주세요.
<|end|>

input: 진라면 100개
output: <진라면:100>
## 대답
진라면 100개를 목록에 추가했습니다!
<|end|>

input: 만두 라면 주문 취소
output: <!e227020f-dee9-4633-b1ef-7c47ed85e396>
## 대답
만두 라면을 주문 목록에서 삭제하였습니다.

input: 현금 결제로 할게요
output: <payment:cash>
## 대답
음식이 나올 때 카운터에서 결제해주세요.
<|end|>

input: {text}
output: """
            parameters = {
                "candidate_count": 1,
                "max_output_tokens": 1024,
                "stop_sequences": [
                    "<|end|>"
                ],
                "temperature": 0.9,
                "top_p": 1
            }
            response = model.predict(input_text, **parameters)
            print(input_text)
            print(f"Response from Model: {response.text}")
            await ws.send_str(f'RES:{response.text}')

            if "## 대답" not in response.text:
                continue

            speech = response.text.split("## 대답")[1]

            print("Voice output process...")
            tts = gTTS(speech, lang='ko')
            tts.save("temp.mp3")
            playsound("temp.mp3")
            os.remove("temp.mp3")

    return ws

async def ws_nfc(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async def read_tag_async():
        result_future = asyncio.Future()
        def threaded_read_tag():
            try:
                for target in n.poll():
                    ws._loop.call_soon_threadsafe(result_future.set_result, target)
                    break
            except Exception as e:
                ws._loop.call_soon_threadsafe(result_future.set_exception, e)

        read_tag_thread = threading.Thread(target=threaded_read_tag)
        read_tag_thread.daemon = True
        read_tag_thread.start()

        return await result_future

    while not ws.closed:
        try:
            target = await read_tag_async()
            ws.send_str(target.uid.hex())
        except:
            pass

    return ws
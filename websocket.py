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

with open('prompts/context.txt') as f:
    prompt_context = f.read()
with open('prompts/examples.txt') as f:
    prompt_examples = f.read()

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
                    audio = r.listen(s, timeout=2)
                    ws._loop.call_soon_threadsafe(result_future.set_result, audio)
                except Exception as e:
                    ws._loop.call_soon_threadsafe(result_future.set_exception, e)
        listener_thread = threading.Thread(target=threaded_listen)
        listener_thread.daemon = True
        listener_thread.start()
        return await result_future
    
    r = sr.Recognizer()
    r.energy_threshold = 40

    while not ws.closed:
        await ws.send_str('!!!')
        audio = await listen_async(r)

        # Recognize speech using Google Speech Recognition
        text: str = ""
        try:
            await ws.send_str('...')
            print("Recognizing...")
            text = r.recognize_google(audio, language='ko-KR')
            print(f"You said: {text}")

        except sr.UnknownValueError:
            print("Google Speech Recognition could not understand audio")
            await ws.send_str("???")

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
                map(lambda x: f"[{x['id']}] {x['name']} {x['count']}개: {getPriceByName(x['name']) * int(x['count'])}",
                    cart
                )
            )

            input_text = f"""{prompt_context}

주문 가능한 품목
{products_text}
---
주문한 품목
{cart_text}
---

{prompt_examples}

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

            response_text = response.text.split("## 대답")[1]

            async def async_play(path):
                result_future = asyncio.Future()

                def threaded_play(path):
                    playsound(path)
                    ws._loop.call_soon_threadsafe(result_future.set_result, 0)

                play_thread = threading.Thread(target=threaded_play, args=(path,), daemon=True)
                play_thread.start()

                return await result_future

            print("Voice output process...")
            tts = gTTS(response_text, lang='ko')
            tts.save("temp.mp3")
            await async_play("temp.mp3")
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

        read_tag_thread = threading.Thread(target=threaded_read_tag, daemon=True)
        read_tag_thread.start()

        return await result_future

    while not ws.closed:
        try:
            target = await read_tag_async()
            ws.send_str(target.uid.hex())
        except:
            pass

    return ws
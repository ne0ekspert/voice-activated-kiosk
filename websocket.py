import os
from playsound import playsound
from gtts import gTTS
import vertexai
from vertexai.generative_models import GenerativeModel
import speech_recognition as sr
from aiohttp import web
import threading
import asyncio
import json
from product import cart, product
from rag_tools import retail_tool, rag_run_function

vertexai.init(project="gemini-test-415008", location="us-central1")
model = GenerativeModel(
    "gemini-1.5-pro-001",
    tools=[retail_tool]
)

try:
    import pynfc
    n = pynfc.Nfc("pn532_i2c:/dev/i2c-1")
except:
    print("due to PyNFC initialization failure we will disable NFC")
    n = None

chat = model.start_chat()

async def ws_prod(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        global cart, product

        if msg.type == web.WSMsgType.TEXT:
            if msg.data.startswith("cart:"):
                cart.items = json.loads(msg.data[5:])
                print(f"Cart data updated: {cart}")
            elif msg.data.startswith("prod:"):
                product.items = json.loads(msg.data[5:])
                print(f"Products updated: {product}")
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
            await ws.send_str(f"INPUT:{text}")
            # Process the recognized speech using the model and send the response
            response = chat.send_message(text)
            for part in response.candidates[0].content.parts:
                chat.send_message(
                    rag_run_function(part)
                )
            print(f"Response from Model: {response.text}")
            await ws.send_str(f'RES:{output}')


            speech = response.text

            async def async_play(path):
                result_future = asyncio.Future()

                def threaded_play(path):
                    playsound(path)
                    ws._loop.call_soon_threadsafe(result_future.set_result, 0)

                play_thread = threading.Thread(target=threaded_play, args=(path,), daemon=True)
                play_thread.start()

                return await result_future

            print("Voice output process...")
            tts = gTTS(speech, lang='ko')
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
import os
from playsound import playsound
from gtts import gTTS
import vertexai
from vertexai.language_models import TextGenerationModel
import speech_recognition as sr
from google.cloud import speech
from gcloud_stt import ResumableMicrophoneStream
from aiohttp import web
import threading
import logging
import asyncio
import json

logger = logging.Logger(__name__)

vertexai.init(project="gemini-test-415008", location="us-central1")
model = TextGenerationModel.from_pretrained("text-bison")

SAMPLE_RATE = 48000
client = speech.SpeechClient()
config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
    sample_rate_hertz=SAMPLE_RATE,
    language_code="ko-KR",
    enable_automatic_punctuation=True,
    model="latest_short",
    max_alternatives=1,
)

streaming_config = speech.StreamingRecognitionConfig(
    config=config, interim_results=True
)

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

    async def transcribe_async():
        result_future = asyncio.Future()

        def threaded_listen_middle():
            async def threaded_listen():
                mic_manager = ResumableMicrophoneStream(48000, SAMPLE_RATE // 10)

                await ws.send_str('!!!')
                
                with mic_manager as stream:
                    while not stream.closed:
                        stream.audio_input = []
                        audio_generator = stream.generator()

                        requests = (
                            speech.StreamingRecognizeRequest(audio_content=content)
                            for content in audio_generator
                        )

                        responses = client.streaming_recognize(streaming_config, requests)

                        for response in responses:
                            if not response.results:
                                continue

                            result = response.results[0]

                            if not result.alternatives:
                                continue

                            transcript = result.alternatives[0].transcript

                            logger.warning(transcript)

                            await ws.send_str('INPUT:'+transcript)

                            if result.is_final:
                                ws._loop.call_soon_threadsafe(result_future.set_result, transcript)

                """
                with sr.Microphone() as s:
                    try:
                        print('listening...')
                        audio = r.listen(s, timeout=2)
                        ws._loop.call_soon_threadsafe(result_future.set_result, audio)
                    except Exception as e:
                        ws._loop.call_soon_threadsafe(result_future.set_exception, e)
                """
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            loop.run_until_complete(threaded_listen())
            loop.close()

        listener_thread = threading.Thread(target=threaded_listen_middle)
        listener_thread.daemon = True
        listener_thread.start()

        return await result_future

    while not ws.closed:
        text: str = await transcribe_async()

        if text != "":
            await ws.send_str('...')
            
            def getPriceByName(name):
                product = list(filter(lambda p: p['name'] == name, products))[0]
                price = int(product['price'])

                return price
            
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
from ast import Break
import os
import json
import asyncio
import logging
import threading
import pynfc
from dotenv import load_dotenv
from playsound import playsound
from google.cloud import speech
from gcloud_stt import ResumableMicrophoneStream, speech_client, streaming_config
from gcloud_tts import synthesis
from langchain.schema import SystemMessage
from langchain_core.messages import ToolMessage
from aiohttp import web
from data import cart, products, screen, detection
from agent import conversation, store
import tools

load_dotenv()

logger = logging.Logger(__name__)

SAMPLE_RATE = 44100

voice_restart = False
detected_this_session = False

async def ws_prod(request):
    global detected_this_session, nfc_lock, payment

    ws = web.WebSocketResponse()
    await ws.prepare(request)
    screen.set_ws(ws)

    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            if msg.data.startswith("cart:"):
                cart.items = json.loads(msg.data[5:])
                print(f"Cart data updated: {cart}")
            elif msg.data.startswith("prod:"):
                products.items = json.loads(msg.data[5:])
            elif msg.data.startswith("disp:"):
                print(f"Screen ID: {msg.data[5:]}")
            elif msg.data == "RESET":
                cart.items = dict()
                store.pop("test-session")
                detected_this_session = False
                nfc_lock = False
                payment = None
                print(f"Kiosk Reset")
        elif msg.type == web.WSMsgType.ERROR:
            print(f"Error: {msg.data}")

    return ws

payment = None

async def ws_voice(request):
    global detected_this_session, payment

    ws = web.WebSocketResponse()
    await ws.prepare(request)
    print(ws.status)

    async def async_tts(text):
        result_future = asyncio.Future()

        def threaded_play(text):
            assert ws._loop is not None

            synthesis(text)
            playsound("temp.mp3")
            os.remove("temp.mp3")
            ws._loop.call_soon_threadsafe(result_future.set_result, 0)

        play_thread = threading.Thread(target=threaded_play, args=(text,), daemon=True)
        play_thread.start()

        return await result_future

    async def transcribe_async():
        result_future = asyncio.Future()

        def threaded_listen_middle():
            async def threaded_listen():
                global payment
                mic_manager = ResumableMicrophoneStream(SAMPLE_RATE, SAMPLE_RATE // 10)

                assert ws._loop is not None

                try:
                    await ws.send_str('!!!')
                except Exception as e:
                    ws._loop.call_soon_threadsafe(result_future.set_exception, e)
                    return
                
                try:
                    with mic_manager as stream:
                        while not stream.closed and not ws.closed:
                            stream.audio_input = []
                            audio_generator = stream.generator()

                            requests = (
                                speech.StreamingRecognizeRequest(audio_content=content)
                                for content in audio_generator
                            )

                            responses = speech_client.streaming_recognize(streaming_config, requests)

                            for response in responses:
                                if payment:
                                    ws._loop.call_soon_threadsafe(result_future.set_result, "")
                                    return

                                if not response.results:
                                    continue

                                result = response.results[0]

                                if not result.alternatives:
                                    continue

                                transcript = result.alternatives[0].transcript

                                logger.info(transcript)

                                try:
                                    await ws.send_str('INPUT:'+transcript)
                                except Exception as e:
                                    ws._loop.call_soon_threadsafe(result_future.set_result, "")
                                    return
                                
                                if result.is_final:
                                    try:
                                        ws._loop.call_soon_threadsafe(result_future.set_result, transcript)
                                    except asyncio.exceptions.InvalidStateError:
                                        continue
                                    return
                                
                except Exception as e:
                    logger.error(f"Transcription failed: {e}")
                    return

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            loop.run_until_complete(threaded_listen())
            loop.close()

        listener_thread = threading.Thread(target=threaded_listen_middle, daemon=True)
        listener_thread.start()
        
        return await result_future

    while not ws.closed:
        await detection.detect()

        if detection.detected and not detected_this_session:
            logger.warning("Face detected!")
            detected_this_session = True

            await async_tts(open('prompts/welcome.txt', 'r').read())

        if not detection.detected:
            continue

        playsound("sfx/start_rec.wav", block=False)
        text: str = await transcribe_async()
        playsound("sfx/stop_rec.wav", block=False)

        if ws.closed:
            break

        if text != "":
            await ws.send_str('...')

            while True:
                response = await conversation.ainvoke(
                    {'input': text},
                    {"configurable": {"session_id": "test-session"}}
                )
                print(text)

                output_text = ""
                
                try:
                    output = json.loads(response['output'])

                    if output['action'] == "Final Answer":
                        raise InterruptedError(output['action_input'])

                    selected_tool = {
                        "view_menu": tools.view_menu,
                        "view_cart": tools.view_cart,
                        "add_item_to_cart": tools.add_item_to_cart,
                        "remove_item_from_cart": tools.remove_item_from_cart,
                    }[output['action']]
                    tool_output = selected_tool.invoke(output['action_input'])
                    store['test-session'].add_message(ToolMessage(tool_output, tool_call_id="id"))
                    continue
                except InterruptedError as e:
                    print(str(e))
                    output_text = str(e)
                    break
                except Exception as e:
                    logger.error(f"JSON error: {e}")
                    output_text = response['output']
                    break

            print(f"Response from Model: {output_text}")
            try:
                await ws.send_str(f"RES:{output_text}")
                await ws.send_str(f"CART:{json.dumps(cart.items)}")
            except:
                break

            print("Voice output process...")
            await async_tts(output_text)

    return ws

async def ws_nfc(request):
    global n, payment
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async def read_tag_async():
        global n
        
        result_future = asyncio.Future()

        def threaded_read_tag():
            assert ws._loop is not None
            
            global n

            try:
                for target in n.poll():
                    ws._loop.call_soon_threadsafe(result_future.set_result, target)
                    
                    playsound("temp.mp3", block=False)
                    os.remove("temp.mp3")

                    break

            except Exception as e:
                logger.error(e)
                ws._loop.call_soon_threadsafe(result_future.set_exception, e)

            del n
            return

        read_tag_thread = threading.Thread(target=threaded_read_tag, daemon=True)
        read_tag_thread.start()

        return await result_future
    
    payment = ws._loop.create_future()

    total = 0
    for k, v in cart.items.items():
        price = 0
        for product in products.items:
            if product['name'] == k:
                price = product['price']
        total += price * v

    while not ws.closed:
        try:
            if 'n' not in globals():
                n = pynfc.Nfc("pn532_i2c:/dev/i2c-1")

                target = await read_tag_async()

                await ws.send_str(target.uid.hex())
                break
        except Exception as e:
            try:
                await ws.send_str("6687464507465245")
            except Exception as e:
                break
            break
        
    response = conversation.invoke(
        {'input': SystemMessage(f'Cart: {cart}\nTotal: {total}원\n카드 결제 성공')},
        {'configurable': {'session_id': 'test-session'}}
    )
    
    synthesis(response['output'])

    payment.set_result(0)
    return ws
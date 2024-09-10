import os
import json
import asyncio
import logging
import threading
from dotenv import load_dotenv
from playsound import playsound
from gtts import gTTS
from google.cloud import speech
from gcloud_stt import ResumableMicrophoneStream
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain.agents import initialize_agent, AgentType
from langchain.schema import SystemMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from aiohttp import web
from frontend_data import BaseItems, Screen

load_dotenv()

logger = logging.Logger(__name__)

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

cart = {}
products = []
screen = Screen()

with open('prompts/context.txt') as f:
    prompt_context = f.read()
with open('prompts/examples.txt') as f:
    prompt_examples = f.read()

@tool
def view_menu() -> str:
    """
    Display the current menu options.

    This function generates a JSON string representing the available menu items.
    Each item is displayed with its name, price, and a brief description.

    Returns:
        str: A JSON string containing all menu items.
    """

    return json.dumps(products)

@tool
def view_cart() -> str:
    """
    장바구니에 있는 항목들을 JSON 문자열로 출력합니다.
    
    Returns:
        str: JSON string containing key-value pairs of item names and quantities.
    """
    return json.dumps(cart)
    
@tool
def add_item(name: str, quantity=1):
    """
    장바구니에 항목을 추가합니다.

    Args:
        name (str): Name of the item to add.
        quantity (int, optional): Quantity of the item to add. Defaults to 1.

    Returns:
        str: Confirmation message indicating how many of the item were added.
    """

    if name not in map(lambda x: x['name'], products):
        return f"No such menu named as {name}"

    if name in cart:
        cart[name] += quantity
    else:
        cart[name] = quantity

    return f"{name} {quantity}개를 장바구니에 추가했습니다"

@tool
def remove_item(name: str):
    """
    장바구니에서 항목을 하나 제거합니다.

    Args:
        name (str): Name of the item to remove from the cart.

    Returns:
        str: Confirmation message indicating whether the item was successfully removed.
    """
    removed_item = cart.pop(name, None)

    if removed_item:
        return f"{name}를 장바구니에서 제거했습니다"
    else:
        return f"장바구니에서 {name}을 찾을 수 없습니다"

tools = [
    view_menu,
    view_cart,
    add_item,
    remove_item,
]

store = {}
def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

system_message = SystemMessage(
    content="당신은 음성인식 기능이 있는키오스크입니다. 한국어로 대답하세요. 메뉴 아이템을 물어보면 자세한 설명을 해주세요.",
)

llm = ChatOpenAI(model="gpt-4-0125-preview")
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    agent_kwargs={
        "system_message": system_message
    },
)
conversation = RunnableWithMessageHistory(
    agent,
    get_session_history
)

async def ws_prod(request):
    global cart, products
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    screen.set_ws(ws)

    async for msg in ws:

        if msg.type == web.WSMsgType.TEXT:
            if msg.data.startswith("cart:"):
                cart = json.loads(msg.data[5:])
                print(f"Cart data updated: {cart.items}")
            elif msg.data.startswith("prod:"):
                products = json.loads(msg.data[5:])
            elif msg.data.startswith("disp:"):
                print(f"Screen ID: {msg.data[5:]}")
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

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            loop.run_until_complete(threaded_listen())
            loop.close()

        listener_thread = threading.Thread(target=threaded_listen_middle)
        listener_thread.daemon = True
        listener_thread.start()

        return await result_future
    
    async def async_play(path):
        result_future = asyncio.Future()

        def threaded_play(path):
            playsound(path)
            ws._loop.call_soon_threadsafe(result_future.set_result, 0)

        play_thread = threading.Thread(target=threaded_play, args=(path,), daemon=True)
        play_thread.start()

        return await result_future

    while not ws.closed:
        text: str = await transcribe_async()

        if text != "":
            await ws.send_str('...')

            response = conversation.invoke(
                {'input': text},
                config={"configurable": {"session_id": "test-session"}}
            )
            print(text)
            print(f"Response from Model: {response.output}")
            await ws.send_str(f'RES:{response.output}')

            print("Voice output process...")
            tts = gTTS(response.content, lang='ko')
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
            await ws.send_str(target.uid.hex())
        except:
            pass

    return ws
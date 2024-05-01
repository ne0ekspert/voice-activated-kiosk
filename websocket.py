import os
from playsound import playsound
from gtts import gTTS
import vertexai
from vertexai.language_models import TextGenerationModel
import speech_recognition as sr
from aiohttp import web
import asyncio
import json
#import pynfc

vertexai.init(project="gemini-test-415008", location="us-central1")
#n = pynfc.Nfc("pn532_i2c:/dev/i2c-1")

products = []

async def ws_prod(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        global products

        if msg.type == web.WSMsgType.TEXT:
            if msg.data.startswith("prod"):
                products = json.loads(msg.data)
            elif msg.type == web.WSMsgType.ERROR:
                print(f"Error: {msg.data}")

    return ws

async def ws_voice(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    while True:
        # Create an instance of the Recognizer class
        r = sr.Recognizer()

        # Use the default microphone as the audio source
        with sr.Microphone() as source:
            print("Listening...")
            # Listen for the first phrase and extract it into audio data
            audio_data = r.listen(source)

        # Recognize speech using Google Speech Recognition
        try:
            print("Recognizing...")
            # Use the recognize_google() method for Google Speech Recognition API
            text = r.recognize_google(audio_data, language='ko-KR')
            print(f"You said: {text}")
            await ws.send_str(text)

            parameters = {
                "candidate_count": 1,
                "max_output_tokens": 1024,
                "stop_sequences": [
                    "<|end|>"
                ],
                "temperature": 0.9,
                "top_p": 1
            }
            model = TextGenerationModel.from_pretrained("text-bison")
            response = model.predict(
                f"""주문을 받는 AI로 역할
사용 가능한 기능: 음성 인식
주문 가능한 품목
라면: 2500원
떡라면: 3000원
만두라면: 3500원
고기라면: 4000원
김밥: 1500원
돈까스김밥: 3000원
참치김밥: 2500원
스팸김밥: 3500원
주문을 받고 다음 포맷으로 정리: <품명ID:수량>
결제 방식은 다음 포맷으로 정리: <payment:card> <payment:cash>
친근한 대화체로 대답

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

input: 현금 결제로 할게요
output: <payment:cash>
## 대답
음식이 나올 때 카운터에서 결제해주세요.
<|end|>

input: {text}
output: """, **parameters)
            print(f"Response from Model: {response.text}")
            await ws.send_str(response.text)

            if "## 대답" not in response.text:
                continue
            speech = response.text.split("## 대답")[1]
            print("Voice output precess...")

            tts = gTTS(speech, lang='ko')
            tts.save("temp.mp3")
            playsound("temp.mp3")
            os.remove("temp.mp3")

        except sr.UnknownValueError:
            print("Google Speech Recognition could not understand audio")
            await ws.send_str("***")
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")
                    

async def ws_nfc(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    pass

    while True:
        for target in n.poll():
            try:
                await ws.send_str(target.uid.hex())
            except pynfc.TimeoutException:
                pass
            
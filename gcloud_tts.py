import os
from playsound import playsound
from google.cloud import texttospeech

# Instantiates a client
client = texttospeech.TextToSpeechClient()
voice = texttospeech.VoiceSelectionParams(
    language_code="ko-KR", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
)
audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3
)

def synthesis(text):
    synthesis_input = texttospeech.SynthesisInput(text=text)
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    with open("temp_nfc.mp3", "wb") as out:
        # Write the response to the output file.
        out.write(response.audio_content)

    playsound("temp_nfc.mp3")
    os.remove("temp_nfc.mp3")
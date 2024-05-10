import os
import logging
from pathlib import Path
from aiohttp import web
from websocket import ws_voice, ws_prod, ws_nfc

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
async def manifest(request):
    return web.FileResponse('voice-activated-kiosk-ui/build/manifest.json')

app.router.add_static('/static/', 'voice-activated-kiosk-ui/build/static/', name='static')
app.router.add_get('/', index)
app.router.add_get('/manifest.json', manifest)
app.router.add_get('/ws/voice', ws_voice)
app.router.add_get('/ws/prod', ws_prod)
app.router.add_get('/ws/nfc', ws_nfc)
app.router.add_get('/{path:.*}', index)

if __name__ == '__main__':
    print("서버 시작!")
    web.run_app(app)
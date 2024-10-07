import os
from dotenv import load_dotenv
import logging
from pathlib import Path
import asyncio
from aiohttp import web
from websocket import ws_voice, ws_prod, ws_nfc

load_dotenv()

if not Path('voice-activated-kiosk-ui/build').is_dir():
    os.chdir("voice-activated-kiosk-ui")
    print("웹페이지가 빌드되지 않았습니다!")
    print("빌드 중...")
    os.system("npm install")
    os.system("npm run build")
    os.chdir("..")

loop = asyncio.new_event_loop()

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

fake_future = asyncio.Future(loop=loop)
def run_browser(app):
    return loop.create_task(loop.subprocess_exec(asyncio.SubprocessProtocol, 
        'x-www-browser',
        'http://localhost:8080',
        '--start-maximized',
        '--start-fullscreen',
        '--kiosk',
        '--disable-html5-camera',
        '--disk-cache-dir=/dev/null',
        '--disk-cache-size=1'
    ))

if __name__ == '__main__':
    app.on_startup.append(run_browser)

    web.run_app(app, loop=loop)

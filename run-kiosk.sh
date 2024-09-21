#!/usr/bin/env bash
export GOOGLE_APPLICATION_CREDENTIALS='/home/pi/license.json'
cd '/home/pi/voice-activated-kiosk'
x-www-browser http://localhost:8080 --start-maximized --start-fullscreen --kiosk &
/home/pi/venv/bin/python3 main.py

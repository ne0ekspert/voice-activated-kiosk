#!/usr/bin/env bash

export GOOGLE_APPLICATION_CREDENTIALS='/home/pi/license.json'
export DISPLAY=:0
cd '/home/pi/voice-activated-kiosk'

/home/pi/venv/bin/python3 main.py

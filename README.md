
# 음성 인식 키오스크

부산기계공업고등학교 프로젝트 수업 졸업 작품

## 개요

음성 인식 키오스크는 음성만으로 **음식을 주문에 추가하거나 삭제**하고 NFC를 활용하여 결제 시스템을 구현하는 키오스크 시스템입니다.
React.js로 구현된 화면과 Python 및 ChatGPT 기반 **음성 인식 및 생성형 AI 대답 생성 기술을 활용**하여 사용자가 편리하게 음식을 주문하고 결제할 수 있도록 지원합니다.

## 기능

* 음성 인식을 통한 음식 주문 추가 및 삭제
* 음성 인식 결과 및 생성형 AI 대답 표시
* NFC를 활용한 결제 시스템

## 기술 스택

* 프론트엔드: React.js
* 백엔드: Python, ChatGPT
* 하드웨어: Raspberry Pi 5, Sunfounder 10.1" 터치스크린
* 기타: PN532 NFC 리더 (I2C)

## 설치 및 실행

1. 프로젝트를 복제합니다. `git clone --recursive https://github.com/ne0ekspert/voice-activated-kiosk.git`
2. 필요한 라이브러리를 설치합니다. `pip install -r requirements.txt`
3. `python main.py` 명령어로 서버를 실행합니다.
4. 웹 브라우저에서 `http://localhost:80` 주소로 이동합니다.

## 사용 방법

1. 음성 명령을 사용하여 음식을 주문에 추가하거나 삭제합니다.
2. 음성 인식 결과 및 생성형 AI 대답을 확인합니다.
3. NFC 카드를 리더에 터치하여 결제합니다. (ISO 14443 NFC로 학생증을 사용하여 결제 단계를 모방했습니다)

## 하드웨어

TBD

## 시연 영상

TBD

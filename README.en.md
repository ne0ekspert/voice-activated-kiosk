# AI Voice Recognition Kiosk

Graduation work of Busan Mechanical Technical High School project class

## Overview

Voice Recognition Kiosk is a kiosk system that allows users to **add or delete food items to their order** using only their voice and implements a payment system utilizing NFC.
It supports users to order and pay for food conveniently by using a screen implemented with React.js and Python and ChatGPT based **speech recognition and generative AI answer generation technology**.

## Features

* Add and delete food orders via voice recognition
* Display voice recognition results and generative AI answers
* Payment system utilizing NFC

## Technology stack

* Frontend: React.js
* Backend: Python, ChatGPT
* Hardware: Raspberry Pi 5, Sunfounder 10.1” touchscreen
* Other: PN532 NFC reader (I2C)

## Install and run

1. Clone the project. `git clone --recursive https://github.com/ne0ekspert/voice-activated-kiosk.git`
2. Install the required libraries. pip install -r requirements.txt`
3. Run the server with the command `python main.py`.
4. navigate to the address `http://localhost:8080` in your web browser.

## How to use

1. Use voice commands to add or delete food to an order.
2. Check the voice recognition results and generative AI answers.
3. Touch your NFC card to the reader to pay. (We have mimicked the payment step using a student ID with ISO 14443 NFC)

## Screenshot

<details>

<summary>Expand</summary>

Idle screen

![Idle Screen](./docs/main.png)

---

Order Screen

![Order Screen](./docs/order.png)

---

Order Selected Screen

![Order Screen with Items](./docs/order-selected.png)

---

Payment Selection Screen

![Payment Selection Screen](./docs/payment.png)

---

Card Payment Screen

![Card Payment Screen](./docs/payment-card.png)

---

Card Payment Success Screen

![Card Payment Success Screen](./docs/payment-card-success.png)

---

Cash Payment Screen

![Cash Payment Screen](./docs/payment-cash.png)

</details>

## Buy List

| Product name | Size | Quantity | Unit price | Shipping cost | Amount |
|:----:|:----:|:-----|:-----|:-------|:-----|
| Door Magnet Catch Latches Dampeners Furniture Push Stanchions + L-shaped | | 4 | 2,900 | 3,000 | 14,600 |
| **Raspberry Pi 10.1-inch Touchscreen LCD Monitor** | 9.8 x 7.24 x 3(T) in | 1 | 210,000 | 0 | 210,100 |
| **Raspberry Pi 5 8GB +5A Adapter +64GB microSD** | 85 x 56 x 16 mm | 1 | 139,810 | 0 | 139,810 |
| **Raspberry Pi Camera Module 3 Wide** | 25 x 24 x 11.5 mm | 1 | 53,900 | 0 | 53,900 |
| **13.56 MHz PN532 NFC Module [SMP0044]** | | 1 | 22,000 | 2,700 | 24,700 |
| **Adapter, power cord integrated** | 220V / 12V 1.5A [Inner diameter 2.1~2.5mm / Outer diameter 5.5mm] | 1 | 5,500 | 2,700 | 8,200 |
| ~~3.5 stereo to 3.5 stereo M/F2 conversion cable~~ | 0.2m | 1 | 1,430 | 2,700 | 4,130 |
| **Test [CH254] Socket Jumper Cable 40P** | 20mm F/F, M/F, M/M | 3 | 935 | 2,700 | 5,505 |
| **ETM-009 Directional Microphone** | | 1 | 65,000 | 3,000 | 68,000 |
| **Micro HDMI to HDMI Conversion Cable [SZH-CAB16]** | 1.5m | 1 | 2,200 | 0 | 2,200
| ~~[OEM] Stainless steel countersunk bolt tapping screw (1pc)~~ | M6 20mm | 20 | 165 | 0 | 3,300 |
| ~~MDF Adhesive Woodworking Bond Wood Hardboard Construction 205~~ | 800g | 2 | 7,800 | 3,000 | 18,600 |
| MDF | 50 x 300 x 18T | 15 | 1,000 | 5,000 | 20,000 |
| MDF | 290 x 200 x 9T | 5 | 1,000 | 0 | 5,000
| (1+1)Free Shipping 3D / Sleeping / Sleeping Eye Mask | | 3 | 3,900 | 0 | 11,700 |
| Visually impaired cane Blind stick 4-stage retractable for the visually impaired | | 1 | 14,900 | 3,000 | 17,900 |
| **Raspberry Pi 5, Zero Camera Adapter Cable (22pin to 15pin)** | 30cm | 1 | 1,650 | 0 | 1,650 |
| **Yugreen U-30724 USB2.0 to Audio Converter (Black)** | | 1 | 11,000 | 0 | 11,000 |
| **Kanare Extension Cable L-2E5 Rian 3.5 TRS (Female)-3.5 TRS** | 1.5m | 1 | 17,000 | 3,500 | 20,500 |
| Yeongil Spray Paint yellow spray paint | | 3 | 2,100 | 3,000 | 9,300 |
| **Britz BA-R9 SoundBar Soundbar Speaker** | | 1 | 21,900 | 0 | 21,900 |
| Ilshin Spray Paint Interior Self Matte Primer Sabi Black Silver | Black Matte | 2 | 1,880 | 3,000 | 6,760 |

## Demo Video

[Watch on YouTube](https://www.youtube.com/watch?v=Tz12pwekxME)

Translated with DeepL.com (free version)

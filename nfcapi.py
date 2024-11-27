from flask import Flask, jsonify
from pynfc import Nfc
import time
import threading

app = Flask(__name__)
nfc_lock = threading.Lock()

def poll_nfc():
    global current_tag
    while True:
        try:
            nfc_reader = Nfc("pn532_i2c:/dev/i2c-1")
            break
        except:
            continue

    print("success!!!")

    while True:
        with nfc_lock:  # Ensure that only one thread accesses the NFC reader
            if nfc_reader:
                try:
                    for target in nfc_reader.poll():
                        current_tag = 'OwO'
                        break
                except:
                    current_tag = 'OwO'
        time.sleep(0.5)

@app.route('/api/nfc', methods=['GET'])
def get_nfc_data():
    global current_tag

    with nfc_lock:  # Ensure thread-safe access to the shared NFC data
        if current_tag:
            response = {"message": current_tag}
            current_tag = None  # Reset the tag once it's read
            return jsonify(response)
        else:
            return jsonify({"message": "No tag detected"}), 404
        
def start_nfc_reader():
    poll_nfc_thread = threading.Thread(target=poll_nfc)
    poll_nfc_thread.daemon = True  # Allow thread to exit when the program exits
    poll_nfc_thread.start()

if __name__ == '__main__':
    start_nfc_reader()
    app.run(debug=True, host='0.0.0.0', port=5000)

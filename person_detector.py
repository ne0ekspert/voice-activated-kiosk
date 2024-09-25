import threading
import cv2
import mediapipe as mp
import logging

logger = logging.Logger(__name__)

class PersonDetection():
    def __init__(self):
        self.t = threading.Thread(target=self.detect, daemon=True)
        self.detected = False
        self.isDone = False

    def detect(self):
        cap = cv2.VideoCapture(0)
        mp_drawing = mp.solutions.drawing_utils
        mp_face_mesh = mp.solutions.face_mesh

        with mp_face_mesh.FaceMesh(min_detection_confidence=0.5, min_tracking_confidence=0.5) as face_mesh:
            while not self.isDone:
                success, image = cap.read()
                if not success:
                    continue

                # BGR 이미지를 RGB로 변환
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                # 이미지를 읽기 전용으로 만들기
                image.flags.writeable = False
                results = face_mesh.process(image)

                # 이미지를 다시 BGR로 변환
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                image.flags.writeable = True
                        
                self.detected = self.is_face_frontal(results)
                logger.warning(self.detected)
    
    def is_face_frontal(self, results):
        # 간단한 예시: 눈 안쪽 코너와 입술 중앙의 y 좌표 비교
        # 실제로는 더 복잡한 계산이 필요할 수 있습니다.
        left_eye_inner = results.multi_face_landmarks[0].landmark[133]
        right_eye_inner = results.multi_face_landmarks[0].landmark[362]
        mouth_center = results.multi_face_landmarks[0].landmark[9]

        if abs(left_eye_inner.y - right_eye_inner.y) < 0.05 and abs(left_eye_inner.y - mouth_center.y) > 0.1:
            return True
        else:
            return False
        
    def start(self):
        self.t.start()

    def stop(self):
        self.isDone = True
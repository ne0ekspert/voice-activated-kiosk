import threading
import cv2
import numpy as np
from picamera2 import Picamera2
import mediapipe as mp
import logging
import math
import asyncio

logger = logging.Logger(__name__)

class PersonDetection():
    def __init__(self):
        self.detected = False
        self.isDone = False
        self.offset_threshold = 0.3
        self.size_threshold = 0.4
        self.camera = Picamera2()
        self.image = None
    
    def calculate_distance(self, landmark1, landmark2):
        x1, y1 = landmark1.x, landmark1.y
        x2, y2 = landmark2.x, landmark2.y
        return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

    async def detect(self):
        mp_face_mesh = mp.solutions.face_mesh

        with mp_face_mesh.FaceMesh(min_detection_confidence=0.5, min_tracking_confidence=0.5) as face_mesh:
            while not self.isDone:
                image = self.camera.capture_image()

                if not image:
                    continue

                image = np.array(image)
                self.height, self.width, _ = image.shape

                # BGR 이미지를 RGB로 변환
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                # 이미지를 읽기 전용으로 만들기
                results = face_mesh.process(image)

                self.draw_nearest_face(image, results)

                await asyncio.sleep(0.01)

    def draw_nearest_face(self, image, results):
        mp_face_mesh = mp.solutions.face_mesh
        mp_drawing = mp.solutions.drawing_utils
        mp_drawing_styles = mp.solutions.drawing_styles
        
        if image is not None and results.multi_face_landmarks:
            annotated_image = image.copy()
            self.detected = True
            
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    annotated_image,
                    face_landmarks,
                    mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style())
                
                # Calculate center of the face
                nose_tip = face_landmarks.landmark[1]
                center_x = int(nose_tip.x * self.width)
                center_y = int(nose_tip.y * self.height)
                
                # Draw circle at the center
                cv2.circle(annotated_image, (center_x, center_y), 5, (255, 0, 0), -1)
                
                # Display text on the image
                font = cv2.FONT_HERSHEY_SIMPLEX
                cv2.putText(annotated_image, f"Face Detected", (10, 20),
                            font, 0.5, (0, 255, 0), 2)
                
            self.image = annotated_image
            return
        else:
            self.detected = False
        
        self.image = image
    
    def is_face_detected(self, results):
        if not results.multi_face_landmarks:
            return False
        
        closest_face = None
        closest_distance = float('inf')

        for face_landmarks in results.multi_face_landmarks:
            # Using the nose tip (landmark 1) as a reference to calculate distance to frame center
            nose_tip = face_landmarks.landmark[1]
            nose_x = nose_tip.x * self.width
            nose_y = nose_tip.y * self.height

            distance = math.sqrt((nose_x - self.width/2) ** 2 + (nose_y - self.height/2) ** 2)

            if distance < closest_distance:
                closest_distance = distance
                closest_face = face_landmarks

        if closest_face:
            landmark_10 = closest_face.landmark[10]
            landmark_152 = closest_face.landmark[152]

            if self.calculate_distance(landmark_10, landmark_152) <= self.size_threshold:
                return True
            else:
                return False
        else:
            return False
        
    async def start(self):
        camera_config = self.camera.create_still_configuration(main={"size": (1920, 1080)}, lores={"size": (640, 480)}, display="lores")
        self.camera.configure(camera_config)

        # Get the full resolution of the camera
        full_res = self.camera.camera_properties['PixelArraySize']  # Example: (1920, 1080)
        
        # Define the desired crop size (for example, 1280x720)
        crop_size = [1600, 900]
        
        # Calculate the offset to center the crop
        offset = [(r - s) // 2 for r, s in zip(full_res, crop_size)]
        
        # Set the centered crop using the ScalerCrop control
        self.camera.set_controls({
            "ScalerCrop": offset + crop_size
        })

        self.camera.start()

    async def stop(self):
        self.isDone = True
        self.camera.stop()

async def run_person_detection():
    detector = PersonDetection()
    await detector.start()

if __name__ == "__main__":
    asyncio.run(run_person_detection())
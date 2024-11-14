import os
import json
import logging
import numpy as np
import tensorflow as tf
from minio import Minio
from tensorflow import keras
from app.plantpulse_ml.utils import train_plant_classifier

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

class PlantClassifier:
    def __init__(self):
        self.model = None
        self.class_names = []
        self.img_height = 224
        self.img_width = 224
        self.minioClient = Minio(
            'minio:9000',
            access_key='ueuDvLGHm0MYLk3HBykA',
            secret_key='TRIciRIuBQishEoPCgjeMOADzpk6fwmCclmulZ0e',
            region='us-east-1',
            secure=False
        )
        self.load_model_and_classes()

    def load_model_and_classes(self):
        try:
            logger.debug("Attempting to load model and class names...")
            
            # Ensure the models directory exists
            os.makedirs("./models", exist_ok=True)
            
            # Load model
            model_path = "./models/plant_classifier.keras"
            logger.debug(f"Downloading model to {model_path}")
            self.minioClient.fget_object("models", "plant_classifier.keras", model_path)
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found at {model_path}")
                
            logger.debug("Loading model from file")
            self.model = keras.models.load_model(model_path)
            print(self.model)
            logger.debug("Model loaded successfully")
            
            
            # Load class names
            logger.debug("Attempting to load class names")
            response = self.minioClient.get_object("models", "class_labels.json")
            json_str = response.read().decode('utf-8')
            self.class_names = json.loads(json_str)
            logger.debug(f"Class names loaded: {self.class_names}")
            
            logger.info("Model and class names loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model or class names: {str(e)}", exc_info=True)
            self.model = None
            self.class_names = []

    def classify(self, img):
        if self.model is None:
            logger.error("Model not loaded. Please ensure the model is properly initialized.")
            raise ValueError("Model not loaded. Please ensure the model is properly initialized.")
        
        if not self.class_names:
            logger.error("Class names not loaded. Please ensure class names are properly initialized.")
            raise ValueError("Class names not loaded. Please ensure class names are properly initialized.")
        
        logger.debug(f"Classifying image: {img}")
        image = tf.keras.utils.load_img(
            img, target_size=(self.img_height, self.img_width)
        )
        img_array = tf.keras.utils.img_to_array(image)
        img_array = img_array / 255.0  # Normalize to [0,1]
        img_array = tf.expand_dims(img_array, 0)  # Create a batch
        
        logger.debug("Making prediction")
        predictions = self.model.predict(img_array)
        predicted_class_index = np.argmax(predictions[0])
        confidence = predictions[0][predicted_class_index] * 100

        result = {
            "label": self.class_names[predicted_class_index],
            "confidence": round(float(confidence), 2)
        }
        logger.debug(f"Classification result: {result}")
        return result
    
    def train(self, epochs=None):
        try:
            train_plant_classifier.train(epochs)
            self.load_model_and_classes()
        except Exception as e:
            logger.error(f"Error training model: {str(e)}", exc_info=True)

    def __str__(self):
        return f"PlantClassifier(model_loaded={self.model is not None}, num_classes={len(self.class_names)})"

    
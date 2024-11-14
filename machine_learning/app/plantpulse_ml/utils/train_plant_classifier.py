import os
import shutil
import json
import tensorflow as tf
from io import BytesIO
from minio import Minio
from tensorflow import keras
from tensorflow.keras import layers, Sequential, regularizers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam

bucket = "classifier-training"
local_dataset_path = "./dataset"
minioClient = Minio(
    'minio:9000',
    access_key='ueuDvLGHm0MYLk3HBykA',
    secret_key='TRIciRIuBQishEoPCgjeMOADzpk6fwmCclmulZ0e',
    region='us-east-1',
    secure=False
)
default_epochs = 100

def main():
    print("Training started")
    train()

def train(epochs):
    if epochs is None:
        epochs = default_epochs
        
    if not os.path.exists(local_dataset_path):
        print("No dataset found in local storage")
        os.mkdir(local_dataset_path)
    
    get_dataset()
    print("Dataset downloaded")
    
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=40,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,  # Added vertical flip
        brightness_range=[0.8, 1.2],  # Added brightness adjustment
        fill_mode='nearest'
    )

    train_generator = train_datagen.flow_from_directory(
        local_dataset_path,
        target_size=(224, 224),  # Increased image size for better performance
        batch_size=32,
        class_mode='categorical',
        subset='training'
    )
    print("Training data:" + str(train_generator))
    
    validation_generator = train_datagen.flow_from_directory(
        local_dataset_path,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='validation'
    )
    print("Validation data:" + str(validation_generator))
    
    class_labels = list(train_generator.class_indices.keys())
    
    class_labels_json = json.dumps(class_labels)
    json_bytes = class_labels_json.encode('utf-8')
    json_buffer = BytesIO(json_bytes)
    minioClient.put_object("models", "class_labels.json", json_buffer, len(json_bytes))
    
    num_labels = len(class_labels)
    
    # Use MobileNetV2 as base model
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False

    # Use Functional API to build the model
    inputs = keras.Input(shape=(224, 224, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(1024, activation='relu', kernel_regularizer=regularizers.l2(0.01))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(512, activation='relu', kernel_regularizer=regularizers.l2(0.01))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(num_labels, activation='softmax')(x)

    model = keras.Model(inputs, outputs)
    
    optimizer = Adam(learning_rate=0.001)
    
    model.compile(optimizer=optimizer,
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    
    early_stopping = EarlyStopping(patience=10, restore_best_weights=True)
    lr_scheduler = ReduceLROnPlateau(factor=0.5, patience=5)
    
    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=validation_generator,
        callbacks=[early_stopping, lr_scheduler]
    )
    print(history)
    
    # Fine-tuning
    base_model.trainable = True
    for layer in base_model.layers[:100]:
        layer.trainable = False
    
    model.compile(optimizer=Adam(learning_rate=0.0001),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    
    history = model.fit(
        train_generator,
        epochs=50,
        validation_data=validation_generator,
        callbacks=[early_stopping, lr_scheduler]
    )
    print(history)
    
    os.makedirs("../models", exist_ok=True)
    
    model_save_path = "../models/plant_classifier.keras"
    model.save(model_save_path)
    minioClient.fput_object("models", "plant_classifier.keras", model_save_path)
    
    shutil.rmtree(local_dataset_path)

def get_dataset():
    for obj in minioClient.list_objects(bucket, recursive=True):
        file_name = os.path.basename(obj.object_name).split(".")[0] + ".jpg"
        file_prefix = os.path.dirname(obj.object_name).split("/")[-1].replace("-", " ")
        
        class_dir = os.path.join(local_dataset_path, file_prefix)
        os.makedirs(class_dir, exist_ok=True)
        
        local_file_path = os.path.join(class_dir, file_name)
        minioClient.fget_object(bucket, obj.object_name, local_file_path)
            
if __name__ == "__main__":
    main()
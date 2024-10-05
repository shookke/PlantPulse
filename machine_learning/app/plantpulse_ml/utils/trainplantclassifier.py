import os
import shutil
import json
import tensorflow as tf
from io import BytesIO
from minio import Minio
from tensorflow import keras
from tensorflow.keras import layers, Sequential
from tensorflow.keras.preprocessing.image import ImageDataGenerator

bucket = "classifier-training"
local_dataset_path = "./dataset"
minioClient = Minio(
    'minio:9000',
    access_key='ueuDvLGHm0MYLk3HBykA',
    secret_key='TRIciRIuBQishEoPCgjeMOADzpk6fwmCclmulZ0e',
    region='us-east-1',
    secure=False
)
epochs = 100

def main():
    print("Training started")
    train()

# Trains the model
def train():
    if not os.path.exists(local_dataset_path):
        print("No dataset found in local storage")
        os.mkdir(local_dataset_path)
    
    # Download dataset from Minio
    get_dataset()
    print("Dataset downloaded")
    
    # Image preprocessing without augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2  # 20% of the data for validation
    )

    # Training data generator
    train_generator = train_datagen.flow_from_directory(
        local_dataset_path,  # updated to use local_dataset_path
        target_size=(128, 128),
        batch_size=32,  # updated for better GPU utilization
        class_mode='sparse',
        subset='training'  # Specify training subset
    )
    print("Training data:" + str(train_generator))
    
    # Validation data generator
    validation_generator = train_datagen.flow_from_directory(
        local_dataset_path,  # updated to use local_dataset_path
        target_size=(128, 128),
        batch_size=32,  # updated for better GPU utilization
        class_mode='sparse',
        subset='validation'  # Specify validation subset
    )
    print("Validation data:" + str(validation_generator))
    
    # Get the class labels
    class_labels = list(train_generator.class_indices.keys())
    
    # Convert class labels to JSON and upload to MinIO
    class_labels_json = json.dumps(class_labels)
    json_bytes = class_labels_json.encode('utf-8')
    json_buffer = BytesIO(json_bytes)
    minioClient.put_object("models", "class_labels.json", json_buffer, len(json_bytes))
    
    # Number of labels
    num_labels = len(class_labels)
    
    # Build the model
    model = Sequential([
        layers.Conv2D(64, (3, 3), activation='relu', input_shape=(128, 128, 3)),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(256, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        layers.Conv2D(512, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.5),
        
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        
        layers.Dense(num_labels, activation='softmax')
    ])
    
    # Compile the model
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',  # simplified loss function declaration
                  metrics=['accuracy'])
    
    # Train the model
    model.fit(
        train_generator,
        epochs=epochs,
        validation_data=validation_generator
    )
    
    # Save the model locally and upload to MinIO
    model_save_path = "../models/plant_classifier.keras"
    model.save(model_save_path)
    minioClient.fput_object("models", "plant_classifier.keras", model_save_path)
    
    # Remove local dataset to clean up space
    shutil.rmtree(local_dataset_path)

# Retrieves dataset from blob storage          
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

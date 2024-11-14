import os
from typing import Dict
from PIL import Image
from fastapi import FastAPI, File, UploadFile, status, HTTPException
from minio import Minio
from minio.error import S3Error
from app.plantpulse_ml.PlantClassifier import PlantClassifier
from app.plantpulse_ml.utils import crawler
from app.plantpulse_ml.utils.calculate_NDVI import calculate_NDVI

minioClient = Minio(
    'minio:9000',
    access_key='ueuDvLGHm0MYLk3HBykA',
    secret_key='TRIciRIuBQishEoPCgjeMOADzpk6fwmCclmulZ0e',
    region='us-east-1',
    secure=False
)

plantClassifier = PlantClassifier()

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/plant/predict")
def predictPlant(data: Dict[str, str]):
    image_path = "tmp/image.jpg"
    if "filename" not in data:
        raise HTTPException(status_code=422, detail="Filename missing in the request")
    filename = data['filename']
    minioClient.fget_object('plants', filename, image_path)
    result = plantClassifier.classify(image_path)
    
    # Generate NDVI image and store it.
    calculate_NDVI(image_path)
    minioClient.fput_object('plants', "ndvi_"+ filename, image_path)
    
    os.remove(image_path)
    return {"prediction": result}

@app.post("/training")
async def create_upload(file: UploadFile):
    try:
        result = minioClient.put_object('classifier-training', 
                                        file.filename, 
                                        file.file, 
                                        file.size)
        print(result.etag)
    except S3Error as e:
        print(e)
        return status.HTTP_500_INTERNAL_SERVER_ERROR
        
    if result is not None:
        return status.HTTP_201_CREATED
    else:
        return status.HTTP_409_CONFLICT

@app.post("/train")
def train(data: Dict[str, str]):
    if data["access"] != "admin":
        raise HTTPException(status_code=422, detail="Access denied!")
    if data["epochs"]:
        plantClassifier.train(int(data["epochs"]))
    else:
        plantClassifier.train()

@app.post("/crawl")
async def crawl(data: Dict[str, str]):
    if data["access"] != "admin":
        raise HTTPException(status_code=422, detail="Access denied!")
    await crawler.submit_tasks()
    return status.HTTP_200_OK

@app.get("/health")
def health_check():
    return {"status": "ok"}
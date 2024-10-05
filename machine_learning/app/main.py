import os
from typing import Union, Dict
from PIL import Image
from fastapi import FastAPI, File, UploadFile, status, HTTPException
from minio import Minio
from minio.error import S3Error

from app.plantpulse_ml.PlantClassifier import PlantClassifier
from app.plantpulse_ml.utils import crawler

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
    if "filename" not in data:
        raise HTTPException(status_code=422, detail="Filename missing in the request")
    filename = data['filename']
    minioClient.fget_object('plants', filename, "tmp/image.jpg")
    result = plantClassifier.classify("tmp/image.jpg")
    os.remove("tmp/image.jpg")
    return {"prediction": result}

@app.post("/training/add")
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
import os
import io
import base64
import aiohttp
import asyncio
import json
import re
import requests
import lxml
from celery import Celery
from bs4 import BeautifulSoup
from celery.utils.log import get_task_logger
from minio import Minio
from minio.error import S3Error
from urllib.parse import unquote


# Setup Celery app
celery_app = Celery(
    'tasks',
    broker=f'redis://{ os.getenv("REDIS_PASSWORD") }@redis:6379/0',
    backend=f'redis://default:{ os.getenv("REDIS_PASSWORD") }@redis:6379/0'
)
logger = get_task_logger(__name__)

# MinIO configuration
MINIO_URL = 'minio:9000'
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY')
MINIO_BUCKET = 'classifier-training'

# Setup MinIO client
minio_client = Minio(
    MINIO_URL,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

# Create the bucket if it doesn't exist
if not minio_client.bucket_exists(MINIO_BUCKET):
    minio_client.make_bucket(MINIO_BUCKET)

# Define base image search URL for Google Images
GOOGLE_SEARCH_URL = "https://www.google.com/search?q={query}&tbm=isch"

# Set concurrency limit for async requests
CONCURRENCY_LIMIT = 5  # Number of concurrent downloads
semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

# Set per class image limit
IMG_LIMIT = 100


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3, 'countdown': 60})
def download_plant_images(self, plant_name):
    logger.info(f"Starting download for plant: {plant_name}")
    try:
        asyncio.run(scrape_and_download_images(plant_name))
    except Exception as e:
        logger.error(f"Error downloading images for {plant_name}: {e}")
        raise self.retry(exc=e)

async def scrape_and_download_images(plant_name):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    params = {
        "q": plant_name,
        "tbm": "isch",
        "hl": "en",
        "gl": "us"
    }
    
    try:
        response = requests.get("https://google.com/search", params=params, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        
        all_script_tags = soup.select("script")
    
        # https://regex101.com/r/RPIbXK/1
        matched_images_data = "".join(re.findall(r"AF_initDataCallback\(([^<]+)\);", str(all_script_tags)))
        matched_images_data_fix = json.dumps(matched_images_data)
        matched_images_data_json = json.loads(matched_images_data_fix)
        logger.info(matched_google_image_data)
        # https://regex101.com/r/NRKEmV/1
        matched_google_image_data = re.findall(r'\"b-GRID_STATE0\"(.*)sideChannel:\s?{}}', matched_images_data_json)
 
        # https://regex101.com/r/SxwJsW/1
        matched_google_images_thumbnails = ", ".join(
            re.findall(r'\[\"(https\:\/\/encrypted-tbn0\.gstatic\.com\/images\?.*?)\",\d+,\d+\]',
                            str(matched_google_image_data))).split(", ")
        
        thumbnails = [bytes(bytes(thumbnail, "ascii").decode("unicode-escape"), "ascii").decode("unicode-escape") for thumbnail in matched_google_images_thumbnails]
        
        removed_matched_google_images_thumbnails = re.sub(
            r'\[\"(https\:\/\/encrypted-tbn0\.gstatic\.com\/images\?.*?)\",\d+,\d+\]', "", str(matched_google_image_data))
        matched_google_full_resolution_images = re.findall(r"(?:'|,),\[\"(https:|http.*?)\",\d+,\d+\]", removed_matched_google_images_thumbnails)
        full_res_images = [unquote(img) for img in matched_google_full_resolution_images]

        img_urls = full_res_images[:IMG_LIMIT]  # Limit to the required number of images
        
        async with aiohttp.ClientSession() as session:
            tasks = [download_image(session, img_url, plant_name, str(idx)) for idx, img_url in enumerate(img_urls)]
            await asyncio.gather(*tasks)
        
    except requests.RequestException as e:
        logger.error(f"Error fetching search results: {str(e)}")
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON data: {str(e)}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {str(e)}")

async def download_image(session, img_url, plant_name, filename):
    async with semaphore:
        try:
            await asyncio.sleep(1)  # Throttle: Add a 1-second delay between downloads
            logger.info(f"Downloading {img_url}")
            # Check if the URL is a data URI
            if img_url.startswith("data:image"):
                # Handle data URI
                header, encoded = img_url.split(",", 1)
                image_data = base64.b64decode(encoded)
                content_type = header.split(";")[0].split(":")[1]  # Extract content type
            else:
                # Download image from URL
                async with session.get(img_url) as resp:
                    if resp.status == 200:
                        image_data = await resp.read()
                        content_type = resp.headers.get("Content-Type", "application/octet-stream")
                    else:
                        logger.warning(f"Failed to download {filename}: HTTP {resp.status}")
                        return None

            # Upload to MinIO
            try:
                minio_client.put_object(
                    MINIO_BUCKET,
                    f"{plant_name}/{filename}",
                    io.BytesIO(image_data),
                    len(image_data),
                    content_type=content_type
                )
                logger.info(f"Uploaded {filename} to MinIO")
                return f"{plant_name}/{filename}"
            except S3Error as e:
                logger.error(f"Failed to upload {filename} to MinIO: {e}")
                return None

        except aiohttp.ClientError as e:
            logger.error(f"Failed to download {filename} from {img_url}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error while processing {filename}: {e}")
        
        return None
import os
from celery import Celery

# Setup Celery app - this is the same configuration as in your workers
celery_app = Celery(
    'tasks',
    broker='redis://{ os.getenv(REDIS_PASSWORD) }@redis:6379/0'  # Ensure this matches your worker configuration
)

# List of plants to download images for
plants = [
    "English Ivy", 
    "Pixie Dixie Ivy", "Tulip", "Sunflower"
]  # Add more plant names as needed

async def submit_tasks():
    for plant in plants:
        # Submit the task to the Celery workers via the broker
        celery_app.send_task('tasks.download_plant_images', args=[plant])
        print(f"Submitted task for {plant}")

if __name__ == "__main__":
    submit_tasks()

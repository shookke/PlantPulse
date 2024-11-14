import os
import cv2
import numpy as np
from app.plantpulse_ml.utils.fastiecm import fastiecm

def calculate_NDVI(path):
    image = cv2.imread(path) # load image
    image = np.array(image, dtype=float)/float(255) # convert to an array
    contrasted = contrast_stretch(image) # contrast
    ndvi = calc_ndvi(contrasted)
    ndvi_contrasted = contrast_stretch(ndvi)
    color_mapped_prep = ndvi_contrasted.astype(np.uint8)
    color_mapped_image = cv2.applyColorMap(color_mapped_prep, fastiecm)
    cv2.imwrite(path, color_mapped_image)
    return
    
def contrast_stretch(im):
    in_min = np.percentile(im, 5)
    in_max = np.percentile(im, 95)

    out_min = 0.0
    out_max = 255.0

    out = im - in_min
    out *= ((out_min - out_max) / (in_min - in_max))
    out += in_min
    
    return out

def calc_ndvi(image):
    b, g, r = cv2.split(image)
    bottom = (r.astype(float) + b.astype(float))
    bottom[bottom==0] = 0.01
    ndvi = (b.astype(float) - r) / bottom
    return ndvi

if __name__ == "__main__":
    calculate_NDVI()
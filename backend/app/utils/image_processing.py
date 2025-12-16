import cv2
import numpy as np
import io

def adjust_contrast(image: np.ndarray, factor: float) -> np.ndarray:
    return cv2.convertScaleAbs(image, alpha=factor, beta=0)

def denoise(image: np.ndarray, strength: int) -> np.ndarray:
    if strength <= 0:
        return image
    return cv2.fastNlMeansDenoisingColored(image, None, strength, strength, 7, 21)

def remove_motion_blur(image: np.ndarray, size: int, angle: float) -> np.ndarray:
    kernel = np.zeros((size, size))
    kernel[int((size-1)/2), :] = np.ones(size)
    kernel = cv2.warpAffine(kernel, cv2.getRotationMatrix2D((size/2, size/2), angle, 1.0), (size, size))
    kernel = kernel / np.sum(kernel)
    return cv2.filter2D(image, -1, kernel)

def adjust_brightness(image: np.ndarray, factor: float) -> np.ndarray:
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:,:,2] = np.clip(hsv[:,:,2] * factor, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

def adjust_saturation(image: np.ndarray, factor: float) -> np.ndarray:
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:,:,1] = np.clip(hsv[:,:,1] * factor, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

def sharpen(image: np.ndarray, factor: float) -> np.ndarray:
    if factor <= 0:
        return image
    # Blend between original and sharpened based on factor
    kernel = np.array([[0,-1,0], [-1,5,-1], [0,-1,0]], dtype=np.float32)
    sharpened = cv2.filter2D(image, -1, kernel)
    return cv2.addWeighted(image, 1 - factor, sharpened, factor, 0)

def process_image(image_bytes: bytes, operations: list) -> bytes:
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    for operation in operations:
        func = operation['function']
        params = operation['params']
        
        if func == 'adjust_contrast':
            image = adjust_contrast(image, params['factor'])
        elif func == 'denoise':
            image = denoise(image, params['strength'])
        elif func == 'remove_motion_blur':
            image = remove_motion_blur(image, params['size'], params['angle'])
        elif func == 'adjust_brightness':
            image = adjust_brightness(image, params['factor'])
        elif func == 'adjust_saturation':
            image = adjust_saturation(image, params['factor'])
        elif func == 'sharpen':
            image = sharpen(image, params['factor'])
    
    _, buffer = cv2.imencode('.png', image)
    return io.BytesIO(buffer).getvalue()
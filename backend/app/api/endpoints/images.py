import base64
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from app.utils.image_processing import process_image
from typing import Optional
import json

router = APIRouter()


@router.post("/process")
async def process_image_endpoint(
    file: UploadFile = File(...),
    operations: str = Form(default="[]")
):
    """
    Process an image with the specified operations.
    
    Operations format (JSON string):
    [
        {"function": "adjust_contrast", "params": {"factor": 1.5}},
        {"function": "adjust_brightness", "params": {"factor": 1.2}},
        {"function": "adjust_saturation", "params": {"factor": 1.3}},
        {"function": "sharpen", "params": {"factor": 1.0}},
        {"function": "denoise", "params": {"strength": 10}}
    ]
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image")
    
    try:
        # Parse operations
        ops_list = json.loads(operations)
        
        # Read image bytes
        contents = await file.read()
        
        # Process image
        processed_bytes = process_image(contents, ops_list)
        
        # Return as base64
        encoded = base64.b64encode(processed_bytes).decode("utf-8")
        return {"image": f"data:image/png;base64,{encoded}"}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid operations JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process/download")
async def process_and_download(
    file: UploadFile = File(...),
    operations: str = Form(default="[]")
):
    """
    Process an image and return it directly as a downloadable file.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image")
    
    try:
        ops_list = json.loads(operations)
        contents = await file.read()
        processed_bytes = process_image(contents, ops_list)
        
        return Response(
            content=processed_bytes,
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=pixelai_processed.png"}
        )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid operations JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

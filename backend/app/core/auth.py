from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
import requests
import os

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWT_PUBLIC_KEY_URL = "https://api.clerk.dev/v1/jwks"

def get_clerk_public_keys():
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.get(CLERK_JWT_PUBLIC_KEY_URL, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Clerk's public keys.")
    jwks = response.json()
    return {key["kid"]: key for key in jwks["keys"]}

clerk_public_keys = get_clerk_public_keys()

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        headers = jwt.get_unverified_header(token)
        kid = headers["kid"]

        if kid not in clerk_public_keys:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials.")

        public_key = clerk_public_keys[kid]
        key = jwk.construct(public_key)

        message, encoded_signature = str(token).rsplit('.', 1)
        decoded_signature = base64url_decode(encoded_signature.encode())

        if not key.verify(message.encode(), decoded_signature):
            raise HTTPException(status_code=401, detail="Invalid authentication credentials.")

        payload = jwt.get_unverified_claims(token)
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials.") from e
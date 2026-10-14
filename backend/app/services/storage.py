"""Image storage backend — local and Cloudinary."""
from __future__ import annotations
import io
import uuid
from pathlib import Path

from PIL import Image

from app.config import settings


def _ext_from_content_type(content_type: str) -> str:
    mapping = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    return mapping.get(content_type.lower(), "jpg")


class LocalStorageBackend:
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_image(
        self, file_bytes: bytes, filename: str, content_type: str
    ) -> tuple[str, str, str]:
        ext = _ext_from_content_type(content_type)
        rand_name = f"{uuid.uuid4().hex}.{ext}"
        thumb_name = f"thumb_{rand_name}"

        dest = self.upload_dir / rand_name
        thumb_dest = self.upload_dir / thumb_name

        # Save original
        dest.write_bytes(file_bytes)

        # Generate thumbnail
        img = Image.open(io.BytesIO(file_bytes))
        img.thumbnail((400, 400))
        img.save(str(thumb_dest))

        url = f"/media/{rand_name}"
        thumb_url = f"/media/{thumb_name}"
        public_id = rand_name  # used as identifier for deletion
        return url, thumb_url, public_id

    async def delete_image(self, public_id: str) -> None:
        for name in [public_id, f"thumb_{public_id}"]:
            path = self.upload_dir / name
            if path.exists():
                path.unlink()


class CloudinaryBackend:
    def __init__(self):
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(cloudinary_url=settings.cloudinary_url)
        self._uploader = cloudinary.uploader

    async def save_image(
        self, file_bytes: bytes, filename: str, content_type: str
    ) -> tuple[str, str, str]:
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file_bytes,
            folder="campusmart",
            resource_type="image",
        )
        public_id = result["public_id"]
        url = result["secure_url"]
        # Thumbnail with Cloudinary transformation
        thumb_url = url.replace("/upload/", "/upload/w_400,h_400,c_limit/")
        return url, thumb_url, public_id

    async def delete_image(self, public_id: str) -> None:
        import cloudinary.uploader
        cloudinary.uploader.destroy(public_id)


def get_storage() -> LocalStorageBackend | CloudinaryBackend:
    if settings.cloudinary_url:
        return CloudinaryBackend()
    return LocalStorageBackend()

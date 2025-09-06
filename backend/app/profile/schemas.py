from pydantic import BaseModel, ConfigDict
from typing import List


class DownloadableProduct(BaseModel):
    id: int
    title: str
    description: str
    main_image_url: str
    zip_file_path: str

    model_config = ConfigDict(from_attributes=True)


class DownloadsResponse(BaseModel):
    products: List[DownloadableProduct]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.products.models import Product
from app.collections.models import Collection, collection_products
from app.collections.schemas import (
    CollectionCreate, CollectionResponse, CollectionDetailResponse, ProductInCollectionResponse
)
from app.core.translations import get_text

router = APIRouter(prefix="/collections", tags=["Collections"])


@router.get("/product-ids", response_model=dict)
async def get_favorited_product_ids(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(collection_products.c.product_id)
        .join(Collection)
        .where(Collection.user_id == current_user.id)
        .distinct()
    )
    result = await db.execute(query)
    favorited_ids = result.scalars().all()
    return {"favorited_ids": favorited_ids}


@router.get("", response_model=List[CollectionResponse])
async def get_user_collections(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    query = (
        select(Collection, func.count(Product.id).label("products_count"))
        .outerjoin(Collection.products)
        .where(Collection.user_id == current_user.id)
        .group_by(Collection.id)
        .order_by(Collection.created_at.desc())
    )
    result = await db.execute(query)

    collections_data = []
    for collection, count in result.all():
        collections_data.append(CollectionResponse(
            id=collection.id,
            name=collection.name,
            color=collection.color,
            created_at=collection.created_at,
            products_count=count
        ))

    return collections_data


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
        collection_data: CollectionCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    lang = current_user.language_code or "uk"

    collections_count_result = await db.execute(
        select(func.count(Collection.id)).where(Collection.user_id == current_user.id)
    )
    collections_count = collections_count_result.scalar_one_or_none() or 0
    if collections_count >= 9:
        raise HTTPException(
            status_code=400,
            detail=get_text("collection_error_limit_reached", lang)
        )

    existing_collection_result = await db.execute(
        select(Collection).where(Collection.user_id == current_user.id, Collection.name == collection_data.name)
    )
    if existing_collection_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=get_text("collection_error_name_exists", lang)
        )

    new_collection = Collection(**collection_data.model_dump(), user_id=current_user.id)
    db.add(new_collection)
    await db.commit()
    await db.refresh(new_collection)

    response = CollectionResponse(
        id=new_collection.id,
        name=new_collection.name,
        color=new_collection.color,
        created_at=new_collection.created_at,
        products_count=0
    )
    return response


@router.get("/{collection_id}", response_model=CollectionDetailResponse)
async def get_collection_details(
        collection_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    lang = current_user.language_code or "uk"

    result = await db.execute(
        select(Collection).options(selectinload(Collection.products).selectinload(Product.translations))
        .where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(
            status_code=404,
            detail=get_text("collection_error_not_found", lang)
        )

    products_list = []
    for p in collection.products:
        translation = p.get_translation(lang)
        if translation:
            products_list.append(ProductInCollectionResponse(
                id=p.id,
                title=translation.title,
                description=translation.description,
                main_image_url=p.main_image_url,
                price=float(p.get_actual_price()),
                product_type=p.product_type.value
            ))

    response = CollectionDetailResponse(
        id=collection.id,
        name=collection.name,
        color=collection.color,
        created_at=collection.created_at,
        products_count=len(products_list),
        products=products_list
    )
    return response


@router.post("/{collection_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_product_to_collection(
        collection_id: int,
        product_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    lang = current_user.language_code or "uk"

    result = await db.execute(
        select(Collection).options(selectinload(Collection.products)).where(Collection.id == collection_id,
                                                                            Collection.user_id == current_user.id))
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(
            status_code=404,
            detail=get_text("collection_error_not_found", lang)
        )

    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail=get_text("collection_error_product_not_found", lang)
        )

    if product not in collection.products:
        collection.products.append(product)
        await db.commit()

    return


@router.delete("/{collection_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product_from_collection(
        collection_id: int,
        product_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    lang = current_user.language_code or "uk"

    result = await db.execute(
        select(Collection).options(selectinload(Collection.products)).where(Collection.id == collection_id,
                                                                            Collection.user_id == current_user.id))
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(
            status_code=404,
            detail=get_text("collection_error_not_found", lang)
        )

    product_to_remove = next((p for p in collection.products if p.id == product_id), None)

    if product_to_remove:
        collection.products.remove(product_to_remove)
        await db.commit()

    return


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
        collection_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    lang = current_user.language_code or "uk"

    result = await db.execute(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("collection_error_not_found", lang)
        )

    await db.delete(collection)
    await db.commit()
    return
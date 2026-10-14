"""Wishlist tests."""
import pytest


def test_wishlist_lifecycle(client, student_headers, seller_headers):
    # Seller creates listing
    create_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Wishlist Test Book",
            "description": "Book for testing wishlist functionality",
            "price": "500.00",
            "condition": "like_new",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = create_resp.json()["id"]

    # Student adds to wishlist
    add_resp = client.post(f"/api/v1/wishlist/{listing_id}", headers=student_headers)
    assert add_resp.status_code == 200

    # Idempotent re-add
    add_again = client.post(f"/api/v1/wishlist/{listing_id}", headers=student_headers)
    assert add_again.status_code == 200

    # Check wishlist items
    get_resp = client.get("/api/v1/wishlist", headers=student_headers)
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert len(items) == 1
    assert items[0]["listing"]["id"] == listing_id

    # Remove from wishlist
    del_resp = client.delete(f"/api/v1/wishlist/{listing_id}", headers=student_headers)
    assert del_resp.status_code == 200

    # Verify empty
    get_empty = client.get("/api/v1/wishlist", headers=student_headers)
    assert len(get_empty.json()) == 0


def test_cannot_wishlist_own_listing(client, seller_headers):
    create_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Own Listing Book",
            "description": "Testing self wishlist prevention",
            "price": "200.00",
            "condition": "good",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = create_resp.json()["id"]

    resp = client.post(f"/api/v1/wishlist/{listing_id}", headers=seller_headers)
    assert resp.status_code == 400
    assert "own listing" in resp.json()["detail"].lower()

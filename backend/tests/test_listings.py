"""Listing tests."""
import pytest


def test_create_listing_seller(client, seller_headers):
    resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Computer Networks Tanenbaum 5th Ed",
            "description": "Standard networking textbook with zero markings.",
            "price": "450.00",
            "condition": "like_new",
            "quantity": 2,
            "category_id": 1,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Computer Networks Tanenbaum 5th Ed"
    assert float(data["price"]) == 450.00
    assert data["quantity"] == 2


def test_create_listing_non_seller_forbidden(client, student_headers):
    resp = client.post(
        "/api/v1/listings",
        headers=student_headers,
        json={
            "title": "Attempt to sell without storefront",
            "description": "Should be rejected with 403.",
            "price": "100.00",
            "condition": "good",
            "quantity": 1,
        },
    )
    assert resp.status_code == 403


def test_prohibited_keyword_rejected(client, seller_headers):
    resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Alcohol bottle and drink party pack",
            "description": "Party drink on campus",
            "price": "500.00",
            "condition": "new",
            "quantity": 1,
        },
    )
    assert resp.status_code == 422
    assert "prohibited" in resp.json()["detail"].lower()


def test_search_and_filters(client, seller_headers):
    # Create test listings
    client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Data Structures Algorithms in Python",
            "description": "DSA textbook",
            "price": "300.00",
            "condition": "good",
            "quantity": 1,
            "category_id": 1,
        },
    )
    client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Digital Electronics Floyd",
            "description": "Circuits and logic gates",
            "price": "600.00",
            "condition": "new",
            "quantity": 1,
            "category_id": 1,
        },
    )

    # Search keyword
    res = client.get("/api/v1/listings?q=structures")
    assert res.status_code == 200
    assert len(res.json()["items"]) == 1
    assert "Data Structures" in res.json()["items"][0]["title"]

    # Filter by price range
    res_price = client.get("/api/v1/listings?min_price=500")
    assert res_price.status_code == 200
    assert len(res_price.json()["items"]) == 1
    assert "Digital Electronics" in res_price.json()["items"][0]["title"]


def test_view_count_increments(client, seller_headers):
    create_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Operating Systems Sixth Edition",
            "description": "OS concepts",
            "price": "250.00",
            "condition": "fair",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = create_resp.json()["id"]

    r1 = client.get(f"/api/v1/listings/{listing_id}")
    assert r1.status_code == 200
    assert r1.json()["view_count"] >= 1

    r2 = client.get(f"/api/v1/listings/{listing_id}")
    assert r2.status_code == 200
    assert r2.json()["view_count"] >= 2

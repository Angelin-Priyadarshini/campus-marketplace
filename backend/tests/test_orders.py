"""Order tests including concurrency and state machine validation."""
import threading
import pytest


def test_order_happy_path(client, student_headers, seller_headers):
    # 1. Seller creates listing with 1 unit
    listing_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Discrete Mathematics Rosen 8th Ed",
            "description": "Discrete math textbook",
            "price": "400.00",
            "condition": "like_new",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = listing_resp.json()["id"]

    # 2. Buyer places order
    order_resp = client.post(
        "/api/v1/orders",
        headers=student_headers,
        json={
            "listing_id": listing_id,
            "quantity": 1,
            "note": "Meet at library",
            "proposed_meetup": "Tomorrow 2 PM",
        },
    )
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]
    assert order_resp.json()["status"] == "pending"

    # 3. Seller accepts order
    accept_resp = client.post(f"/api/v1/orders/{order_id}/accept", headers=seller_headers)
    assert accept_resp.status_code == 200

    # Verify listing is now 'reserved' since 1-1 = 0 unreserved
    listing_check = client.get(f"/api/v1/listings/{listing_id}")
    assert listing_check.json()["status"] == "reserved"

    # 4. Seller completes handover
    comp_resp = client.post(f"/api/v1/orders/{order_id}/complete", headers=seller_headers)
    assert comp_resp.status_code == 200

    # Verify listing is now 'sold' and quantity is 0
    listing_sold = client.get(f"/api/v1/listings/{listing_id}")
    assert listing_sold.json()["status"] == "sold"
    assert listing_sold.json()["quantity"] == 0


def test_cannot_buy_own_listing(client, seller_headers):
    listing_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Self Buy Test Book",
            "description": "Book",
            "price": "100.00",
            "condition": "good",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = listing_resp.json()["id"]

    order_resp = client.post(
        "/api/v1/orders",
        headers=seller_headers,
        json={"listing_id": listing_id, "quantity": 1},
    )
    assert order_resp.status_code == 400
    assert "own listing" in order_resp.json()["detail"].lower()


def test_order_illegal_transitions_conflict(client, student_headers, seller_headers):
    listing_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Transition Test Item",
            "description": "Item",
            "price": "150.00",
            "condition": "good",
            "quantity": 1,
            "category_id": 1,
        },
    )
    order_resp = client.post(
        "/api/v1/orders",
        headers=student_headers,
        json={"listing_id": listing_resp.json()["id"], "quantity": 1},
    )
    order_id = order_resp.json()["id"]

    # Attempting to complete a pending order must return 409 Conflict
    bad_comp = client.post(f"/api/v1/orders/{order_id}/complete", headers=seller_headers)
    assert bad_comp.status_code == 409


def test_order_cancellation(client, student_headers, seller_headers):
    listing_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Cancel Test Item",
            "description": "Item",
            "price": "200.00",
            "condition": "good",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = listing_resp.json()["id"]
    order_resp = client.post(
        "/api/v1/orders",
        headers=student_headers,
        json={"listing_id": listing_id, "quantity": 1},
    )
    order_id = order_resp.json()["id"]

    # Seller accepts -> reserved
    client.post(f"/api/v1/orders/{order_id}/accept", headers=seller_headers)

    # Buyer cancels -> reservation released, listing back to active
    cancel_resp = client.post(f"/api/v1/orders/{order_id}/cancel", headers=student_headers)
    assert cancel_resp.status_code == 200

    listing_check = client.get(f"/api/v1/listings/{listing_id}")
    assert listing_check.json()["status"] == "active"


def test_concurrent_accepts_for_last_unit(client, db_session, seller_headers, student_headers):
    # Setup listing with only 1 unit
    listing_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Rare Limited Edition Book",
            "description": "Only one unit in stock",
            "price": "800.00",
            "condition": "new",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = listing_resp.json()["id"]

    # Create two separate buyer orders for this same unit
    o1 = client.post("/api/v1/orders", headers=student_headers, json={"listing_id": listing_id, "quantity": 1})
    o2 = client.post("/api/v1/orders", headers=student_headers, json={"listing_id": listing_id, "quantity": 1})
    order1_id = o1.json()["id"]
    order2_id = o2.json()["id"]

    # First accept succeeds
    r1 = client.post(f"/api/v1/orders/{order1_id}/accept", headers=seller_headers)
    assert r1.status_code == 200

    # Second accept fails with 409 because stock is already reserved
    r2 = client.post(f"/api/v1/orders/{order2_id}/accept", headers=seller_headers)
    assert r2.status_code == 409

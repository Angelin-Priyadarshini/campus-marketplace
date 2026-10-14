"""Review tests."""
import pytest


def test_review_lifecycle(client, student_headers, seller_headers):
    # Setup listing & order
    l_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Review Target Item",
            "description": "Item",
            "price": "300.00",
            "condition": "like_new",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = l_resp.json()["id"]

    o_resp = client.post("/api/v1/orders", headers=student_headers, json={"listing_id": listing_id, "quantity": 1})
    order_id = o_resp.json()["id"]

    # 1. Attempting review while order is pending fails
    rev_early = client.post(
        f"/api/v1/orders/{order_id}/reviews",
        headers=student_headers,
        json={"rating": 5, "comment": "Too early review"},
    )
    assert rev_early.status_code == 400

    # 2. Advance order to completed
    client.post(f"/api/v1/orders/{order_id}/accept", headers=seller_headers)
    client.post(f"/api/v1/orders/{order_id}/complete", headers=seller_headers)

    # 3. Buyer submits review
    rev_resp = client.post(
        f"/api/v1/orders/{order_id}/reviews",
        headers=student_headers,
        json={"rating": 5, "comment": "Great experience!"},
    )
    assert rev_resp.status_code == 201
    review_id = rev_resp.json()["id"]
    assert rev_resp.json()["rating"] == 5

    # 4. Duplicate review in same direction fails
    dup_rev = client.post(
        f"/api/v1/orders/{order_id}/reviews",
        headers=student_headers,
        json={"rating": 4, "comment": "Duplicate attempt"},
    )
    assert dup_rev.status_code == 409

    # 5. Seller replies to review
    reply_resp = client.post(
        f"/api/v1/reviews/{review_id}/reply",
        headers=seller_headers,
        json={"reply": "Thank you for buying!"},
    )
    assert reply_resp.status_code == 200

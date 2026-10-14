"""Conversation and messaging tests."""
import pytest


def test_conversation_lifecycle(client, student_headers, seller_headers):
    # Setup listing
    l_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Chat Target Item",
            "description": "Item",
            "price": "200.00",
            "condition": "good",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = l_resp.json()["id"]

    # 1. Buyer creates conversation
    conv_resp = client.post(
        "/api/v1/conversations",
        headers=student_headers,
        json={"listing_id": listing_id},
    )
    assert conv_resp.status_code == 201
    conv_id = conv_resp.json()["id"]

    # 2. Buyer sends message
    msg_resp = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers=student_headers,
        json={"body": "Hello, is this item available?"},
    )
    assert msg_resp.status_code == 200
    assert msg_resp.json()["body"] == "Hello, is this item available?"

    # 3. Seller checks unread count
    unread_resp = client.get("/api/v1/conversations/unread-count", headers=seller_headers)
    assert unread_resp.status_code == 200
    assert unread_resp.json()["unread_count"] >= 1

    # 4. Seller marks conversation as read
    read_resp = client.post(f"/api/v1/conversations/{conv_id}/read", headers=seller_headers)
    assert read_resp.status_code == 200

    # 5. Seller checks unread count again -> should be 0
    unread_after = client.get("/api/v1/conversations/unread-count", headers=seller_headers)
    assert unread_after.json()["unread_count"] == 0


def test_cannot_message_own_listing(client, seller_headers):
    l_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Self Message Item",
            "description": "Item",
            "price": "100.00",
            "condition": "good",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = l_resp.json()["id"]

    resp = client.post(
        "/api/v1/conversations",
        headers=seller_headers,
        json={"listing_id": listing_id},
    )
    assert resp.status_code == 400

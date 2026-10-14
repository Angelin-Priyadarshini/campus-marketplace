"""Admin and moderation tests."""
import pytest


def test_admin_hide_listing_via_report(client, student_headers, seller_headers, admin_headers):
    # Setup listing
    l_resp = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Reported Spam Item",
            "description": "Item",
            "price": "50.00",
            "condition": "fair",
            "quantity": 1,
            "category_id": 1,
        },
    )
    listing_id = l_resp.json()["id"]

    # Student files report
    rep_resp = client.post(
        "/api/v1/reports",
        headers=student_headers,
        json={
            "target_type": "listing",
            "target_id": listing_id,
            "reason": "spam",
            "details": "Spam listing",
        },
    )
    assert rep_resp.status_code == 201
    report_id = rep_resp.json()["id"]

    # Admin resolves report by hiding listing
    res_resp = client.post(
        f"/api/v1/admin/reports/{report_id}/resolve",
        headers=admin_headers,
        json={"action": "hide_listing", "note": "Verified spam content"},
    )
    assert res_resp.status_code == 200

    # Listing must not appear in public active search
    search_resp = client.get("/api/v1/listings?q=Spam")
    assert search_resp.status_code == 200
    assert len(search_resp.json()["items"]) == 0


def test_admin_suspend_user_blocks_login(client, student_user, admin_headers):
    # Admin suspends user
    susp_resp = client.post(f"/api/v1/admin/users/{student_user.id}/suspend", headers=admin_headers)
    assert susp_resp.status_code == 200

    # Attempt login -> 403
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "Student@123"},
    )
    assert login_resp.status_code == 403
    assert "suspended" in login_resp.json()["detail"].lower()


def test_admin_stats(client, admin_headers):
    stats_resp = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_resp.status_code == 200
    data = stats_resp.json()
    assert "total_users" in data
    assert "orders_by_status" in data

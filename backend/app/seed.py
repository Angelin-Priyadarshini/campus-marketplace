"""Idempotent seed script for CampusMart marketplace."""
from __future__ import annotations
import io
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
import random

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from PIL import Image, ImageDraw, ImageFont
from sqlalchemy import select

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models.category import Category
from app.models.conversation import Conversation, Message
from app.models.listing import Listing, ListingImage, WishlistItem
from app.models.notification import Notification
from app.models.order import Order, OrderEvent
from app.models.report import Report
from app.models.review import Review
from app.models.store import Store
from app.models.user import User
from app.security import hash_password
from app.services.ratings import recompute_buyer_rating, recompute_store_rating


def create_placeholder_image(text: str, bg_color: tuple, fg_color: tuple = (255, 255, 255)) -> tuple[str, str]:
    """Generate a clean fallback image and thumbnail."""
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    img = Image.new("RGB", (600, 450), color=bg_color)
    draw = ImageDraw.Draw(img)

    draw.rectangle([20, 20, 580, 430], outline=(255, 255, 255, 128), width=3)
    display_text = text[:30]
    draw.text((300, 225), display_text, fill=fg_color, anchor="mm")

    filename = f"seed_{uuid.uuid4().hex[:12]}.jpg"
    thumb_name = f"thumb_{filename}"

    dest = upload_dir / filename
    thumb_dest = upload_dir / thumb_name

    img.save(str(dest), format="JPEG", quality=85)
    img.thumbnail((300, 225))
    img.save(str(thumb_dest), format="JPEG", quality=80)

    return f"/media/{filename}", f"/media/{thumb_name}"


CATEGORIES_DATA = [
    ("Textbooks", "textbooks", "📚", 1),
    ("Notes & Study Material", "notes-study-material", "📝", 2),
    ("Electronics", "electronics", "🔌", 3),
    ("Laptops & Accessories", "laptops-accessories", "💻", 4),
    ("Hostel & Dorm Essentials", "hostel-dorm-essentials", "🏠", 5),
    ("Furniture", "furniture", "🪑", 6),
    ("Stationery & Lab Equipment", "stationery-lab-equipment", "🔬", 7),
    ("Clothing & Uniforms", "clothing-uniforms", "👕", 8),
    ("Sports & Fitness", "sports-fitness", "⚽", 9),
    ("Bicycles & Transport", "bicycles-transport", "🚲", 10),
    ("Other", "other", "📦", 11),
]

STUDENTS_DATA = [
    ("priya@ssn.edu.in", "Priya Sundaram", "Information Technology", 2),
    ("karthik@ssn.edu.in", "Karthik Raja", "Computer Science", 4),
    ("ravi@ssn.edu.in", "Ravi Teja", "Mechanical Engineering", 3),
    ("divya@ssn.edu.in", "Divya Krishnan", "Electronics & Communication", 2),
    ("arjun@ssn.edu.in", "Arjun Reddy", "Civil Engineering", 4),
    ("meera@ssn.edu.in", "Meera Nair", "Chemical Engineering", 3),
    ("vijay@ssn.edu.in", "Vijay Sharma", "Electrical Engineering", 1),
    ("sana@ssn.edu.in", "Sana Parveen", "Biomedical Engineering", 2),
]

STUDENTS_AVATARS = {
    "priya@ssn.edu.in": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    "karthik@ssn.edu.in": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    "ravi@ssn.edu.in": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    "divya@ssn.edu.in": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    "arjun@ssn.edu.in": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    "meera@ssn.edu.in": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    "vijay@ssn.edu.in": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    "sana@ssn.edu.in": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    "admin@ssn.edu.in": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
}

STOREFRONTS_DATA = {
    "karthik@ssn.edu.in": (
        "Karthik's Tech & Books Hub",
        "Graduating final year CSE student clearing out high quality CS core textbooks, dev kits, and desk peripherals. Fast handover at Hostel 3 or IT Dept.",
        "Hostel 3 Common Room / IT Dept Block",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80",
    ),
    "divya@ssn.edu.in": (
        "Divya's Study Haven",
        "ECE 2nd year. Providing curated engineering semester notes, formula cheat sheets, calculators, and lab tools in pristine condition.",
        "Girls Hostel Block B Lobby / Central Library",
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80",
    ),
    "arjun@ssn.edu.in": (
        "Arjun's Dorm & Sports Depot",
        "Final year civil student moving out. Selling well-maintained room furniture, sports gear, cycles, and lab drafters.",
        "Hostel 1 Gate / Sports Complex",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80",
    ),
    "meera@ssn.edu.in": (
        "Meera's Campus Corner",
        "Chemical 3rd year. Textbooks, dorm appliances, and stationery essentials. DM for quick meetups between lectures!",
        "Student Activity Centre (SAC) / Mech Canteen",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80",
    ),
}

# Authentic, curated high-resolution photography for all 42 products
LISTINGS_DATA = [
    # Textbooks (Cat 1)
    (
        "Operating System Concepts (Silberschatz 10th Ed)",
        "Authoritative OS textbook with zero page markings. Perfect for UIT2739 and 3rd sem CS/IT students. Hardcover, completely intact.",
        Decimal("450.00"), "like_new", 2, 1, (41, 128, 185),
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Engineering Mathematics - B.S. Grewal (44th Edition)",
        "Must-have higher engineering math textbook with step-by-step solved problems for Sem 1 and 2. Essential for Anna Univ syllabus.",
        Decimal("380.00"), "good", 1, 1, (39, 174, 96),
        "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Data Structures & Algorithms in Java - Goodrich",
        "Standard reference textbook for DSA coursework. Clean pages with minimal pencil underlines. Includes code snippets.",
        Decimal("320.00"), "good", 1, 1, (142, 68, 173),
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Computer Networks - Andrew Tanenbaum (5th Ed)",
        "Classic networks book covering TCP/IP stack in detail. Binding completely intact. No torn pages.",
        Decimal("400.00"), "like_new", 1, 1, (22, 160, 133),
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Database System Concepts - Korth & Sudarshan",
        "DBMS standard book for IT/CSE. Highly recommended for internals, SQL queries, and end-sem prep.",
        Decimal("350.00"), "fair", 1, 1, (211, 84, 0),
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80"
    ),

    # Notes & Study Material (Cat 2)
    (
        "Handwritten Full Semester OS & Networks Lecture Notes",
        "Spiral-bound handwritten lecture notes with past university exam questions solved neatly with diagrams.",
        Decimal("150.00"), "like_new", 3, 2, (52, 73, 94),
        "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Gate CSE 2026 Comprehensive Formula Sheets & Mindmaps",
        "Full GATE syllabus cheat sheets covering Algorithms, Discrete Maths, Compiler Design, and COA.",
        Decimal("200.00"), "new", 5, 2, (192, 57, 43),
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Digital Signal Processing Lab Manual & Solved Assignments",
        "Complete ECE 4th sem DSP lab MATLAB codes, spectra plots, and observation calculations verified by faculty.",
        Decimal("120.00"), "good", 2, 2, (127, 140, 141),
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Engineering Physics & Chemistry Solved Question Bank",
        "Compilation of last 5 years SSN semester exam question papers with detailed step-by-step solutions.",
        Decimal("100.00"), "like_new", 4, 2, (243, 156, 18),
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80"
    ),

    # Electronics (Cat 3)
    (
        "Casio fx-991ES Plus Scientific Calculator (Original)",
        "Approved non-programmable scientific calculator with dual power (solar+battery). 417 functions. Essential for semester exams.",
        Decimal("650.00"), "like_new", 2, 3, (44, 62, 80),
        "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Arduino Uno R3 Starter Kit with Sensors & Jumper Wires",
        "Includes breadboard, ultrasonic sensor, IR module, LEDs, buzzers, and SG90 servo motor. Ideal for mini-projects.",
        Decimal("850.00"), "good", 1, 3, (26, 188, 156),
        "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Raspberry Pi 4 Model B (4GB RAM) with Case & Heatsink",
        "Lightly used for IoT capstone project. Includes 32GB SanDisk Class 10 MicroSD card with Raspberry Pi OS pre-flashed.",
        Decimal("4200.00"), "like_new", 1, 3, (231, 76, 60),
        "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Philips 4-Socket Spike Guard Surge Protector 2M",
        "Heavy duty extension cord for hostel desks. Individual switches with red LED indicators and surge safety shutter.",
        Decimal("350.00"), "good", 2, 3, (155, 89, 182),
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"
    ),

    # Laptops & Accessories (Cat 4)
    (
        "Logitech MK240 Wireless Keyboard & Mouse Combo",
        "Compact spill-resistant wireless keyboard and mouse with nano USB receiver. Low noise keys, batteries included.",
        Decimal("900.00"), "like_new", 1, 4, (52, 152, 219),
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Portronics Adjustable Aluminum Laptop Desk Stand",
        "Foldable 6-level height adjustable stand for ergonomic typing. Prevents neck pain and improves laptop ventilation.",
        Decimal("450.00"), "like_new", 2, 4, (46, 204, 113),
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "HP 15.6 inch Water-Resistant Laptop Backpack",
        "Durable black college backpack with padded laptop sleeve, dual bottle mesh pockets, and reinforced zippers.",
        Decimal("550.00"), "good", 1, 4, (241, 196, 15),
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Seagate One Touch 1TB External Hard Drive USB 3.0",
        "Fast backup drive formatted exFAT for Windows and Mac. Health status 100% in CrystalDiskInfo. With USB 3.0 cable.",
        Decimal("2800.00"), "like_new", 1, 4, (230, 126, 34),
        "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80"
    ),

    # Hostel & Dorm Essentials (Cat 5)
    (
        "Bajaj Compact 1200W Electric Kettle (1.2L)",
        "Stainless steel cordless electric kettle with 360-degree base and auto-shutoff. Perfect for hostel noodles and coffee.",
        Decimal("600.00"), "good", 1, 5, (231, 76, 60),
        "https://images.unsplash.com/photo-1594213114663-ddf4f240f084?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Wipro Smart LED Study Lamp with 3 Color Modes & Dimmable",
        "Rechargeable desk lamp with eye-care diffuse light and touch brightness control. Flexible 360 goose neck.",
        Decimal("480.00"), "like_new", 2, 5, (243, 156, 18),
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Godrej Sturdy Double Brass Padlock with 3 Keys",
        "Secure brass padlock for hostel wardrobe, room door, and luggage during semester breaks.",
        Decimal("180.00"), "like_new", 3, 5, (149, 165, 166),
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Collapsible Mesh Laundry Basket with Handles",
        "Space-saving breathable laundry hamper. Folds flat when not in use. Clean and tear-free.",
        Decimal("120.00"), "good", 2, 5, (52, 73, 94),
        "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&auto=format&fit=crop&q=80"
    ),

    # Furniture (Cat 6)
    (
        "Ergonomic Mesh Mid-Back Desk Chair",
        "Breathable mesh back with pneumatic seat height adjustment and smooth caster wheels. Extremely comfortable for long study sessions.",
        Decimal("1600.00"), "good", 1, 6, (41, 128, 185),
        "https://images.unsplash.com/photo-1580481077194-c3614068393e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Foldable Wooden Bed Study Table with Cup Holder",
        "Portable lap desk with tablet groove and cup holder. Great for studying on bed or hostel room carpet.",
        Decimal("350.00"), "good", 2, 6, (39, 174, 96),
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "3-Tier Plastic Utility Storage Rack on Wheels",
        "Organize snacks, toiletries, notebooks, and stationery neatly beside your hostel bed.",
        Decimal("400.00"), "like_new", 1, 6, (142, 68, 173),
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80"
    ),

    # Stationery & Lab Equipment (Cat 7)
    (
        "Omega Engineering Mini Drafter with Sheet Clip & Scale",
        "Precision mini drafter in black protective carry cover. Must-have for 1st year Engineering Graphics (EG) lab.",
        Decimal("350.00"), "like_new", 3, 7, (22, 160, 133),
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "White Unisex Cotton Lab Coat (Size L)",
        "Thick 100% cotton lab coat required for Chemistry and Physics practical labs. Washed, spotless, and ironed.",
        Decimal("250.00"), "good", 2, 7, (189, 195, 199),
        "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Complete Engineering Drawing Instrument Box (Compass & Dividers)",
        "Original Isomars technical compass set with precision lead pointers, extension arm, and dividers.",
        Decimal("280.00"), "like_new", 2, 7, (211, 84, 0),
        "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "A2 Size Engineering Drawing Board with Parallel Motion",
        "Standard seasoned pine wood drawing board with smooth surface finish and battened edges.",
        Decimal("500.00"), "good", 1, 7, (127, 140, 141),
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80"
    ),

    # Clothing & Uniforms (Cat 8)
    (
        "SSN Official Navy Blue Department Blazer (Size 40)",
        "Barely worn formal blazer with SSN crest for placements, conferences, and college symposiums.",
        Decimal("1400.00"), "like_new", 1, 8, (26, 82, 118),
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Formal White Full-Sleeve Placement Shirts (Pack of 2, 40cm)",
        "Crisp cotton formal shirts with spread collar. Clean and spotless, ideal for mock interviews and drive days.",
        Decimal("600.00"), "like_new", 1, 8, (234, 237, 237),
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Black Leather Formal Shoes for Placements (Size UK 9)",
        "Comfortable lace-up derby shoes with cushioned insoles for interview day. Barely used.",
        Decimal("750.00"), "good", 1, 8, (44, 62, 80),
        "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop&q=80"
    ),

    # Sports & Fitness (Cat 9)
    (
        "Yonex Nanoray Light 18i Badminton Racket with Full Cover",
        "Lightweight 77g carbon graphite racket pre-strung at 24 lbs with BG65 strings. Ready to play at campus court.",
        Decimal("1250.00"), "like_new", 1, 9, (192, 57, 43),
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Nivia Storm Football (Size 5, Rubber Moulded)",
        "Durable all-weather football suitable for SSN main grounds. Holds air pressure well with zero punctures.",
        Decimal("380.00"), "good", 2, 9, (39, 174, 96),
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Kore Rubber Hex Dumbbells Pair (5 kg each)",
        "Sturdy hostel workout dumbbells with anti-roll hexagonal heads and solid knurled grip.",
        Decimal("800.00"), "like_new", 1, 9, (52, 73, 94),
        "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Nivia Pro Level Cricket Tennis Balls (Can of 3)",
        "Heavy duty red tennis balls for hostel corridor and campus box cricket matches.",
        Decimal("180.00"), "new", 3, 9, (243, 156, 18),
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80"
    ),

    # Bicycles & Transport (Cat 10)
    (
        "Hercules Roadeo Hardliner 26T Geared Mountain Bike",
        "21-speed Shimano gears, dual disc brakes, front suspension. Serviced last month. Great for riding across SSN campus.",
        Decimal("4800.00"), "good", 1, 10, (22, 160, 133),
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Hero Sprint Single Speed Campus Commuter Bicycle",
        "Low maintenance single speed cycle with front basket, bell, and heavy duty kickstand. Ideal for hostel-to-class travel.",
        Decimal("2400.00"), "good", 1, 10, (41, 128, 185),
        "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Steel Combination Cable Bicycle Lock with Mounting Bracket",
        "4-digit resettable combination lock. Sturdy PVC coated steel cable, no key needed.",
        Decimal("180.00"), "like_new", 2, 10, (142, 68, 173),
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80"
    ),

    # Other (Cat 11)
    (
        "Noise Two Wireless Over-Ear Headphones with 50H Playtime",
        "Deep bass headphones with dual pairing, low latency gaming mode, and comfy memory foam ear cushions.",
        Decimal("1100.00"), "like_new", 1, 11, (230, 126, 34),
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Prestige Stainless Steel 2L Hot & Cold Thermos Flask",
        "Double-walled vacuum insulated flask keeping water chilled for 24h during Chennai summers. Leak-proof cap.",
        Decimal("450.00"), "like_new", 2, 11, (127, 140, 141),
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Classic Acoustic Guitar (Vault EA20 40-inch) with Bag & Picks",
        "Beginner friendly guitar with spruce top and smooth rosewood fretboard. Strings newly replaced with D'Addario.",
        Decimal("2200.00"), "good", 1, 11, (149, 165, 166),
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&auto=format&fit=crop&q=80"
    ),
    (
        "Kindle Paperwhite (10th Gen, 8GB, Waterproof)",
        "6-inch glare-free 300 ppi display with built-in adjustable backlight. Reads like real paper even under bright sun.",
        Decimal("5500.00"), "like_new", 1, 11, (44, 62, 80),
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507842229458-5776306132d5?w=800&auto=format&fit=crop&q=80"
    ),
]


def seed():
    print("[INFO] Starting CampusMart Enhanced Seed Script...")
    db = SessionLocal()
    try:
        # 1. Categories
        print("  -> Seeding Categories...")
        categories_map = {}
        for name, slug, icon, sort_order in CATEGORIES_DATA:
            cat = db.execute(select(Category).where(Category.slug == slug)).scalar_one_or_none()
            if not cat:
                cat = Category(name=name, slug=slug, icon=icon, sort_order=sort_order)
                db.add(cat)
                db.flush()
            categories_map[slug] = cat
        db.commit()

        # 2. Admin User
        print("  -> Seeding Admin User...")
        admin = db.execute(select(User).where(User.email == settings.admin_email.lower())).scalar_one_or_none()
        if not admin:
            admin = User(
                email=settings.admin_email.lower(),
                password_hash=hash_password(settings.admin_password),
                full_name="CampusMart Administrator",
                role="admin",
                is_verified=True,
                is_active=True,
                department="Dept of Information Technology",
                year_of_study=4,
                avatar_url=STUDENTS_AVATARS.get("admin@ssn.edu.in"),
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            admin.avatar_url = STUDENTS_AVATARS.get("admin@ssn.edu.in")
            db.commit()

        # 3. Student Users & Storefronts
        print("  -> Seeding Student Accounts and Storefronts...")
        students_map = {}
        stores_map = {}
        default_pwd = hash_password("Student@123")

        for email, full_name, dept, year in STUDENTS_DATA:
            student = db.execute(select(User).where(User.email == email.lower())).scalar_one_or_none()
            if not student:
                student = User(
                    email=email.lower(),
                    password_hash=default_pwd,
                    full_name=full_name,
                    department=dept,
                    year_of_study=year,
                    role="student",
                    is_verified=True,
                    is_active=True,
                    avatar_url=STUDENTS_AVATARS.get(email.lower()),
                )
                db.add(student)
                db.flush()
            else:
                student.avatar_url = STUDENTS_AVATARS.get(email.lower(), student.avatar_url)
                student.department = dept
                student.year_of_study = year
                db.flush()

            students_map[email] = student

            # Storefront onboarding if defined
            if email in STOREFRONTS_DATA:
                store_info = STOREFRONTS_DATA[email]
                store = db.execute(select(Store).where(Store.owner_id == student.id)).scalar_one_or_none()
                if not store:
                    store = Store(
                        owner_id=student.id,
                        name=store_info[0],
                        bio=store_info[1],
                        pickup_location_hint=store_info[2],
                        logo_url=store_info[3],
                        is_active=True,
                    )
                    student.has_storefront = True
                    db.add(store)
                    db.flush()
                else:
                    store.name = store_info[0]
                    store.bio = store_info[1]
                    store.pickup_location_hint = store_info[2]
                    store.logo_url = store_info[3]
                    db.flush()
                stores_map[email] = store
        db.commit()

        # 4. Listings (40+ items with authentic photography)
        print("  -> Seeding 40+ Listings with real photos...")
        active_stores = list(stores_map.values())
        created_listings = []

        for i, item_data in enumerate(LISTINGS_DATA):
            title = item_data[0]
            desc = item_data[1]
            price = item_data[2]
            condition = item_data[3]
            qty = item_data[4]
            cat_id = item_data[5]
            color = item_data[6]
            real_img1 = item_data[7]
            real_img2 = item_data[8]

            target_store = active_stores[i % len(active_stores)]
            cat = db.get(Category, cat_id)

            listing = db.execute(
                select(Listing).where(
                    Listing.store_id == target_store.id,
                    Listing.title == title,
                )
            ).scalar_one_or_none()

            if not listing:
                listing = Listing(
                    store_id=target_store.id,
                    category_id=cat.id if cat else None,
                    title=title,
                    description=desc,
                    price=price,
                    condition=condition,
                    quantity=qty,
                    reserved_quantity=0,
                    status="active",
                    view_count=random.randint(18, 160),
                )
                db.add(listing)
                db.flush()

                # Save real photography image records
                img1 = ListingImage(listing_id=listing.id, url=real_img1, thumb_url=real_img1, position=0)
                img2 = ListingImage(listing_id=listing.id, url=real_img2, thumb_url=real_img2, position=1)
                db.add(img1)
                db.add(img2)
                db.flush()
            else:
                # Update existing listing details and images to high-res URLs
                listing.description = desc
                listing.price = price
                listing.condition = condition
                listing.quantity = qty
                listing.category_id = cat.id if cat else None
                db.flush()

                # Refresh images
                db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
                img1 = ListingImage(listing_id=listing.id, url=real_img1, thumb_url=real_img1, position=0)
                img2 = ListingImage(listing_id=listing.id, url=real_img2, thumb_url=real_img2, position=1)
                db.add(img1)
                db.add(img2)
                db.flush()

            created_listings.append(listing)

        db.commit()
        print(f"     Total listings available: {len(created_listings)}")

        # 5. Conversations & Messages
        print("  -> Seeding Conversations & Messages...")
        buyer_priya = students_map["priya@ssn.edu.in"]
        buyer_ravi = students_map["ravi@ssn.edu.in"]
        seller_karthik = students_map["karthik@ssn.edu.in"]
        seller_divya = students_map["divya@ssn.edu.in"]

        first_listing = created_listings[0]
        second_listing = created_listings[1]

        # Conv 1: Priya -> Karthik
        conv1 = db.execute(
            select(Conversation).where(
                Conversation.listing_id == first_listing.id,
                Conversation.buyer_id == buyer_priya.id,
                Conversation.seller_id == seller_karthik.id,
            )
        ).scalar_one_or_none()
        if not conv1:
            conv1 = Conversation(
                listing_id=first_listing.id,
                buyer_id=buyer_priya.id,
                seller_id=seller_karthik.id,
                last_message_at=datetime.now(timezone.utc),
            )
            db.add(conv1)
            db.flush()
            m1 = Message(conversation_id=conv1.id, sender_id=buyer_priya.id, body="Hi Karthik! Is the OS textbook still available?")
            m2 = Message(conversation_id=conv1.id, sender_id=seller_karthik.id, body="Hey Priya! Yes it is. Are you free to meet near IT block tomorrow?")
            m3 = Message(conversation_id=conv1.id, sender_id=buyer_priya.id, body="Yes, around 1:15 PM lunch break works great.")
            db.add_all([m1, m2, m3])

        # Conv 2: Ravi -> Divya
        conv2 = db.execute(
            select(Conversation).where(
                Conversation.listing_id == second_listing.id,
                Conversation.buyer_id == buyer_ravi.id,
                Conversation.seller_id == seller_divya.id,
            )
        ).scalar_one_or_none()
        if not conv2:
            conv2 = Conversation(
                listing_id=second_listing.id,
                buyer_id=buyer_ravi.id,
                seller_id=seller_divya.id,
                last_message_at=datetime.now(timezone.utc),
            )
            db.add(conv2)
            db.flush()
            m1 = Message(conversation_id=conv2.id, sender_id=buyer_ravi.id, body="Hello Divya, can you do ₹320 for the B.S. Grewal book?")
            m2 = Message(conversation_id=conv2.id, sender_id=seller_divya.id, body="Hey Ravi, I can do ₹350 as it is practically brand new!")
            db.add_all([m1, m2])

        db.commit()

        # 6. Orders in every status & Reviews
        print("  -> Seeding Orders in various lifecycle statuses...")
        statuses = ["completed", "completed", "completed", "accepted", "pending", "cancelled", "rejected"]
        buyers = [buyer_priya, buyer_ravi, students_map["vijay@ssn.edu.in"], students_map["sana@ssn.edu.in"]]

        for idx, status in enumerate(statuses):
            listing = created_listings[idx + 2]
            buyer = buyers[idx % len(buyers)]
            seller = db.get(User, db.get(Store, listing.store_id).owner_id)

            if buyer.id == seller.id:
                buyer = buyers[(idx + 1) % len(buyers)]

            existing_order = db.execute(
                select(Order).where(Order.listing_id == listing.id, Order.buyer_id == buyer.id)
            ).scalar_one_or_none()

            if not existing_order:
                order = Order(
                    listing_id=listing.id,
                    buyer_id=buyer.id,
                    seller_id=seller.id,
                    quantity=1,
                    unit_price=listing.price,
                    status=status,
                    note="Can meet at central library entrance or hostel gate." if idx % 2 == 0 else "Urgent for semester test",
                    proposed_meetup="Central Library Plaza" if idx % 2 == 0 else "Hostel 3 Mess Entrance",
                    reject_reason="Item already committed to a batchmate" if status == "rejected" else None,
                )
                db.add(order)
                db.flush()

                # Order event audit log
                event = OrderEvent(order_id=order.id, actor_id=buyer.id, from_status="none", to_status="pending")
                db.add(event)
                if status != "pending":
                    event2 = OrderEvent(
                        order_id=order.id,
                        actor_id=seller.id,
                        from_status="pending",
                        to_status=status if status in ["accepted", "rejected", "cancelled"] else "accepted",
                    )
                    db.add(event2)
                    if status == "completed":
                        event3 = OrderEvent(order_id=order.id, actor_id=seller.id, from_status="accepted", to_status="completed")
                        db.add(event3)

                # Seed reviews for completed orders
                if status == "completed":
                    rev1 = Review(
                        order_id=order.id,
                        reviewer_id=buyer.id,
                        reviewee_id=seller.id,
                        direction="buyer_to_seller",
                        rating=5 if idx == 0 else 4,
                        comment="Super fast handover, item was exactly as described! Verified campus seller." if idx == 0 else "Very polite seller, met right on time during lunch break.",
                        seller_reply="Thanks for the smooth trade! Best of luck with your semester tests." if idx == 0 else None,
                    )
                    rev2 = Review(
                        order_id=order.id,
                        reviewer_id=seller.id,
                        reviewee_id=buyer.id,
                        direction="seller_to_buyer",
                        rating=5,
                        comment="Courteous buyer, came exactly at the agreed time with exact cash.",
                    )
                    db.add_all([rev1, rev2])
                    db.flush()

        db.commit()

        # Recompute ratings
        for s in stores_map.values():
            recompute_store_rating(db, s.id)
        for u in students_map.values():
            recompute_buyer_rating(db, u.id)

        # 7. Wishlist entries
        print("  -> Seeding Wishlist items...")
        for student in students_map.values():
            for l in created_listings[:6]:
                store = db.get(Store, l.store_id)
                if store.owner_id != student.id:
                    exists = db.get(WishlistItem, (student.id, l.id))
                    if not exists and random.random() > 0.4:
                        w = WishlistItem(user_id=student.id, listing_id=l.id, price_at_save=l.price)
                        db.add(w)
        db.commit()

        # 8. Moderation Reports
        print("  -> Seeding Moderation Reports...")
        reporter = students_map["ravi@ssn.edu.in"]
        target_listing = created_listings[10]

        existing_report = db.execute(
            select(Report).where(
                Report.reporter_id == reporter.id,
                Report.target_type == "listing",
                Report.target_id == target_listing.id,
            )
        ).scalar_one_or_none()

        if not existing_report:
            rep = Report(
                reporter_id=reporter.id,
                target_type="listing",
                target_id=target_listing.id,
                reason="inappropriate",
                details="Listed item has duplicate title in textbook category.",
                status="open",
            )
            db.add(rep)
            db.commit()

        print("\n" + "=" * 70)
        print(" [SUCCESS] CAMPUSMART SEED COMPLETE!")
        print("=" * 70)
        print(" DEMO ACCOUNTS & LOGIN CREDENTIALS:")
        print(" --------------------------------------------------------------------")
        print(" | ROLE         | EMAIL                 | PASSWORD    | STORE NAME")
        print(" --------------------------------------------------------------------")
        print(f" | ADMIN        | {settings.admin_email:<21} | Admin@12345 | (Moderator)")
        for email, full_name, dept, year in STUDENTS_DATA:
            store_name = STOREFRONTS_DATA.get(email, ("", "", "", ""))[0] or "(Buyer only)"
            role_label = "VENDOR" if email in STOREFRONTS_DATA else "STUDENT"
            print(f" | {role_label:<12} | {email:<21} | Student@123 | {store_name[:24]}")
        print(" --------------------------------------------------------------------")
        print(" All student passwords: Student@123")
        print(" Admin credentials:     admin@ssn.edu.in / Admin@12345")
        print("=" * 70 + "\n")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

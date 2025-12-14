"""Validation utility functions."""
import re
from typing import Optional
from fastapi import HTTPException


def validate_thai_phone(phone: str) -> None:
    """
    Validate Thai phone number format: 9 digits (company) or 10 digits (mobile).

    Args:
        phone: Phone number string to validate

    Raises:
        HTTPException: If phone number is invalid
    """
    if not phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number is required"
        )

    # Remove any whitespace
    phone = phone.strip()

    # Check if it contains only digits
    if not re.match(r"^[0-9]+$", phone):
        raise HTTPException(
            status_code=400,
            detail="Phone number must contain only digits (0-9)"
        )

    # Check length (must be exactly 9 or 10 digits)
    if len(phone) != 9 and len(phone) != 10:
        raise HTTPException(
            status_code=400,
            detail="Phone number must be exactly 9 digits (company) or 10 digits (mobile)"
        )


def validate_email(email: Optional[str]) -> None:
    """
    Validate email format.

    Args:
        email: Email string to validate (can be None for optional fields)

    Raises:
        HTTPException: If email format is invalid
    """
    # Email is optional, so None is valid
    if email is None:
        return

    # Remove whitespace
    email = email.strip()

    # If empty string after stripping, treat as None (valid for optional)
    if not email:
        return

    # Basic email regex pattern
    # Matches: local@domain format
    # Allows: letters, numbers, dots, hyphens, underscores, plus signs
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    if not re.match(email_pattern, email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )

    # Check length (max 100 characters as per schema)
    if len(email) > 100:
        raise HTTPException(
            status_code=400,
            detail="Email must be 100 characters or less"
        )

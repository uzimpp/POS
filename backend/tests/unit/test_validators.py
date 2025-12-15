"""
Unit tests for validation functions
"""
import pytest
from fastapi import HTTPException
from app.utils.validators import validate_thai_phone, validate_email


class TestThaiPhoneValidation:
    """Test Thai phone number validation"""
    
    def test_valid_10_digit_mobile(self):
        """Test: Valid 10-digit mobile number (starts with 0)"""
        try:
            validate_thai_phone("0812345678")
        except HTTPException:
            pytest.fail("Valid phone number raised an exception")
    
    def test_valid_9_digit_company(self):
        """Test: Valid 9-digit company number"""
        try:
            validate_thai_phone("021234567")
        except HTTPException:
            pytest.fail("Valid company phone raised an exception")
    
    def test_invalid_8_digits(self):
        """Test: Reject phone with 8 digits"""
        with pytest.raises(HTTPException) as exc_info:
            validate_thai_phone("12345678")
        assert "must be exactly 9 digits (company) or 10 digits (mobile)" in str(exc_info.value.detail)
    
    def test_invalid_11_digits(self):
        """Test: Reject phone with 11 digits"""
        with pytest.raises(HTTPException) as exc_info:
            validate_thai_phone("01234567890")
        assert "must be exactly 9 digits (company) or 10 digits (mobile)" in str(exc_info.value.detail)
    
    def test_invalid_with_letters(self):
        """Test: Reject phone with letters"""
        with pytest.raises(HTTPException) as exc_info:
            validate_thai_phone("081234ABCD")
        assert "must contain only digits" in str(exc_info.value.detail)
    
    def test_invalid_with_special_characters(self):
        """Test: Reject phone with special characters"""
        with pytest.raises(HTTPException) as exc_info:
            validate_thai_phone("081-234-5678")
        assert "must contain only digits" in str(exc_info.value.detail)
    
    def test_empty_phone(self):
        """Test: Reject empty phone"""
        with pytest.raises(HTTPException) as exc_info:
            validate_thai_phone("")
        assert "Phone number is required" in str(exc_info.value.detail)
    
    def test_phone_with_spaces_gets_stripped(self):
        """Test: Phone with leading/trailing spaces should be stripped and validated"""
        try:
            validate_thai_phone(" 0812345678 ")
        except HTTPException:
            pytest.fail("Valid phone with spaces raised an exception")


class TestEmailValidation:
    """Test email validation"""
    
    def test_valid_email(self):
        """Test: Valid email format"""
        try:
            validate_email("user@example.com")
        except HTTPException:
            pytest.fail("Valid email raised an exception")
    
    def test_valid_email_with_dots(self):
        """Test: Valid email with dots in local part"""
        try:
            validate_email("user.name@example.com")
        except HTTPException:
            pytest.fail("Valid email with dots raised an exception")
    
    def test_valid_email_with_plus(self):
        """Test: Valid email with plus sign"""
        try:
            validate_email("user+tag@example.com")
        except HTTPException:
            pytest.fail("Valid email with plus raised an exception")
    
    def test_none_email_is_valid(self):
        """Test: None is valid (optional field)"""
        try:
            validate_email(None)
        except HTTPException:
            pytest.fail("None email raised an exception")
    
    def test_empty_string_is_valid(self):
        """Test: Empty string is treated as None (valid)"""
        try:
            validate_email("")
        except HTTPException:
            pytest.fail("Empty email raised an exception")
    
    def test_invalid_email_no_at(self):
        """Test: Reject email without @"""
        with pytest.raises(HTTPException) as exc_info:
            validate_email("userexample.com")
        assert "Invalid email format" in str(exc_info.value.detail)
    
    def test_invalid_email_no_domain(self):
        """Test: Reject email without domain"""
        with pytest.raises(HTTPException) as exc_info:
            validate_email("user@")
        assert "Invalid email format" in str(exc_info.value.detail)
    
    def test_invalid_email_no_tld(self):
        """Test: Reject email without top-level domain"""
        with pytest.raises(HTTPException) as exc_info:
            validate_email("user@example")
        assert "Invalid email format" in str(exc_info.value.detail)
    
    def test_email_too_long(self):
        """Test: Reject email longer than 100 characters"""
        long_email = "a" * 90 + "@example.com"  # Total > 100 characters
        with pytest.raises(HTTPException) as exc_info:
            validate_email(long_email)
        assert "must be 100 characters or less" in str(exc_info.value.detail)
    
    def test_email_with_spaces_gets_stripped(self):
        """Test: Email with spaces should be stripped and validated"""
        try:
            validate_email(" user@example.com ")
        except HTTPException:
            pytest.fail("Valid email with spaces raised an exception")




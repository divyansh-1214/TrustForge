from app.detector.regex_detector import detect_regex


def test_email_detection():

    text = "Contact me at khushi@gmail.com"

    entities = detect_regex(text)

    assert any(
        entity["entity_type"] == "EMAIL_ADDRESS"
        for entity in entities
    )


def test_phone_detection():

    text = "My phone number is 9876543210"

    entities = detect_regex(text)

    assert any(
        entity["entity_type"] == "PHONE_NUMBER"
        for entity in entities
    )


def test_pan_detection():

    text = "My PAN is ABCDE1234F"

    entities = detect_regex(text)

    assert any(
        entity["entity_type"] == "PAN"
        for entity in entities
    )
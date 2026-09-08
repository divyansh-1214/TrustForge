from app.masking.masker import (
    generate_placeholder,
    mask_text,
    unmask_text
)


def test_deterministic_placeholder():

    first = generate_placeholder(
        "PERSON",
        "Khushi"
    )

    second = generate_placeholder(
        "PERSON",
        "Khushi"
    )

    assert first == second


def test_mask_and_unmask():

    text = "Hello Khushi"

    entities = [
        {
            "entity_type": "PERSON",
            "start": 6,
            "end": 12,
            "text": "Khushi",
            "score": 1.0
        }
    ]

    masked, mapping = mask_text(
        text,
        entities
    )

    assert "Khushi" not in masked
    assert "<PERSON_" in masked

    restored = unmask_text(
        masked,
        mapping
    )

    assert restored == text
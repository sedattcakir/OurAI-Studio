from pathlib import Path

MODELS_ROOT = Path(__file__).parent.parent.parent.parent.parent / "OurAI-Models"


def speech_handle(action: str, params: dict) -> dict:
    if action != "transcribe":
        raise ValueError(f"Unknown action: {action}")

    checkpoint_path = MODELS_ROOT / "checkpoints" / "ourspeech_model.pt"
    if not checkpoint_path.exists():
        return {
            "status": "not_available",
            "message": "OurSpeech model not trained yet.",
            "model": "OurSpeech-v0.1",
        }

    return {
        "status": "not_available",
        "message": "OurSpeech inference not yet implemented.",
        "model": "OurSpeech-v0.1",
    }

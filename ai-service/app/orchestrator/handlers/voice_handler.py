from pathlib import Path

MODELS_ROOT = Path(__file__).parent.parent.parent.parent.parent / "OurAI-Models"


def voice_handle(action: str, params: dict) -> dict:
    if action != "synthesize":
        raise ValueError(f"Unknown action: {action}")

    checkpoint_path = MODELS_ROOT / "checkpoints" / "ourvoice_model.pt"
    if not checkpoint_path.exists():
        return {
            "status": "not_available",
            "message": "OurVoice model not trained yet.",
            "model": "OurVoice-v0.1",
        }

    text = params.get("text", "")
    return {
        "status": "not_available",
        "message": "OurVoice inference not yet implemented.",
        "model": "OurVoice-v0.1",
        "text": text,
    }

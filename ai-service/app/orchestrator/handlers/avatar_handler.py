import base64
import io
import torch
import numpy as np
from pathlib import Path
from PIL import Image

MODELS_ROOT = Path(__file__).parent.parent.parent.parent.parent / "OurAI-Models"

_model = None
_device = None


def _load_model():
    global _model, _device
    if _model is not None:
        return

    import sys
    sys.path.insert(0, str(MODELS_ROOT))
    from OurAvatar.model.avatar_net import AvatarNet

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint_path = MODELS_ROOT / "checkpoints" / "ouravatar_net.pt"

    if not checkpoint_path.exists():
        raise FileNotFoundError("OurAvatar model not trained yet. Run training first.")

    checkpoint = torch.load(str(checkpoint_path), map_location=_device, weights_only=False)

    _model = AvatarNet().to(_device)
    _model.load_state_dict(checkpoint["model_state_dict"])
    _model.eval()
    print(f"OurAvatar loaded on {_device}")


def avatar_handle(action: str, params: dict) -> dict:
    if action != "animate":
        raise ValueError(f"Unknown action: {action}")

    checkpoint_path = MODELS_ROOT / "checkpoints" / "ouravatar_net.pt"
    if not checkpoint_path.exists():
        return {
            "status": "not_available",
            "message": "OurAvatar model not trained yet.",
            "model": "OurAvatar-v0.1",
        }

    _load_model()

    num_frames = min(params.get("num_frames", 20), 30)
    face_b64 = params.get("face_base64")

    if face_b64:
        img_bytes = base64.b64decode(face_b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((64, 64))
        face_tensor = torch.tensor(np.array(img)).permute(2, 0, 1).float() / 255.0
        face_tensor = face_tensor.unsqueeze(0).to(_device)
    else:
        face_tensor = torch.rand(1, 3, 64, 64, device=_device)

    audio_features = torch.rand(1, num_frames, 80, device=_device)

    with torch.no_grad():
        frames = _model(face_tensor, audio_features)

    pil_frames = []
    for t in range(frames.size(1)):
        frame = frames[0, t].clamp(0, 1).mul(255).byte()
        frame = frame.permute(1, 2, 0).cpu().numpy()
        pil_frames.append(Image.fromarray(frame))

    buf = io.BytesIO()
    pil_frames[0].save(buf, format="GIF", save_all=True, append_images=pil_frames[1:], duration=100, loop=0)
    animation_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "animation_base64": animation_b64,
        "model": "OurAvatar-v0.1",
        "num_frames": num_frames,
    }

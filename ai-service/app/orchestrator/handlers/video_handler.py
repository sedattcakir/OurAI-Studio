import base64
import io
import torch
from pathlib import Path
from PIL import Image

MODELS_ROOT = Path(__file__).parent.parent.parent.parent.parent / "OurAI-Models"

_model = None
_device = None
_z_dim = 128


def _load_model():
    global _model, _device, _z_dim
    if _model is not None:
        return

    import sys
    sys.path.insert(0, str(MODELS_ROOT))
    from OurVideo.model.video_vae import VideoVAE

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint_path = MODELS_ROOT / "checkpoints" / "ourvideo_vae.pt"

    if not checkpoint_path.exists():
        raise FileNotFoundError("OurVideo model not trained yet. Run training first.")

    checkpoint = torch.load(str(checkpoint_path), map_location=_device, weights_only=False)
    _z_dim = checkpoint.get("z_dim", 128)

    _model = VideoVAE(z_dim=_z_dim).to(_device)
    _model.load_state_dict(checkpoint["model_state_dict"])
    _model.eval()
    print(f"OurVideo VAE loaded on {_device}")


def video_handle(action: str, params: dict) -> dict:
    if action != "generate":
        raise ValueError(f"Unknown action: {action}")

    checkpoint_path = MODELS_ROOT / "checkpoints" / "ourvideo_vae.pt"
    if not checkpoint_path.exists():
        return {
            "status": "not_available",
            "message": "OurVideo model not trained yet.",
            "model": "OurVideo-v0.1",
        }

    _load_model()

    num_videos = min(params.get("num_videos", 1), 2)
    results = []

    for _ in range(num_videos):
        video = _model.generate(num_videos=1, device=str(_device))
        frames = []
        for t in range(video.size(2)):
            frame = video[0, :, t].clamp(0, 1).mul(255).byte()
            frame = frame.permute(1, 2, 0).cpu().numpy()
            frames.append(Image.fromarray(frame))

        buf = io.BytesIO()
        frames[0].save(buf, format="GIF", save_all=True, append_images=frames[1:], duration=100, loop=0)
        b64 = base64.b64encode(buf.getvalue()).decode()
        results.append(b64)

    return {
        "videos_base64": results,
        "model": "OurVideo-v0.1",
        "num_generated": num_videos,
    }

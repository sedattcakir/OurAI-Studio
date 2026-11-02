import base64
import io
import torch
from pathlib import Path
from torchvision.utils import save_image

MODELS_ROOT = Path(__file__).parent.parent.parent.parent.parent / "OurAI-Models"

_generator = None
_device = None
_latent_dim = 100


def _load_generator():
    global _generator, _device, _latent_dim
    if _generator is not None:
        return

    import sys
    sys.path.insert(0, str(MODELS_ROOT))
    from OurImage.model.dcgan import Generator

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint_path = MODELS_ROOT / "checkpoints" / "ourimage_generator.pt"

    if not checkpoint_path.exists():
        raise FileNotFoundError("OurImage model not trained yet. Run training first.")

    checkpoint = torch.load(str(checkpoint_path), map_location=_device, weights_only=False)
    _latent_dim = checkpoint.get("latent_dim", 100)

    _generator = Generator(latent_dim=_latent_dim).to(_device)
    _generator.load_state_dict(checkpoint["generator_state_dict"])
    _generator.eval()
    print(f"OurImage Generator loaded on {_device}")


def image_handle(action: str, params: dict) -> dict:
    if action != "generate":
        raise ValueError(f"Unknown action: {action}")

    _load_generator()

    num_images = params.get("num_images", 1)
    num_images = min(num_images, 4)

    with torch.no_grad():
        z = torch.randn(num_images, _latent_dim, device=_device)
        images = _generator(z)
        images = (images + 1) / 2

    results = []
    for i in range(num_images):
        buf = io.BytesIO()
        save_image(images[i], buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        results.append(b64)

    return {
        "images_base64": results,
        "model": "OurImage-v0.1",
        "num_generated": num_images,
    }

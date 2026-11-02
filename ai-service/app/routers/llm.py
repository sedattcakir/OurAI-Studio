import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch

MODELS_ROOT = Path(__file__).parent.parent.parent.parent.parent / "OurAI-Models"
sys.path.insert(0, str(MODELS_ROOT))

router = APIRouter()

_model = None
_tokenizer = None
_device = None


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 50
    temperature: float = 0.8
    top_k: int = 50


class GenerateResponse(BaseModel):
    generated_text: str
    model: str = "OurLLM-v0.2"
    tokens_generated: int = 0


def _load_model():
    global _model, _tokenizer, _device
    if _model is not None:
        return

    from OurLLM.model.transformer import OurLLMModel
    from OurLLM.tokenizer.bpe_tokenizer import OurBPETokenizer, PAD_ID, EOS_ID

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    tokenizer_path = MODELS_ROOT / "OurLLM" / "tokenizer" / "trained" / "ourllm_tokenizer.json"
    _tokenizer = OurBPETokenizer()
    _tokenizer.load(str(tokenizer_path))

    checkpoint_path = MODELS_ROOT / "checkpoints" / "ourllm_best.pt"
    if not checkpoint_path.exists():
        checkpoint_path = MODELS_ROOT / "checkpoints" / "ourllm_final.pt"

    checkpoint = torch.load(str(checkpoint_path), map_location=_device, weights_only=False)
    config = checkpoint["config"]

    _model = OurLLMModel(
        vocab_size=_tokenizer.get_vocab_size(),
        embed_dim=config["model"]["embedding_dim"],
        num_layers=config["model"]["num_layers"],
        num_heads=config["model"]["num_heads"],
        ff_dim=config["model"]["feedforward_dim"],
        max_seq_length=config["model"]["max_seq_length"],
        dropout=0.0,
        pad_id=PAD_ID,
    ).to(_device)

    _model.load_state_dict(checkpoint["model_state_dict"])
    _model.eval()
    print(f"OurLLM loaded on {_device} (step {checkpoint['step']})")


@router.post("/generate", response_model=GenerateResponse)
def generate_text(req: GenerateRequest):
    try:
        _load_model()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model not available: {e}")

    from OurLLM.tokenizer.bpe_tokenizer import EOS_ID

    input_ids = _tokenizer.encode(req.prompt, add_special_tokens=True)
    input_tensor = torch.tensor([input_ids], dtype=torch.long, device=_device)

    with torch.no_grad():
        output_ids = _model.generate(
            input_tensor,
            max_new_tokens=req.max_tokens,
            temperature=req.temperature,
            top_k=req.top_k,
            eos_id=EOS_ID,
        )

    generated_text = _tokenizer.decode(output_ids[0].tolist(), skip_special_tokens=True)
    tokens_generated = output_ids.shape[1] - len(input_ids)

    return GenerateResponse(
        generated_text=generated_text,
        tokens_generated=tokens_generated,
    )


@router.get("/status")
def model_status():
    return {
        "loaded": _model is not None,
        "device": str(_device) if _device else None,
        "model": "OurLLM-v0.2",
    }

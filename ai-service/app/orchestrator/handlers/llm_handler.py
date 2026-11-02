import torch
from app.routers.llm import _load_model


def llm_handle(action: str, params: dict) -> dict:
    if action != "generate":
        raise ValueError(f"Unknown action: {action}")

    _load_model()

    from app.routers.llm import _model, _tokenizer, _device
    from OurLLM.tokenizer.bpe_tokenizer import EOS_ID

    prompt = params.get("prompt", "")
    max_tokens = params.get("max_tokens", 50)
    temperature = params.get("temperature", 0.8)
    top_k = params.get("top_k", 50)

    input_ids = _tokenizer.encode(prompt, add_special_tokens=True)
    input_tensor = torch.tensor([input_ids], dtype=torch.long, device=_device)

    with torch.no_grad():
        output_ids = _model.generate(
            input_tensor,
            max_new_tokens=max_tokens,
            temperature=temperature,
            top_k=top_k,
            eos_id=EOS_ID,
        )

    generated_text = _tokenizer.decode(output_ids[0].tolist(), skip_special_tokens=True)
    tokens_generated = output_ids.shape[1] - len(input_ids)

    return {
        "generated_text": generated_text,
        "model": "OurLLM-v0.2",
        "tokens_generated": tokens_generated,
    }

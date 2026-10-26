"""Local reconstruction of the MIT-licensed Odyssey SER inference architecture.
Derived from 3loi/pipeline_utils.py at 00d0e12ba9bf957f5aeea36e8663c8c61cb50ac9.
No repository Python is downloaded/imported; no trust_remote_code or pickle loading.
"""
import json
import torch
from torch import nn
from safetensors.torch import load_file
from transformers import WavLMConfig, WavLMModel


class AttentiveStatisticsPooling(nn.Module):
    def __init__(self, size):
        super().__init__()
        self.sap_linear = nn.Linear(size, size)
        self.attention = nn.Parameter(torch.zeros(size, 1))

    def forward(self, xs):
        weights = torch.softmax(torch.matmul(torch.tanh(self.sap_linear(xs)), self.attention), dim=1)
        mean = torch.sum(xs * weights, dim=1)
        deviation = torch.sqrt((torch.sum(xs.square() * weights, dim=1) - mean.square()).clamp(min=1e-5))
        return torch.cat((mean, deviation), dim=1)


class EmotionRegression(nn.Module):
    def __init__(self, size, layers, dropout):
        super().__init__()
        self.fc = nn.ModuleList([nn.Sequential(nn.Linear(size * 2 if i == 0 else size, size), nn.LayerNorm(size), nn.ReLU(), nn.Dropout(dropout)) for i in range(layers)])
        self.out = nn.Sequential(nn.Linear(size, 3))
        self.inp_drop = nn.Dropout(dropout)

    def forward(self, x):
        x = self.inp_drop(x)
        for layer in self.fc:
            x = layer(x)
        return self.out(x)


class FraymusSER(nn.Module):
    def __init__(self, backbone, config):
        super().__init__()
        self.ssl_model = WavLMModel(WavLMConfig(**backbone))
        self.pool_model = AttentiveStatisticsPooling(config['hidden_size'])
        self.ser_model = EmotionRegression(config['hidden_size'], config['classifier_hidden_layers'], config['classifier_dropout_prob'])

    def forward(self, wavs, mask):
        # One unpadded logical window per call; pooling across its actual encoder frames.
        hidden = self.ssl_model(wavs, attention_mask=mask).last_hidden_state
        return self.ser_model(self.pool_model(hidden))


def load_model(backbone_path, model_path, config_path, device):
    config = json.loads(config_path.read_text(encoding='utf-8'))
    if config.get('id2label') != {'0': 'arousal', '1': 'dominance', '2': 'valence'} or config.get('sampling_rate') != 16000:
        raise RuntimeError('Unexpected label ordering or sampling rate.')
    model = FraymusSER(json.loads(backbone_path.read_text(encoding='utf-8')), config)
    # Strict load must reject missing/unexpected layers rather than run a random head.
    model.load_state_dict(load_file(str(model_path), device='cpu'), strict=True)
    return model.to(device).eval()
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import os

# -------------------------------
# Config
# -------------------------------
IMG_HEIGHT = 32
CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz♠♦♥♣"
CHAR2IDX = {c: i + 1 for i, c in enumerate(CHARSET)}  # 0 = blank for CTC
IDX2CHAR = {i: c for c, i in CHAR2IDX.items()}

# -------------------------------
# Dataset
# -------------------------------
class OCRDataset(Dataset):
    def __init__(self, image_dir):
        self.image_dir = image_dir
        self.samples = [f[:-4] for f in os.listdir(image_dir) if f.endswith('.jpg')]
        self.transform = transforms.Compose([
            transforms.Grayscale(),
            transforms.Resize((IMG_HEIGHT, IMG_HEIGHT * 4)),
            transforms.ToTensor(),
        ])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        base = self.samples[idx]
        img_path = os.path.join(self.image_dir, base + ".jpg")
        label_path = os.path.join(self.image_dir, base + ".txt")

        image = self.transform(Image.open(img_path))
        with open(label_path, 'r') as f:
            text = f.read().strip()

        label = [CHAR2IDX[c] for c in text if c in CHAR2IDX]
        return image, torch.tensor(label, dtype=torch.long)

# -------------------------------
# Model Skeleton (placeholder)
# -------------------------------
class CRNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2, 2),
        )
        self.rnn = nn.LSTM(128, 64, num_layers=2, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(128, num_classes + 1)  # +1 for CTC blank

    def forward(self, x):
        x = self.cnn(x)  # [B, C, H, W]
        b, c, h, w = x.size()
        x = x.permute(0, 3, 1, 2).contiguous().view(b, w, -1)  # [B, W, C*H]
        x, _ = self.rnn(x)
        x = self.fc(x)  # [B, W, num_classes+1]
        return x

# -------------------------------
# Training Loop (barebones)
# -------------------------------
def train():
    dataset = OCRDataset("./data/train")
    loader = DataLoader(dataset, batch_size=8, shuffle=True, collate_fn=lambda x: x)

    model = CRNN(len(CHARSET))
    criterion = nn.CTCLoss(blank=0)
    optimizer = optim.Adam(model.parameters(), lr=1e-3)

    for epoch in range(10):
        model.train()
        for batch in loader:
            images, labels = zip(*batch)
            images = torch.stack(images)
            label_lens = torch.tensor([len(l) for l in labels], dtype=torch.long)
            targets = torch.cat(labels)

            output = model(images)  # [B, W, C]
            log_probs = output.log_softmax(2).transpose(0, 1)  # [W, B, C]
            input_lens = torch.full(size=(images.size(0),), fill_value=log_probs.size(0), dtype=torch.long)

            loss = criterion(log_probs, targets, input_lens, label_lens)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

if __name__ == '__main__':
    train()

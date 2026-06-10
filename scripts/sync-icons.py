from __future__ import annotations

import shutil
import struct
import subprocess
import tempfile
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
SOURCE_ICON = ROOT_DIR / "src" / "renderer" / "assets" / "logo" / "logo.png"
BUILD_DIR = ROOT_DIR / "build"
ICONSET_DIR = BUILD_DIR / "icon.iconset"
ICON_PNG = BUILD_DIR / "icon.png"
ICON_ICNS = BUILD_DIR / "icon.icns"
ICON_ICO = BUILD_DIR / "icon.ico"

ICONSET_SIZES = {
    "icon_16x16.png": 16,
    "icon_16x16@2x.png": 32,
    "icon_32x32.png": 32,
    "icon_32x32@2x.png": 64,
    "icon_64x64.png": 64,
    "icon_64x64@2x.png": 128,
    "icon_128x128.png": 128,
    "icon_128x128@2x.png": 256,
    "icon_256x256.png": 256,
    "icon_256x256@2x.png": 512,
    "icon_512x512.png": 512,
    "icon_512x512@2x.png": 1024,
}

ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]


def run_command(*args: str, quiet: bool = True) -> None:
    subprocess.run(
        args,
        check=True,
        stdout=subprocess.DEVNULL if quiet else None,
        stderr=subprocess.DEVNULL if quiet else None,
    )


def resize_png(source: Path, size: int, target: Path) -> None:
    run_command("sips", "-z", str(size), str(size), str(source), "--out", str(target))


def build_ico(source: Path, target: Path) -> None:
    images: list[tuple[int, bytes]] = []
    with tempfile.TemporaryDirectory(prefix="icon-ico-", dir=BUILD_DIR) as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        for size in ICO_SIZES:
            png_path = temp_dir / f"{size}.png"
            resize_png(source, size, png_path)
            images.append((size, png_path.read_bytes()))

    header = struct.pack("<HHH", 0, 1, len(images))
    directory_entries: list[bytes] = []
    image_offset = 6 + (16 * len(images))
    for size, image_bytes in images:
        width = 0 if size >= 256 else size
        height = 0 if size >= 256 else size
        directory_entries.append(
            struct.pack(
                "<BBBBHHII",
                width,
                height,
                0,
                0,
                1,
                32,
                len(image_bytes),
                image_offset,
            )
        )
        image_offset += len(image_bytes)

    with target.open("wb") as file_handle:
        file_handle.write(header)
        for entry in directory_entries:
            file_handle.write(entry)
        for _, image_bytes in images:
            file_handle.write(image_bytes)


def main() -> None:
    if not SOURCE_ICON.exists():
        raise FileNotFoundError(f"Source icon not found: {SOURCE_ICON}")

    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(BUILD_DIR / ".tmp-ico", ignore_errors=True)
    for temp_dir in BUILD_DIR.glob("icon-ico-*"):
        shutil.rmtree(temp_dir, ignore_errors=True)
    shutil.rmtree(ICONSET_DIR, ignore_errors=True)
    ICONSET_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE_ICON, ICON_PNG)

    for file_name, size in ICONSET_SIZES.items():
        resize_png(SOURCE_ICON, size, ICONSET_DIR / file_name)

    run_command("iconutil", "-c", "icns", str(ICONSET_DIR), "-o", str(ICON_ICNS))
    build_ico(SOURCE_ICON, ICON_ICO)

    print(f"Generated {ICON_PNG.relative_to(ROOT_DIR)}")
    print(f"Generated {ICON_ICNS.relative_to(ROOT_DIR)}")
    print(f"Generated {ICON_ICO.relative_to(ROOT_DIR)}")


if __name__ == "__main__":
    main()

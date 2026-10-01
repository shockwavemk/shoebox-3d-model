#!/usr/bin/env python3
"""Create true-size, laser-printable A4 PDFs for every texture PNG.

Each PDF preserves the PNG's physical dimensions as defined by its embedded
DPI metadata. Panels larger than a single A4 sheet are tiled without scaling.
"""

from pathlib import Path

from PIL import Image
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.utils import ImageReader

TEXTURES_DIR = Path(__file__).resolve().parents[1] / "src" / "textures"
OUTPUT_DIR = TEXTURES_DIR / "printable-pdfs"
TRIM_MARK_LENGTH = 0.35 * cm
TRIM_MARK_OFFSET = 0.15 * cm


def size_in_points(image_path: Path) -> tuple[float, float]:
    with Image.open(image_path) as image:
        dpi = image.info.get("dpi")
        if not dpi or dpi[0] <= 0 or dpi[1] <= 0:
            raise ValueError(f"{image_path.name} has no valid DPI metadata")
        return image.width * 72 / dpi[0], image.height * 72 / dpi[1]


def draw_trim_marks(canvas: Canvas, x: float, y: float, width: float, height: float) -> None:
    canvas.setStrokeColorRGB(0, 0, 0)
    canvas.setLineWidth(0.25)
    for corner_x in (x, x + width):
        for corner_y in (y, y + height):
            horizontal_direction = -1 if corner_x == x else 1
            vertical_direction = -1 if corner_y == y else 1
            canvas.line(
                corner_x + horizontal_direction * TRIM_MARK_OFFSET,
                corner_y,
                corner_x + horizontal_direction * (TRIM_MARK_OFFSET + TRIM_MARK_LENGTH),
                corner_y,
            )
            canvas.line(
                corner_x,
                corner_y + vertical_direction * TRIM_MARK_OFFSET,
                corner_x,
                corner_y + vertical_direction * (TRIM_MARK_OFFSET + TRIM_MARK_LENGTH),
            )


def draw_label(canvas: Canvas, page_width: float, text: str) -> None:
    canvas.setFillColorRGB(0, 0, 0)
    canvas.setFont("Helvetica", 6)
    canvas.drawString((page_width - stringWidth(text, "Helvetica", 6)) / 2, 0.35 * cm, text)


def export_single_page(canvas: Canvas, image_path: Path, image_width: float, image_height: float) -> None:
    page_width, page_height = A4 if image_width <= A4[0] and image_height <= A4[1] else landscape(A4)
    x = (page_width - image_width) / 2
    y = (page_height - image_height) / 2
    canvas.setPageSize((page_width, page_height))
    canvas.drawImage(ImageReader(image_path), x, y, width=image_width, height=image_height, mask="auto")
    draw_trim_marks(canvas, x, y, image_width, image_height)
    draw_label(canvas, page_width, f"{image_path.stem} | 100% scale | do not fit to page")
    canvas.showPage()


def export_tiled_landscape_pages(canvas: Canvas, image_path: Path, image_width: float, image_height: float) -> None:
    page_width, page_height = landscape(A4)
    printable_height = page_height - 2 * cm
    tile_count = int(-(-image_height // printable_height))
    image = Image.open(image_path)

    for index in range(tile_count):
        lower_pt = index * printable_height
        upper_pt = min(lower_pt + printable_height, image_height)
        crop_height_pt = upper_pt - lower_pt
        lower_px = round(lower_pt / 72 * image.info["dpi"][1])
        upper_px = round(upper_pt / 72 * image.info["dpi"][1])
        crop = image.crop((0, image.height - upper_px, image.width, image.height - lower_px))

        x = (page_width - image_width) / 2
        y = (page_height - crop_height_pt) / 2
        canvas.setPageSize((page_width, page_height))
        canvas.drawInlineImage(crop, x, y, width=image_width, height=crop_height_pt)
        draw_trim_marks(canvas, x, y, image_width, crop_height_pt)
        draw_label(
            canvas,
            page_width,
            f"{image_path.stem} | tile {index + 1}/{tile_count} | 100% scale | assemble at the trim edge",
        )
        canvas.showPage()


def export_pdf(image_path: Path) -> int:
    image_width, image_height = size_in_points(image_path)
    pdf_path = OUTPUT_DIR / f"{image_path.stem}.pdf"
    canvas = Canvas(str(pdf_path))

    if image_width <= max(A4) and image_height <= max(A4) and (
        (image_width <= A4[0] and image_height <= A4[1])
        or (image_width <= A4[1] and image_height <= A4[0])
    ):
        export_single_page(canvas, image_path, image_width, image_height)
        page_count = 1
    else:
        export_tiled_landscape_pages(canvas, image_path, image_width, image_height)
        page_count = int(-(-image_height // (landscape(A4)[1] - 2 * cm)))

    canvas.save()
    return page_count


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    texture_paths = sorted(TEXTURES_DIR.glob("*.png"))
    if not texture_paths:
        raise SystemExit(f"No PNG textures found in {TEXTURES_DIR}")

    for texture_path in texture_paths:
        pages = export_pdf(texture_path)
        print(f"wrote printable-pdfs/{texture_path.stem}.pdf ({pages} A4 page{'s' if pages != 1 else ''})")


if __name__ == "__main__":
    main()
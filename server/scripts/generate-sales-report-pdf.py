import json
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


PAGE_WIDTH, PAGE_HEIGHT = A4
BLUE = colors.HexColor("#2563EB")
NAVY = colors.HexColor("#0F172A")
LIGHT_BLUE = colors.HexColor("#EFF6FF")
BORDER = colors.HexColor("#CBD5E1")
MUTED = colors.HexColor("#64748B")


def rupiah(value):
    amount = round(float(value or 0))
    return "Rp {:,}".format(amount).replace(",", ".")


def draw_page(canvas, doc, printed_at):
    canvas.saveState()
    canvas.setStrokeColor(BORDER)
    canvas.line(18 * mm, 15 * mm, PAGE_WIDTH - 18 * mm, 15 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, f"Dicetak pada {printed_at}")
    canvas.drawRightString(
        PAGE_WIDTH - 18 * mm, 10 * mm, f"Halaman {doc.page}"
    )
    canvas.restoreState()


def build_pdf(payload, output_path):
    doc = BaseDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=22 * mm,
        title="Laporan Penjualan",
        author="QPOS",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.addPageTemplates(
        PageTemplate(
            id="report",
            frames=[frame],
            onPage=lambda canvas, current_doc: draw_page(
                canvas, current_doc, payload["printedAt"]
            ),
        )
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=27,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=5 * mm,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=9,
        leading=14,
        textColor=MUTED,
        alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=NAVY,
        spaceBefore=5 * mm,
        spaceAfter=3 * mm,
    )
    right_style = ParagraphStyle(
        "RightCell", parent=styles["BodyText"], fontSize=8, alignment=TA_RIGHT
    )
    cell_style = ParagraphStyle(
        "Cell", parent=styles["BodyText"], fontSize=8, leading=10
    )

    story = [
        Paragraph("Laporan Penjualan", title_style),
        Paragraph(f"Periode: {payload['period']}", meta_style),
        Paragraph(f"Tanggal cetak: {payload['printedAt']}", meta_style),
        Paragraph("Ringkasan", section_style),
    ]

    summary = payload["summary"]
    summary_rows = [
        ["Total Penjualan", rupiah(summary["totalSales"])],
        ["Total Modal", rupiah(summary["totalCost"])],
        ["Total Keuntungan", rupiah(summary["totalProfit"])],
        ["Jumlah Transaksi", str(summary["totalTransactions"])],
        ["Barang Terjual", str(summary["totalItemsSold"])],
        ["Rata-rata Transaksi", rupiah(summary["averageTransaction"])],
    ]
    summary_table = Table(summary_rows, colWidths=[85 * mm, 89 * mm])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
                ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.extend([summary_table, Paragraph("Detail Transaksi", section_style)])

    detail_rows = [["No", "Invoice", "Tanggal", "Jumlah Item", "Total", "Keuntungan"]]
    for number, transaction in enumerate(payload["transactions"], start=1):
        detail_rows.append(
            [
                str(number),
                Paragraph(str(transaction["invoiceNumber"]), cell_style),
                Paragraph(str(transaction["createdAt"]), cell_style),
                str(transaction["itemsSold"]),
                Paragraph(rupiah(transaction["total"]), right_style),
                Paragraph(rupiah(transaction["profit"]), right_style),
            ]
        )

    if len(detail_rows) == 1:
        detail_rows.append(["", Paragraph("Tidak Ada Data", cell_style), "", "", "", ""])

    detail_table = Table(
        detail_rows,
        colWidths=[9 * mm, 36 * mm, 37 * mm, 23 * mm, 34 * mm, 35 * mm],
        repeatRows=1,
    )
    detail_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (3, 1), (3, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("SPAN", (1, 1), (-1, 1)) if len(payload["transactions"]) == 0 else ("LINEBELOW", (0, 0), (-1, 0), 0, BLUE),
            ]
        )
    )
    story.extend([detail_table, Spacer(1, 3 * mm)])
    doc.build(story)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise ValueError("Usage: generate-sales-report-pdf.py <input-json> <output-pdf>")

    with open(sys.argv[1], "r", encoding="utf-8") as input_file:
        report_payload = json.load(input_file)
    build_pdf(report_payload, sys.argv[2])

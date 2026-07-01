export function generateBarcode(existingBarcodes: string[] = []) {
  const existingBarcodeSet = new Set(existingBarcodes);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const timestampPart = Date.now().toString().slice(-8);
    const randomPart = Math.floor(Math.random() * 10_000)
      .toString()
      .padStart(4, "0");
    const barcode = `${timestampPart}${randomPart}`.slice(0, 12);

    if (!existingBarcodeSet.has(barcode)) {
      return barcode;
    }
  }

  return Math.floor(Math.random() * 1_000_000_000_000)
    .toString()
    .padStart(12, "0");
}

export type AppSettings = {
  storeName: string;
  phone: string;
  address: string;
  receiptFooter: string;
};

export const defaultSettings: AppSettings = {
  storeName: "Toko Saya",
  phone: "",
  address: "",
  receiptFooter: "Terima kasih",
};

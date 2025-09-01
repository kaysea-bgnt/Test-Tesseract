export interface ReceiptResult {
  success: boolean;
  receipt: {
    id: string;
    referenceId: string;
    url: string;
    store: {
      name: string;
      matched: boolean;
      confidence?: number;
    };
    totalAmount: number;
    validAmount: number;
    status: string;
    datePurchase: string;
  };
  ocr: {
    confidence: number;
    processingTime: number;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      matched: boolean;
      points: number;
      matchedProduct?: {
        name: string;
        brand: string;
        confidence: number;
        quality: string;
      };
    }>;
    totals: {
      subtotal: number;
      tax: number;
      total: number;
      currency: string;
    };
    rawText: string;
  };
  points: {
    earned: number;
    transactionId?: string;
  };
  user: {
    id: string;
    currentBalance: number;
    totalEarned: number;
  };
}

export interface OcrResult {
  success: boolean;
  store: {
    name: string;
    matched: boolean;
    confidence?: number;
  };
  ocr: {
    confidence: number;
    processingTime: number;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      matched: boolean;
      points: number;
      matchedProduct?: {
        name: string;
        brand: string;
        confidence: number;
        quality: string;
      };
    }>;
    totals: {
      subtotal: number;
      tax: number;
      total: number;
      currency: string;
    };
    rawText: string;
  };
  points: {
    potential: number;
  };
}

export interface Product {
  _id: string;
  name: string;
  normalized_name: string;
  keywords: string[];
  status: string;
  brandId: {
    _id: string;
    name: string;
  };
  volume: number;
  volumeUnit: string;
  points: number;
  dateExpiry: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  _id: string;
  name: string;
  normalized_name: string;
  keywords: string[];
  type: string;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  receiptId?: {
    _id: string;
    referenceId: string;
    store: string;
    totalAmount: number;
  };
  storeId?: {
    _id: string;
    name: string;
  };
  purchaseAmount?: number;
  points: number;
  action: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  status: string;
  points: {
    balance: number;
    amount: number;
    status: string;
    lastDateEarned?: string;
    lastDateRedeemed?: string;
    dateExpiry?: string;
  };
  createdAt: string;
  updatedAt: string;
}

import axios from "axios";
import { ReceiptResult, OcrResult, Product, Store, Transaction, User } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache", // Prevent caching
  },
  timeout: 120000, // 2 minute timeout for OCR processing
  withCredentials: true,
});

// Add request interceptor to log timeout settings and CORS info
api.interceptors.request.use((config) => {
  console.log(`🔗 API: Request timeout set to ${config.timeout}ms`);
  console.log(`🔗 API: Request URL: ${config.baseURL}${config.url}`);
  console.log(`🔗 API: Request method: ${config.method?.toUpperCase()}`);
  console.log(`🔗 API: Request headers:`, config.headers);
  return config;
});

// Add response interceptor to log CORS errors
api.interceptors.response.use(
  (response) => {
    console.log(`🔗 API: Response received: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`🔗 API: Response error:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      },
    });
    return Promise.reject(error);
  }
);

export const uploadReceipt = async (file: File, userId: string): Promise<ReceiptResult> => {
  console.log("🔗 API: Creating FormData for upload...");
  const formData = new FormData();
  formData.append("receipt", file);
  formData.append("userId", userId);

  console.log("🔗 API: Making POST request to /upload...");
  console.log("🔗 API: Base URL:", API_BASE_URL);
  console.log("🔗 API: Timeout set to 2 minutes for OCR processing...");

  // Add a unique timestamp to make the request more visible
  const timestamp = Date.now();
  console.log("🔗 API: Request timestamp:", timestamp);

  try {
    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Request-ID": `upload-${timestamp}`,
      },
      timeout: 180000, // Explicit 3-minute timeout for upload
    });

    console.log("🔗 API: Response received:", response.status);
    return response.data;
  } catch (error: any) {
    console.error("🔗 API: Upload error:", error);

    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Upload timed out. The receipt is still being processed in the background. Please check your receipt history in a few moments."
      );
    }

    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data?.message || `Upload failed: ${error.response.status}`);
    }

    throw new Error("Network error. Please check your connection and try again.");
  }
};

export const processOcrUrl = async (imageUrl: string, userId: string): Promise<OcrResult> => {
  const response = await api.post("/upload/url", {
    imageUrl,
    userId,
  });

  return response.data;
};

export const processOcr = async (imageUrl: string): Promise<any> => {
  const response = await api.post("/ocr/process", {
    imageUrl,
  });

  return response.data;
};

export const getProducts = async (page = 1, limit = 20, keyword?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (keyword) {
    params.append("keyword", keyword);
  }

  const response = await api.get(`/products?${params}`);
  return response.data;
};

export const getStores = async (page = 1, limit = 20, keyword?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (keyword) {
    params.append("keyword", keyword);
  }

  const response = await api.get(`/stores?${params}`);
  return response.data;
};

export const getTransactions = async (page = 1, limit = 20, userId?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (userId) {
    params.append("userId", userId);
  }

  const response = await api.get(`/transactions?${params}`);
  return response.data;
};

export const getUserTransactions = async (userId: string, page = 1, limit = 20) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await api.get(`/transactions/user/${userId}?${params}`);
  return response.data;
};

export const earnPoints = async (userId: string, points: number, source = "system") => {
  const response = await api.post("/transactions/earn", {
    userId,
    points,
    source,
  });

  return response.data;
};

export default api;

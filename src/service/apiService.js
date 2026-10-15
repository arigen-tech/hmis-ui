import { API_HOST, REFRESH_TOKEN } from "../config/apiConfig.js";
const BASE_URL = API_HOST;

const createRequestError = (status, message, response) => {
  const error = new Error(message);
  error.status = status;
  error.message = message;
  error.response = response;
  return error;
};

/**
 * Identify whether user session was stored in localStorage or sessionStorage
 */
export const getActiveStorage = () => {
  if (localStorage.getItem("refreshToken") || localStorage.getItem("token")) {
    return localStorage;
  }
  if (sessionStorage.getItem("refreshToken") || sessionStorage.getItem("token")) {
    return sessionStorage;
  }
  return null;
};

/**
 * Update the active storage (localStorage or sessionStorage) with new auth payload
 */
export const updateStorageWithAuthData = (data, targetStorage = null) => {
  const storage = targetStorage || getActiveStorage() || localStorage;
  if (!data || !storage) return;

  const currentTime = Date.now();
  const isTokenValid = data.jwtTokenExpiry ? data.jwtTokenExpiry > currentTime : true;

  if (data.jwtToken) storage.setItem("token", data.jwtToken);
  if (data.refreshToken) storage.setItem("refreshToken", data.refreshToken);
  if (data.username !== undefined) storage.setItem("username", String(data.username));
  if (data.userId !== undefined) {
    storage.setItem("userId", String(data.userId));
    localStorage.setItem("userId", String(data.userId));
  }
  if (data.roleId !== undefined) {
    storage.setItem("roleId", String(data.roleId));
    if (!storage.getItem("activeRoleId")) storage.setItem("activeRoleId", String(data.roleId));
    if (!storage.getItem("assignedRoleIds")) storage.setItem("assignedRoleIds", String(data.roleId));
  }
  if (data.jwtTokenExpiry !== undefined) {
    storage.setItem("AuthValidation", String(data.jwtTokenExpiry));
    storage.setItem("isTokenValid", String(isTokenValid));
  }
  if (data.hospitalId !== undefined) storage.setItem("hospitalId", String(data.hospitalId));
  if (data.departmentId !== undefined) storage.setItem("departmentId", String(data.departmentId));
  if (data.departmentName !== undefined) storage.setItem("departmentName", String(data.departmentName));
  if (data.departmentCode !== undefined) storage.setItem("departmentCode", String(data.departmentCode));
  if (data.loggedInUserName !== undefined) storage.setItem("loggedInUserName", String(data.loggedInUserName));
};

let isRedirecting = false;
const redirectToLogin = () => {
  localStorage.clear();
  sessionStorage.clear();
  if (typeof window !== "undefined" && window.location.pathname !== "/" && !isRedirecting) {
    isRedirecting = true;
    window.location.href = "/";
  }
};

const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

/**
 * Public GET request (no Authorization header).
 */
export const getPublicRequest = async (endpoint, headers = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJsonResponse ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (data && typeof data === "object" && data.message) ||
        (typeof data === "string" && data) ||
        response.statusText ||
        "Request failed";

      throw createRequestError(response.status, message, data);
    }

    return data;
  } catch (error) {
    console.error("GET (public) Error:", error);
    throw error;
  }
};

/**
 * Public POST request (no Authorization header).
 * Used for login, OTP, and refreshToken API.
 */
export const postPublicRequest = async (endpoint, data, options = {}) => {
  try {
    const isMultipart = options.isMultipart;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...(isMultipart ? {} : { "Content-Type": "application/json" }),
      },
      body: isMultipart ? data : JSON.stringify(data),
    });

    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");
    const responseData = isJsonResponse
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        (responseData && typeof responseData === "object" && responseData.message) ||
        (typeof responseData === "string" && responseData) ||
        response.statusText ||
        "Request failed";

      throw createRequestError(response.status, message, responseData);
    }

    return responseData;
  } catch (error) {
    console.error("POST (public) Error:", error);
    throw error;
  }
};

let refreshPromise = null;

/**
 * Refresh access token using the stored refresh token.
 * Prevents multiple simultaneous refresh calls via singleton promise.
 */
export const refreshAuthToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const storage = getActiveStorage();
        const currentRefreshToken = storage?.getItem("refreshToken");

        if (!currentRefreshToken) {
          redirectToLogin();
          throw new Error("No refresh token available");
        }

        // Call refresh token API without Authorization header
        const res = await postPublicRequest(REFRESH_TOKEN, {
          refreshToken: currentRefreshToken,
        });

        if (res?.status === 200 && res?.response?.jwtToken) {
          updateStorageWithAuthData(res.response, storage);
          return res.response.jwtToken;
        }

        throw new Error(res?.message || "Failed to refresh token");
      } catch (error) {
        redirectToLogin();
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

/**
 * Internal fetch wrapper with automatic token injection and 401 refresh retry.
 */
const fetchWithAuth = async (url, options = {}) => {
  let tokenUsed = getAuthToken();

  const makeRequest = () => {
    tokenUsed = getAuthToken();
    const authHeaders = tokenUsed ? { Authorization: `Bearer ${tokenUsed}` } : {};
    const cleanHeaders = { ...(options.headers || {}) };
    delete cleanHeaders.Authorization;

    return fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...cleanHeaders,
      },
    });
  };

  let response = await makeRequest();

  if (response.status === 401) {
    const currentToken = getAuthToken();
    if (currentToken && currentToken !== tokenUsed) {
      // If another request already refreshed token concurrently, retry immediately
      response = await makeRequest();
    } else {
      await refreshAuthToken();
      response = await makeRequest();
    }
  }

  return response;
};

/**
 * Function to call GET API with authorization and auto refresh on 401
 */
export const getRequest = async (endpoint, headers = {}) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJsonResponse ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (data && typeof data === "object" && data.message) ||
        (typeof data === "string" && data) ||
        response.statusText ||
        "Request failed";

      throw createRequestError(response.status, message, data);
    }

    return data;
  } catch (error) {
    console.error("GET Error:", error);
    throw error;
  }
};

/**
 * GET request with AbortController support.
 *
 * Behaves exactly like `getRequest` but forwards `signal` to fetch so
 * the caller can cancel an in-flight request (e.g. on component unmount
 * during background polling).
 *
 * Throws `AbortError` (DOMException with name === "AbortError") when the
 * signal fires — callers should handle that case and NOT treat it as a
 * failed request.
 *
 * @param {string} endpoint - API path, e.g. "/doctor/summary?..."
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]  - Cancels the request when aborted
 * @param {object}     [options.headers] - Extra headers (same shape as getRequest)
 * @returns {Promise<any>}
 */
export const getRequestWithSignal = async (endpoint, options = {}) => {
  const { signal, headers = {} } = options;

  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal, // 👈 forwarded to native fetch → request is cancelled on abort
    });

    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJsonResponse ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (data && typeof data === "object" && data.message) ||
        (typeof data === "string" && data) ||
        response.statusText ||
        "Request failed";

      throw createRequestError(response.status, message, data);
    }

    return data;
  } catch (error) {
    // AbortError is expected behaviour, not a real failure.
    // Log it separately so real errors are still visible.
    if (error?.name === "AbortError") {
      // Silently propagate — callers check `err.name === "AbortError"`
      throw error;
    }

    console.error("GET Error:", error);
    throw error;
  }
};

/**
 * Function to call GET API for images/blobs/json
 */
export const getImageRequest = async (
  endpoint,
  headers = {},
  responseType = "json",
) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        ...(responseType === "json" && { "Content-Type": "application/json" }),
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GET request failed: ${response.status}`);
    }

    switch (responseType) {
      case "blob":
        return await response.blob();
      case "text":
        return await response.text();
      case "json":
      default:
        return await response.json();
    }
  } catch (error) {
    console.error("GET Error:", error);
    throw error;
  }
};

/**
 * Function to call POST API with authorization and auto refresh on 401
 */
export const postRequest = async (endpoint, data, options = {}) => {
  try {
    const isMultipart = options.isMultipart;

    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...(isMultipart ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
      body: isMultipart ? data : JSON.stringify(data),
    });

    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");
    const responseData = isJsonResponse ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (responseData && typeof responseData === "object" && responseData.message) ||
        (typeof responseData === "string" && responseData) ||
        response.statusText ||
        "Request failed";

      throw createRequestError(response.status, message, responseData);
    }

    return responseData;
  } catch (error) {
    console.error("POST Error:", error);
    throw error;
  }
};

/**
 * Function to call POST API with FormData
 */
export const postRequestWithFormData = async (endpoint, formData) => {
  try {
    console.log(`Sending request to: ${endpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "POST",
      signal: controller.signal,
      body: formData,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", errorText);
      throw new Error(
        `POST request failed: ${response.status} - ${errorText || response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("POST Error:", error);

    if (error.name === "AbortError") {
      throw new Error(
        "Request timed out. Please check your network connection and try again.",
      );
    } else if (error.message.includes("Failed to fetch")) {
      throw new Error(
        "Network connection error. Please check if the server is running and accessible.",
      );
    }

    throw error;
  }
};

/**
 * Function to call PUT API with FormData
 */
export const putRequestWithFormData = async (endpoint, formData) => {
  try {
    console.log(`Sending PUT request to: ${endpoint}`);

    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", errorText);
      throw new Error(
        `PUT request failed: ${response.status} - ${errorText || response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("PUT Error:", error);

    if (error.message.includes("Failed to fetch")) {
      throw new Error(
        "Network connection error. Please check if the server is running and accessible.",
      );
    }

    throw error;
  }
};

/**
 * Function to call PUT API
 */
export const putRequest = async (endpoint, data, headers = {}) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });

    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");

    const responseData = isJsonResponse
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        (responseData &&
          typeof responseData === "object" &&
          responseData.message) ||
        (typeof responseData === "string" && responseData) ||
        response.statusText ||
        `PUT request failed: ${response.status}`;

      throw createRequestError(response.status, message, responseData);
    }

    return {
      status: response.status,
      data: responseData,
    };
  } catch (error) {
    console.error("PUT Error:", error);
    throw error;
  }
};

/**
 * Fetch PDF report from the server
 */
export const fetchPdfReportForViewAndPrint = async (reportUrl, flag) => {
  const response = await fetchWithAuth(`${reportUrl}&flag=${flag}`, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`);
  }

  return await response.blob();
};

export const uploadFileWithJson = async (endpoint, jsonData, files) => {
  if (!files || !(files instanceof FileList || files instanceof File)) {
    throw new Error("No valid file provided!");
  }

  const formData = new FormData();
  formData.append(
    "json",
    new Blob([JSON.stringify(jsonData)], { type: "application/json" }),
  );

  if (files instanceof FileList) {
    formData.append("files", files[0]);
  } else {
    formData.append("files", files);
  }

  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error during file upload:", error.message);
    throw error;
  }
};

export const updateFileWithJson = async (endpoint, jsonData, files) => {
  const formData = new FormData();
  formData.append(
    "json",
    new Blob([JSON.stringify(jsonData)], { type: "application/json" }),
  );

  if (files instanceof FileList) {
    formData.append("files", files[0]);
  } else {
    formData.append("files", files);
  }

  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error during file upload:", error.message);
    throw error;
  }
};

export async function uploadMultiFileWithJson(endpoint, jsonData, files1, files2) {
  const formData = new FormData();
  formData.append(
    "json",
    new Blob([JSON.stringify(jsonData)], { type: "application/json" }),
  );
  formData.append(`bannerImage`, files1);
  formData.append(`thumbImage`, files2);

  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error during file upload:", error.message);
    throw error;
  }
}

export async function updateMultiFileWithJson(endpoint, jsonData, files1, files2) {
  const formData = new FormData();
  formData.append(
    "json",
    new Blob([JSON.stringify(jsonData)], { type: "application/json" }),
  );
  if (files1) {
    formData.append("bannerImage", files1);
  }
  if (files2) {
    formData.append("thumbImage", files2);
  }

  try {
    const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error during file update:", error.message);
    throw error;
  }
}

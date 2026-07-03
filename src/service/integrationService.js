import {
  DEFAULT_RSA_PUBLIC_KEY,
  ABDM_CONSENT_APPROVE,
  ABDM_CONSENT_DENY,
  ABDM_CONSENT_DETAIL,
  ABDM_CONSENT_LIST,
  ABDM_CONSENT_REQUEST,
  ABDM_CONSENT_REVOKE,
  ABDM_GENERATE_CAPTCHA,
  ABDM_VERIFY_HEALTH_ID,
  ABDM_M2_DISCOVER_PATIENTS,
  ABDM_M2_LINK_INITIATE,
  ABDM_M2_LINK_VERIFY,
  ABDM_M2_CONSENT_REQUEST,
  ABDM_M2_CONSENT_LIST,
  ABDM_M2_CONSENT_STATUS,
  ABDM_M2_FETCH_RECORDS,
} from "../config/apiConfig";

const INTEGRATION_BASE_URL = "http://localhost:8080";
const ABDM_PREFIX = "/api/v1/abdm";
const NHCX_PREFIX = "/beneficiary/api/v1/bis";

let abdmPublicKeyPromise = null;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");

  return {
    "Content-Type": "application/json",
    ...(userId ? { userId: String(userId) } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getBrowserCrypto = () => {
  const cryptoApi = typeof window !== "undefined" ? window.crypto : null;

  if (!cryptoApi?.subtle || !cryptoApi?.getRandomValues) {
    throw new Error("Secure browser crypto is not available.");
  }

  return cryptoApi;
};

const toBase64 = (bufferLike) => {
  const bytes =
    bufferLike instanceof Uint8Array ? bufferLike : new Uint8Array(bufferLike);

  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary);
};

const fromBase64 = (base64) => {
  const normalized = (base64 || "")
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const parseErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data?.message || data?.error || `Request failed with status ${response.status}`;
  } catch (error) {
    return `Request failed with status ${response.status}`;
  }
};

const postIntegration = async (endpoint, payload = {}) => {
  const response = await fetch(`${INTEGRATION_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

const getIntegration = async (endpoint) => {
  const response = await fetch(`${INTEGRATION_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

const getAbdmPublicKey = async () => {
  if (!abdmPublicKeyPromise) {
    abdmPublicKeyPromise = (async () => {
      const cryptoApi = getBrowserCrypto();
      const publicKey = DEFAULT_RSA_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error("Unable to load the ABDM public key.");
      }

      return cryptoApi.subtle.importKey(
        "spki",
        fromBase64(publicKey),
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"],
      );
    })().catch((error) => {
      abdmPublicKeyPromise = null;
      throw error;
    });
  }

  return abdmPublicKeyPromise;
};

const encryptWithAesGcm = async (cryptoApi, aesCryptoKey, rawValue) => {
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const encodedValue = new TextEncoder().encode(String(rawValue ?? ""));
  const encryptedValue = await cryptoApi.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesCryptoKey,
    encodedValue,
  );

  const combined = new Uint8Array(iv.length + encryptedValue.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedValue), iv.length);

  return toBase64(combined);
};

const getHospitalContext = () => {
  const rawHospitalId =
    sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId") || "1565";

  const parsedHospitalId = Number(rawHospitalId);

  return {
    hospitalId: Number.isFinite(parsedHospitalId) ? parsedHospitalId : 1565,
  };
};

export const integrationService = {
  baseUrl: INTEGRATION_BASE_URL,

  async secureAbdmFieldPayload({ field, value }) {
    if (!field) {
      throw new Error("Secure ABDM field name is required.");
    }

    const cryptoApi = getBrowserCrypto();
    const publicKey = await getAbdmPublicKey();
    const aesKey = cryptoApi.getRandomValues(new Uint8Array(32));
    const aesCryptoKey = await cryptoApi.subtle.importKey(
      "raw",
      aesKey,
      "AES-GCM",
      false,
      ["encrypt"],
    );

    const [encryptedValue, encryptedKey] = await Promise.all([
      encryptWithAesGcm(cryptoApi, aesCryptoKey, value),
      cryptoApi.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, aesKey),
    ]);

    return {
      [field]: encryptedValue,
      key: toBase64(encryptedKey),
    };
  },

  async sendAbdmAadhaarOtp(payload) {
    return postIntegration(`${ABDM_PREFIX}/create/send-otp-aadhaar`, payload);
  },

  async verifyAbdmAadhaarOtp(payload) {
    return postIntegration(`${ABDM_PREFIX}/create/verify-otp-aadhaar`, payload);
  },

  async generateAbdmCaptcha(payload = {}) {
    return postIntegration(ABDM_GENERATE_CAPTCHA, payload);
  },

  async verifyAbdmHealthId(payload) {
    if (!payload?.healthId) {
      throw new Error("ABHA health ID is required.");
    }

    return postIntegration(ABDM_VERIFY_HEALTH_ID, payload);
  },

  async requestAbdmConsent(payload) {
    return postIntegration(ABDM_CONSENT_REQUEST, payload);
  },

  async approveAbdmConsent(payload) {
    return postIntegration(ABDM_CONSENT_APPROVE, payload);
  },

  async denyAbdmConsent(payload) {
    return postIntegration(ABDM_CONSENT_DENY, payload);
  },

  async revokeAbdmConsent(payload) {
    return postIntegration(ABDM_CONSENT_REVOKE, payload);
  },

  async getAbdmConsent(consentId) {
    if (!consentId) {
      throw new Error("Consent ID is required.");
    }

    return getIntegration(`${ABDM_CONSENT_DETAIL}/${encodeURIComponent(consentId)}`);
  },

  async listAbdmConsents(abhaId) {
    if (!abhaId) {
      throw new Error("Patient ABHA ID is required.");
    }

    return getIntegration(`${ABDM_CONSENT_LIST}/${encodeURIComponent(abhaId)}`);
  },

  async verifyAbdmAadhaarAnotherNumber(payload) {
    return postIntegration(`${ABDM_PREFIX}/create/verify-otp-aadhaar-another-number`, payload);
  },

  async getAbhaAddressSuggestion(payload) {
    return postIntegration(`${ABDM_PREFIX}/create/abha-address-suggestion`, payload);
  },

  async updateAbhaAddress(payload) {
    return postIntegration(`${ABDM_PREFIX}/create/update-abha-address`, payload);
  },

  async getAbhaDetails(payload) {
    return postIntegration(`${ABDM_PREFIX}/create/abha-details`, payload);
  },

  async downloadAbhaCard(payload) {
    return postIntegration(`${ABDM_PREFIX}/create/abha-download`, payload);
  },

  async getAbdmAuthMethods() {
    return postIntegration(`${ABDM_PREFIX}/master/get-list`);
  },

  async sendAbdmVerificationOtp(payload) {
    return postIntegration(`${ABDM_PREFIX}/verificationWeb/send-otp`, payload);
  },

  async sendAbdmVerificationOtpUsingAuth(payload) {
    return postIntegration(`${ABDM_PREFIX}/verificationWeb/send-otp-usingAuth`, payload);
  },

  async sendAbdmVerificationIndexOtp(payload) {
    return postIntegration(`${ABDM_PREFIX}/verificationWeb/index-otp`, payload);
  },

  async verifyAbdmVerificationOtp(payload) {
    return postIntegration(`${ABDM_PREFIX}/verificationWeb/verify-otp`, payload);
  },

  async fetchNhcxCount(kind, payload = {}) {
    const endpointMap = {
      preauthPending: `${NHCX_PREFIX}/dashboard/get-countPreAuthRaised`,
      preauthQuery: `${NHCX_PREFIX}/dashboard/get-countPreauthQuery`,
      preauthApproved: `${NHCX_PREFIX}/dashboard/get-countPreAuthApprove`,
      preauthRejected: `${NHCX_PREFIX}/dashboard/get-countFundEnhancement`,
    };

    const endpoint = endpointMap[kind];

    if (!endpoint) {
      throw new Error(`Unsupported NHCX count type: ${kind}`);
    }

    return postIntegration(endpoint, {
      ...getHospitalContext(),
      ...payload,
    });
  },

  async fetchNhcxDashboardRecords(payload = {}) {
    return postIntegration(`${NHCX_PREFIX}/dashboard/get-AllRecords`, {
      page: 1,
      limit: 10,
      ...getHospitalContext(),
      ...payload,
    });
  },

  async discoverPatientRecords(patientId) {
    return postIntegration(ABDM_M2_DISCOVER_PATIENTS, { patientId });
  },

  async initiateCareContextLink(payload) {
    return postIntegration(ABDM_M2_LINK_INITIATE, payload);
  },

  async verifyCareContextLink(payload) {
    return postIntegration(ABDM_M2_LINK_VERIFY, payload);
  },

  async createConsentRequest(payload) {
    return postIntegration(ABDM_M2_CONSENT_REQUEST, payload);
  },

  async fetchConsentRequests(payload = {}) {
    return postIntegration(ABDM_M2_CONSENT_LIST, payload);
  },

  async refreshConsentStatus(consentRequestId) {
    return postIntegration(ABDM_M2_CONSENT_STATUS, { consentRequestId });
  },

  async fetchSharedClinicalRecords(consentRequestId) {
    return postIntegration(ABDM_M2_FETCH_RECORDS, { consentRequestId });
  },
};

export const integrationHelpers = {
  getHospitalContext,
};

import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_HOST, VIEW_ADMISSION_DOCUMENT } from "../config/apiConfig";

// ---------- API Call ----------
const viewAdmissionDocument = async (filePath) => {
  try {
    let token = "";
    if (localStorage.token) {
      token = `Bearer ${localStorage.getItem("token")}`;
    } else if (sessionStorage.token) {
      token = `Bearer ${sessionStorage.getItem("token")}`;
    }

    const response = await axios.get(
      `${API_HOST}${VIEW_ADMISSION_DOCUMENT}?filePath=${encodeURIComponent(filePath)}`,
      {
        headers: {
          Authorization: token,
        }
      }
    );

    const base64 = response.data.response || response.data.data;

    if (!base64) {
      throw new Error("Document data is empty");
    }

    // Convert Base64 -> Blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    // Detect MIME type from file path
    const extension = filePath.split(".").pop().toLowerCase();

    const mimeTypes = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      svg: "image/svg+xml",
    };

    const mimeType = mimeTypes[extension] || "application/octet-stream";

    const blob = new Blob([byteArray], {
      type: mimeType,
    });

    const url = URL.createObjectURL(blob);

    return {
      url,
      mimeType,
    };
  } catch (error) {
    console.error("Error viewing document:", error);
    throw error;
  }
};

// ---------- PREVIEW COMPONENT ----------
const DocumentPreview = ({ filePath, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath) return;

    let objectUrl = null;

    const loadDocument = async () => {
      try {
        setLoading(true);
        const result = await viewAdmissionDocument(filePath);

        objectUrl = result.url;
        setPreviewUrl(result.url);
        setMimeType(result.mimeType);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [filePath]);

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Document Preview</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body text-center" style={{ minHeight: '300px' }}>
            {loading && <div>Loading document...</div>}
            {!loading && !previewUrl && <div>No document available</div>}

            {/* Image */}
            {!loading && previewUrl && mimeType.startsWith("image/") && (
              <img
                src={previewUrl}
                alt="Admission Document"
                style={{ maxWidth: "100%", maxHeight: "700px", objectFit: "contain" }}
              />
            )}

            {/* PDF */}
            {!loading && previewUrl && mimeType === "application/pdf" && (
              <iframe
                src={previewUrl}
                title="Admission Document"
                width="100%"
                height="700px"
                style={{ border: "none" }}
              />
            )}

            {/* Unsupported */}
            {!loading && previewUrl && !mimeType.startsWith("image/") && mimeType !== "application/pdf" && (
              <div>
                <p>Preview not available for this file type.</p>
                <a href={previewUrl} download className="btn btn-primary">
                  Download Document
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;

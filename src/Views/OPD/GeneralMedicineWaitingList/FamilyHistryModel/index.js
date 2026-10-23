import { useEffect, useState, useMemo } from "react";
import {
  MAS_MEDICAL_HISTORY_GET_ALL,
  MAS_SYMPTOMS_GET_ALL,
  MAS_TREATMENT_ADVISE_GET_ALL,
  MAS_OPD_MEDICAL_ADVISE_GET_ALL,
} from "../../../../config/apiConfig";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";

const MasFamilyModel = ({
  show,
  popupType,
  onOk,
  onClose,
  onSelect,
  selectedItems,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState({});

  // Normalize API response keys so UI and hooks stay consistent
  const normalize = (item, type) => {
    if (type === "past" || type === "family") {
      return {
        id: item.medicalHistoryId,
        name: item.medicalHistoryName,
      };
    }

    if (type === "symptoms") {
      return {
        id: item.symptomsId,
        name: item.symptomsName,
      };
    }

    if (type === "treatmentAdvice") {
      return {
        id: item.treatmentAdviseId,
        name: item.treatmentAdvice || item.treatmentAdviseName,
      };
    }

    if (type === "doctorRemark") {
      return {
        id: item.medicalAdviseId,
        name: item.medicalAdviseName,
      };
    }

    return item;
  };

  const fetchOpdTemplateData = async () => {
    if (cache[popupType]) {
      setData(cache[popupType]);
      return;
    }

    setLoading(true);

    try {
      let url = "";

      switch (popupType) {
        case "past":
        case "family":
          url = MAS_MEDICAL_HISTORY_GET_ALL;
          break;

        case "symptoms":
          url = MAS_SYMPTOMS_GET_ALL;
          break;

        case "treatmentAdvice":
          url = MAS_TREATMENT_ADVISE_GET_ALL + "/1";
          break;

        case "doctorRemark":
          url = MAS_OPD_MEDICAL_ADVISE_GET_ALL + "/1";
          break;

        default:
          url = MAS_MEDICAL_HISTORY_GET_ALL;
      }

      const result = await getRequest(url);

      if (result?.status === 200 && Array.isArray(result?.response)) {
        let responseData = result.response;

        if (popupType === "doctorRemark" || popupType === "treatmentAdvice") {
          const loggedInDeptId = Number(
            sessionStorage.getItem("departmentId") ||
            localStorage.getItem("departmentId")
          );

          responseData = responseData.filter(
            (item) =>
              !item.departmentId || Number(item.departmentId) === loggedInDeptId
          );
        }

        const formatted = responseData.map((item) =>
          normalize(item, popupType),
        );

        setCache((prev) => ({ ...prev, [popupType]: formatted }));
        setData(formatted);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching history data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchOpdTemplateData();
  }, [show, popupType]);

  // Track selected IDs
  const selectedIds = useMemo(
    () => new Set(selectedItems.map((x) => x.id)),
    [selectedItems],
  );

  const isChecked = (id) => selectedIds.has(id);

  if (!show) return null;

  const title =
    popupType === "symptoms"
      ? "Select Symptoms"
      : popupType === "past"
        ? "Select Past History"
        : popupType === "family"
          ? "Select Present History"
          : popupType === "treatmentAdvice"
            ? "Select Treatment Advice"
            : popupType === "doctorRemark"
              ? "Select Doctor Remarks"
              : "Select Items";

  return (
    <>
      {loading && <LoadingScreen />}

      <div
        className="modal fade show d-block"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body" style={{ 
              opacity: loading ? 0.3 : 1, 
              pointerEvents: loading ? 'none' : 'auto'
            }}>
              {!loading && (
                <div
                  style={{
                    maxHeight: "60vh",
                    overflowY: "auto",
                    padding: "15px",
                    borderRadius: "8px",
                    backgroundColor: "#f4f5f7" 
                  }}
                >
                  {data.length === 0 ? (
                    <div className="text-center text-muted py-4">No records found</div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        // Forces exactly 4 items per row
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "12px",
                      }}
                    >
                      {data.map((item) => {
                        const checked = isChecked(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`d-flex align-items-center p-2 rounded ${
                              checked ? "bg-primary text-white" : "bg-white text-dark"
                            }`}
                            style={{ 
                              cursor: "pointer", 
                              margin: 0, 
                              transition: "all 0.2s ease-in-out",
                              userSelect: "none",
                              border: "none",
                              boxShadow: checked 
                                ? "0 4px 8px rgba(13, 110, 253, 0.3)" 
                                : "0 2px 4px rgba(0, 0, 0, 0.08)"    
                            }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input me-2 m-0"
                              checked={checked}
                              onChange={() => onSelect(item)}
                              style={{ 
                                cursor: "pointer",
                                flexShrink: 0, // Prevents checkbox from squishing on long text
                                transition: "box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out",
                                borderColor: !checked ? "#0d6efd" : "",
                                // Increased opacity, blur, and spread to make it a stronger glow/emission
                                boxShadow: !checked 
                                  ? "0 0 6px 3px rgba(13, 110, 253, 0.5)" 
                                  : "none" 
                              }}
                            />
                            <span className="text-truncate" title={item.name} style={{ fontSize: "14px" }}>
                              {item.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>

              <button className="btn btn-primary" onClick={onOk}>
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MasFamilyModel;
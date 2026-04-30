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
        name: item.treatmentAdvice || item.treatmentAdviseName, // FIXED: Added fallback
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

        case "symptoms": // FIXED: Added symptoms case
          url = MAS_SYMPTOMS_GET_ALL;
          break;

        case "treatmentAdvice":
          url = MAS_TREATMENT_ADVISE_GET_ALL;
          break;

        case "doctorRemark":
          url = MAS_OPD_MEDICAL_ADVISE_GET_ALL;
          break;

        default:
          url = MAS_MEDICAL_HISTORY_GET_ALL;
      }

      const result = await getRequest(url);

      if (result?.status === 200 && Array.isArray(result?.response)) {
        const formatted = result.response.map((item) =>
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
          ? "Select Family History"
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
              pointerEvents: loading ? 'none' : 'auto' // FIXED: Disable interactions while loading
            }}>
              {!loading && (
                <div
                  style={{
                    maxHeight: "60vh",
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                  }}
                >
                  <table className="table table-hover table-bordered m-0">
                    <thead className="table-secondary">
                      <tr>
                        <th style={{ width: "50px", textAlign: "center" }}>
                          ✔
                        </th>
                        <th>Name</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.map((item) => (
                        <tr
                          key={item.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => onSelect(item)}
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={isChecked(item.id)}
                              onChange={() => onSelect(item)} // FIXED: Added onChange
                              onClick={(e) => e.stopPropagation()} // FIXED: Prevent double trigger
                              readOnly // Keep readOnly to prevent double events
                            />
                          </td>

                          <td>{item.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
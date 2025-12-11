import { useEffect, useState, useMemo } from "react";
import { MASTERS } from "../../../../config/apiConfig";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";

const MasFamilyModel = ({ show, popupType, onOk, onClose, onSelect, selectedItems }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

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
                name: item.treatmentAdvice,
            };
        }

        return item;
    };

    const fetchOpdTemplateData = async () => {
        setLoading(true);

        try {
            let url = "";

            switch (popupType) {
                case "past":
                    url = `${MASTERS}/masMedicalHistory/getAll/1`;
                    break;

                case "family":
                    url = `${MASTERS}/masMedicalHistory/getAll/1`;
                    break; // ✅ FIXED MISSING BREAK

                case "symptoms":
                    url = `${MASTERS}/masMedicalHistory1/getAll/1`;
                    break;

                case "treatmentAdvice":
                    url = `${MASTERS}/masTreatmentAdvise/getAll/1`;
                    break;

                default:
                    url = `${MASTERS}/masMedicalHistory/getAll/1`;
            }

            const result = await getRequest(url);

            if (result?.status === 200 && Array.isArray(result?.response)) {
                const formatted = result.response.map((item) => normalize(item, popupType));
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
        [selectedItems]
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
            : "Select Items";

    return (
        <>
            {loading && <LoadingScreen />}

            <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">

                        <div className="modal-header bg-light">
                            <h5 className="modal-title fw-bold">{title}</h5>
                            <button className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body" style={{ opacity: loading ? 0.3 : 1 }}>
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
                                                <th style={{ width: "50px", textAlign: "center" }}>✔</th>
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
                                                            readOnly
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

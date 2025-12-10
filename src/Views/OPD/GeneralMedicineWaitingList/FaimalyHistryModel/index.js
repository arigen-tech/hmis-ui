import { useEffect, useState, useMemo } from "react";
import { MASTERS } from "../../../../config/apiConfig";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";

const MasFamilyModel = ({ show, popupType, onOk, onClose, onSelect, selectedItems }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOpdTemplateData = async () => {
        setLoading(true);

        try {
            const result = await getRequest(`${MASTERS}/masMedicalHistory/getAll/1`);

            if (result.status === 200 && Array.isArray(result.response)) {
                setData(result.response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Error fetching history data:", error);
            setData([]);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (show) {
            fetchOpdTemplateData();
        }
    }, [show]);

    // ❗ MUST be above early return (fixes ESLint hook order error)
    const selectedIds = useMemo(
        () => new Set(selectedItems.map((x) => x.medicalHistoryId)),
        [selectedItems]
    );

    const isChecked = (id) => selectedIds.has(id);

    // ❗ Now it's safe
    if (!show) return null;

    const title =
        popupType === "symptoms"
            ? "Select Symptoms"
            : popupType === "past"
            ? "Select Past History"
            : "Select Family History";

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
                                                    key={item.medicalHistoryId}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => onSelect(item)}
                                                >
                                                    <td className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked(item.medicalHistoryId)}
                                                            readOnly
                                                        />
                                                    </td>

                                                    <td>{item.medicalHistoryName}</td>
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

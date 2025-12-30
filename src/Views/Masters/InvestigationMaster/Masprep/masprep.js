import { useEffect, useState } from "react";
import LoadingScreen from "../../../../Components/Loading";

const MasPreparationModel = ({ show, onOk, onClose, selectedItems }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPreparations, setSelectedPreparations] = useState([]);

    // Normalize API response keys and accept dummy items
    const normalize = (item) => {
        return {
            id: item.preparationId || item.id,
            name: item.preparationName || item.name || "",
            turnaroundTime: item.turnaroundTime ?? 0,
            estimatedDays: item.estimatedDays ?? 0
        };
    };

    const fetchPreparationData = async () => {
        setLoading(true);
        try {
            // Using dummy data to keep the modal simple
            const dummy = [
                { id: 1, name: "Fasting 8 Hours", turnaroundTime: 0, estimatedDays: 0 },
                { id: 2, name: "No food 2 hours before test", turnaroundTime: 0, estimatedDays: 0 },
                { id: 3, name: "Bring previous reports", turnaroundTime: 0, estimatedDays: 0 },
                { id: 4, name: "Avoid fatty foods", turnaroundTime: 0, estimatedDays: 0 },
                { id: 5, name: "Drink plenty of water", turnaroundTime: 0, estimatedDays: 0 },
                { id: 6, name: "No alcohol 24 hours before", turnaroundTime: 0, estimatedDays: 0 },
                { id: 7, name: "Stop certain medications", turnaroundTime: 0, estimatedDays: 0 },
                { id: 8, name: "Wear comfortable clothing", turnaroundTime: 0, estimatedDays: 0 },
                { id: 9, name: "Bring ID proof", turnaroundTime: 0, estimatedDays: 0 },
                { id: 10, name: "Inform about allergies", turnaroundTime: 0, estimatedDays: 0 },
            ];
            const formatted = dummy.map((item) => normalize(item));
            setData(formatted);
        } catch (error) {
            console.error("Error preparing dummy data:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) {
            fetchPreparationData();
            // Initialize with previously selected items if any
            if (selectedItems && selectedItems.length > 0) {
                setSelectedPreparations(selectedItems);
            } else {
                setSelectedPreparations([]);
            }
        }
    }, [show, selectedItems]);

    const handleCheckboxChange = (item) => {
        const exists = selectedPreparations.some(p => p.id === item.id);
        if (exists) {
            setSelectedPreparations(prev => prev.filter(p => p.id !== item.id));
        } else {
            setSelectedPreparations(prev => [...prev, {
                id: item.id,
                preparationText: item.name,
                estimatedDays: item.estimatedDays,
                turnaroundTime: item.turnaroundTime
            }]);
        }
    };

    const isChecked = (id) => {
        return selectedPreparations.some(p => p.id === id);
    };

    const handleOk = () => {
        if (onOk) {
            onOk(selectedPreparations);
        }
    };

    if (!show) return null;

    return (
        <>
            {loading && <LoadingScreen />}

            <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">Select Preparation Required</h5>
                            <button className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body" style={{ opacity: loading ? 0.3 : 1 }}>
                            {!loading && (
                                <>
                                    {/* Master Data Table with Checkboxes */}
                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="table table-hover table-bordered m-0">
                                            <thead className="table-secondary sticky-top" style={{ top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th style={{ width: "50px", textAlign: "center" }}>Select</th>
                                                    <th>Preparation Name</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {data.length > 0 ? (
                                                    data.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked(item.id)}
                                                                    onChange={() => handleCheckboxChange(item)}
                                                                />
                                                            </td>
                                                            <td>{item.name}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="text-center py-3">
                                                            No preparation data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Note for users */}
                                    <div className="alert alert-light mt-3 p-2">
                                        <small className="text-muted">
                                            <strong>Note:</strong> Selected preparations will be concatenated with line breaks in the main form.
                                        </small>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleOk}>
                                Save
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default MasPreparationModel;
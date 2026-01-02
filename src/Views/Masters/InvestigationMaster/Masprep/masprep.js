import { useEffect, useState } from "react";
import LoadingScreen from "../../../../Components/Loading";
import { getRequest } from "../../../../service/apiService";
import { MAS_PATIENT_PREPARATION } from "../../../../config/apiConfig";

const MasPreparationModel = ({ show, onOk, onClose, selectedItems }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPreparations, setSelectedPreparations] = useState([]);

    // Fetch preparation data from API
    const fetchPreparationData = async () => {
        setLoading(true);
        try {
            // Call the getAll API with flag=1 to get only active records
            const response = await getRequest(`${MAS_PATIENT_PREPARATION}/all?flag=1`);
            
            if (response && response.response) {
                // Map the API response to include only preparationId and preparationName
                const formatted = response.response.map(item => ({
                    id: item.preparationId,
                    name: item.preparationName,
                }));
                setData(formatted);
            } else {
                setData([]);
            }
        } catch (error) {
        
            console.error("Error fetching preparation data:", error);
            
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
                                    {/* <div className="alert alert-light mt-3 p-2">
                                        <small className="text-muted">
                                            <strong>Note:</strong> Selected preparations will be concatenated with line breaks in the main form.
                                        </small>
                                    </div> */}
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
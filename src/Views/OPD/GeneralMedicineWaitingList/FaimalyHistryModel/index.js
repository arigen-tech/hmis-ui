import React, { useEffect, useState } from "react";

const MasFamilyModel = ({ show, popupType, onOk, onClose, onSelect, selectedItems }) => {
    //   const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const data = [
        { id: 1, name: "Fever", description: "High temperature" },
        { id: 2, name: "Cough", description: "Persistent cough" },
        { id: 3, name: "Diabetes History", description: "Family diabetes" },
    ];

    //   useEffect(() => {
    //     if (!show || !popupType) return;

    //     setLoading(true);
    //     setData([]);

    //     let apiUrl = "";

    //     if (popupType === "symptoms") apiUrl = "/api/symptoms";
    //     if (popupType === "past") apiUrl = "/api/past-history";
    //     if (popupType === "family") apiUrl = "/api/family-history";

    //     const fetchData = async () => {
    //       try {
    //         const response = await fetch(apiUrl);
    //         const result = await response.json();
    //         setData(result.data);
    //       } catch (error) {
    //         console.error("Error fetching data:", error);
    //       }

    //       setLoading(false);
    //     };

    //     fetchData();
    //   }, [show, popupType]);

    if (!show) return null;

    const title =
        popupType === "symptoms"
            ? "Select Symptoms"
            : popupType === "past"
                ? "Select Past History"
                : "Select Family History";

    const isChecked = (id) => selectedItems.some((x) => x.id === id);

    return (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">

                    <div className="modal-header bg-light">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">

                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary"></div>
                                <p className="mt-2">Loading...</p>
                            </div>
                        ) : (
                            <table className="table table-hover table-bordered">
                                <thead className="table-secondary">
                                    <tr>
                                        <th style={{ width: "50px", textAlign: "center" }}>✔</th>
                                        <th>Name</th>
                                        <th>Description</th>
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
                                            <td>{item.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={onOk}
                        >
                            OK
                        </button>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default MasFamilyModel;

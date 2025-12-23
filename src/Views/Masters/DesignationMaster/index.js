import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";

const DesignationMaster = () => {
    const [data, setData] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [popupMessage, setPopupMessage] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 4;

    const [formData, setFormData] = useState({
        designation_name: "",
        description: "",
        created_by: "",
    });

    useEffect(() => {
        const dummy = [
            { id: 1, designation_name: "Manager", description: "Department manager", status: "Y" },
            { id: 2, designation_name: "Team Lead", description: "Tech lead", status: "Y" },
            { id: 3, designation_name: "Developer", description: "Software developer", status: "Y" },
            { id: 4, designation_name: "HR", description: "Human resources", status: "N" },
            { id: 5, designation_name: "Designer", description: "UI/UX Designer", status: "Y" },
            { id: 6, designation_name: "Tester", description: "QA Tester", status: "Y" },
        ];
        setData(dummy);
    }, []);

    const showPopup = (msg, type) => {
        setPopupMessage({ message: msg, type, onClose: () => setPopupMessage(null) });
    };

    const filteredData = data.filter(
        (rec) =>
            rec.designation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rec.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLast = currentPage * recordsPerPage;
    const indexOfFirst = indexOfLast - recordsPerPage;
    const currentRecords = filteredData.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(filteredData.length / recordsPerPage);

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        if (editingRecord) {
            const updated = data.map((rec) =>
                rec.id === editingRecord.id ? { ...rec, ...formData } : rec
            );
            setData(updated);
            showPopup("Record Updated Successfully!", "success");
        } else {
            const newRec = {
                id: Date.now(),
                ...formData,
                status: "Y",
            };
            setData([...data, newRec]);
            showPopup("Record Added Successfully!", "success");
        }

        setFormData({ designation_name: "", description: "", created_by: "" });
        setShowForm(false);
        setEditingRecord(null);
        setIsFormValid(false);
    };

    const handleEdit = (rec) => {
        setEditingRecord(rec);
        setFormData({
            designation_name: rec.designation_name,
            description: rec.description,
            created_by: rec.created_by || "",
        });

        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSwitchChange = (id, newStatus) => {
        const updated = data.map((rec) =>
            rec.id === id ? { ...rec, status: newStatus } : rec
        );
        setData(updated);
        showPopup(newStatus === "Y" ? "Activated" : "Deactivated", "success");
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const updated = { ...formData, [id]: value };
        setFormData(updated);

        setIsFormValid(
            updated.designation_name.trim() !== "" &&
            updated.description.trim() !== ""
        );
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Designation Master</h4>

                            <div className="d-flex align-items-center">
                                {!showForm && (
                                    <input
                                        className="form-control w-50 me-2"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                )}

                                {!showForm ? (
                                    <>
                                        <button
                                            className="btn btn-success me-2"
                                            onClick={() => {
                                                setShowForm(true);
                                                setEditingRecord(null);
                                                setFormData({ designation_name: "", description: "", created_by: "" });
                                            }}
                                        >
                                            Add
                                        </button>
                                        <button className="btn btn-success flex-shrink-0" onClick={() => setSearchQuery("")}>
                                            Show All
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                        Back
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="card-body">
                            {!showForm ? (
                                <>
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Designation Name</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {currentRecords.length > 0 ? (
                                                currentRecords.map((rec) => (
                                                    <tr key={rec.id}>
                                                        <td>{rec.id}</td>
                                                        <td>{rec.designation_name}</td>
                                                        <td>{rec.description}</td>

                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={rec.status === "Y"}
                                                                    onChange={() =>
                                                                        handleSwitchChange(rec.id, rec.status === "Y" ? "N" : "Y")
                                                                    }
                                                                />
                                                                <label className="form-check-label">
                                                                    {rec.status === "Y" ? "Active" : "Inactive"}
                                                                </label>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleEdit(rec)}
                                                                disabled={rec.status !== "Y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center">No Records Found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    <div className="d-flex justify-content-center mt-3">
                                        <ul className="pagination">
                                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                >
                                                    Prev
                                                </button>
                                            </li>

                                            {[...Array(totalPages)].map((_, idx) => (
                                                <li
                                                    key={idx + 1}
                                                    className={`page-item ${currentPage === idx + 1 ? "active" : ""}`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(idx + 1)}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                </li>
                                            ))}

                                            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                >
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <form className="row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Designation Name *</label>
                                        <input
                                            type="text"
                                            id="designation_name"
                                            className="form-control mt-1"
                                            value={formData.designation_name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>Description *</label>
                                        <input
                                            type="text"
                                            id="description"
                                            className="form-control mt-1"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>


                                    <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            Save
                                        </button>

                                        <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={popupMessage.onClose}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignationMaster;

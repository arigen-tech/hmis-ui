
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";




const BloodComponentMaster = () => {
    const [formData, setFormData] = useState({ componentCode: "", componentName: "", description: "", storageTemp: "", shelfLifeDays: "", lastUpdateDate: "" });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editingComponent, setEditingComponent] = useState(null);

    const [componentData, setComponentData] = useState([
        { id: 1, componentCode: "PRBC001", componentName: "Packed Red Blood Cells", description: "Red blood cells separated from plasma", storageTemp: "2-6°C", shelfLifeDays: 42, lastUpdateDate: "2025-12-01", status: "y" },
        { id: 2, componentCode: "FFP001", componentName: "Fresh Frozen Plasma", description: "Plasma frozen within 8 hours of collection", storageTemp: "-18°C", shelfLifeDays: 365, lastUpdateDate: "2025-11-20", status: "y" },
        { id: 3, componentCode: "PLT001", componentName: "Platelets Concentrate", description: "Platelets separated from whole blood", storageTemp: "20-24°C", shelfLifeDays: 5, lastUpdateDate: "2025-12-05", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, componentId: null, newStatus: false });

    const filteredComponents = componentData.filter(component =>
        component.componentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (component) => {
        setEditingComponent(component);
        setFormData({
            componentCode: component.componentCode,
            componentName: component.componentName,
            description: component.description,
            storageTemp: component.storageTemp,
            shelfLifeDays: component.shelfLifeDays,
            lastUpdateDate: component.lastUpdateDate,
        });
        setShowForm(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        if (editingComponent) {
            setComponentData(componentData.map(component =>
                component.id === editingComponent.id
                    ? { ...component, ...formData }
                    : component
            ));
        } else {
            const newComponent = {
                id: componentData.length + 1,
                ...formData,
                status: "y"
            };
            setComponentData([...componentData, newComponent]);
        }

        setEditingComponent(null);
        setShowForm(false);
        setFormData({ componentCode: "", componentName: "", description: "", storageTemp: "", shelfLifeDays: "", lastUpdateDate: "" });
        setIsFormValid(false);
        showPopup("Changes saved successfully!", "success");
    };

    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => { setPopupMessage(null); }
        });
    };

    
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));

        const isCodeValid = id === "componentCode" ? value.trim() !== "" : formData.componentCode.trim() !== "";
        const isNameValid = id === "componentName" ? value.trim() !== "" : formData.componentName.trim() !== "";
        setIsFormValid(isCodeValid && isNameValid);
    };

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, componentId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.componentId !== null) {
            setComponentData((prevData) =>
                prevData.map((component) =>
                    component.id === confirmDialog.componentId ? { ...component, status: confirmDialog.newStatus } : component
                )
            );
        }
        setConfirmDialog({ isOpen: false, componentId: null, newStatus: null });
    };

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredComponents.slice(indexOfFirst, indexOfLast);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Blood Component Master</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Blood Components"
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearch}
                                            />
                                            <span className="input-group-text">
                                                <i className="fa fa-search"></i>
                                            </span>
                                        </div>
                                    </form>
                                ) : null}

                                <div className="d-flex align-items-center">

                                    {!showForm ? (
                                        <>
                                            <button type="button" className="btn btn-success me-2" onClick={() => {
                                                setShowForm(true);
                                                setFormData({ componentCode: "", componentName: "", description: "", storageTemp: "", shelfLifeDays: "", lastUpdateDate: "" });
                                                setEditingComponent(null);
                                            }}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2">
                                                <i className="mdi mdi-format-list-bulleted"></i> Show All
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={() => {
                                            setShowForm(false);
                                            setEditingComponent(null);
                                            setFormData({ componentCode: "", componentName: "", description: "", storageTemp: "", shelfLifeDays: "", lastUpdateDate: "" });
                                        }}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>

                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Component Code</th>
                                                <th>Component Name</th>
                                                <th>Description</th>
                                                <th>Storage Temp</th>
                                                <th>Shelf Life Days</th>
                                                <th>Last Update Date</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((component) => (
                                                <tr key={component.id}>
                                                    <td>{component.componentCode}</td>
                                                    <td>{component.componentName}</td>
                                                    <td>{component.description}</td>
                                                    <td>{component.storageTemp}</td>
                                                    <td>{component.shelfLifeDays}</td>
                                                    <td>{component.lastUpdateDate}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={component.status === "y"}
                                                                onChange={() => handleSwitchChange(component.id, component.status === "y" ? "n" : "y")}
                                                            />
                                                            <label className="form-check-label px-0">
                                                                {component.status === "y" ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(component)}
                                                            disabled={component.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {filteredComponents.length > 0 && (
                                        <Pagination
                                            totalItems={filteredComponents.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4">
                                        <label>Component Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="componentCode"
                                            placeholder="Enter component code"
                                            value={formData.componentCode}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>Component Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="componentName"
                                            placeholder="Enter component name"
                                            value={formData.componentName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>Description</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="description"
                                            placeholder="Enter description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>Storage Temp</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="storageTemp"
                                            placeholder="Enter storage temp"
                                            value={formData.storageTemp}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>Shelf Life Days</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="shelfLifeDays"
                                            placeholder="Enter shelf life days"
                                            value={formData.shelfLifeDays}
                                            onChange={handleInputChange}
                                        />
                                    </div>


                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            {editingComponent ? 'Update' : 'Save'}
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => {
                                            setShowForm(false);
                                            setEditingComponent(null);
                                        }}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BloodComponentMaster;
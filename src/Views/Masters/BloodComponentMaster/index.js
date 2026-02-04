import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";


const BloodComponentMaster = () => {
    const [formData, setFormData] = useState({ componentName: "", description: "" });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [componentData, setComponentData] = useState([
        { id: 1, componentName: "Packed Red Blood Cells", description: "Red blood cells separated from plasma", status: "y" },
        { id: 2, componentName: "Fresh Frozen Plasma", description: "Plasma frozen within 8 hours of collection", status: "y" },
        { id: 3, componentName: "Platelets Concentrate", description: "Platelets separated from whole blood", status: "y" },
        { id: 4, componentName: "Cryoprecipitate", description: "Concentrated clotting factors", status: "y" },
        { id: 5, componentName: "Whole Blood", description: "Unseparated blood collection", status: "y" },
        { id: 6, componentName: "Leukoreduced RBCs", description: "Red blood cells with reduced leukocytes", status: "y" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, componentId: null, newStatus: false });


    const filteredComponents = componentData.filter(component =>
        component.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (component) => {
        setEditingComponent(component);
        setFormData({ componentName: component.componentName, description: component.description || "" });
        setShowForm(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);


    const handleSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const updatedComponentName = e.target.elements.componentName.value;
        const updatedDescription = e.target.elements.description.value;

        if (editingComponent) {
            setComponentData(componentData.map(component =>
                component.id === editingComponent.id
                    ? { ...component, componentName: updatedComponentName, description: updatedDescription }
                    : component
            ));
        } else {
            const newComponent = {
                id: componentData.length + 1,
                componentName: updatedComponentName,
                description: updatedDescription,
                status: "y"
            };
            setComponentData([...componentData, newComponent]);
        }

        setEditingComponent(null);
        setShowForm(false);
        setFormData({ componentName: "", description: "" });
        setIsFormValid(false);
        showPopup("Changes saved successfully!", "success");
    };

    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            }
        });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));

        const isComponentNameValid = id === "componentName" ? value.trim() !== "" : formData.componentName.trim() !== "";
        const isDescriptionValid = true;

        setIsFormValid(isComponentNameValid && isDescriptionValid);
    };

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.componentName) {
            setComponentData([...componentData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ componentName: "", description: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

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
                                            <span className="input-group-text" id="search-icon">
                                                <i className="fa fa-search"></i>
                                            </span>
                                        </div>
                                    </form>
                                ) : (
                                    <></>
                                )}


                                <div className="d-flex align-items-center">
                                    {!showForm ? (
                                        <>

                                            <button type="button" className="btn btn-success me-2" onClick={() => {
                                                setShowForm(true);
                                                setFormData({ componentName: "", description: "" });
                                                setEditingComponent(null);
                                            }}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2 flex-shrink-0">
                                                <i className="mdi mdi-plus"></i> Show All
                                            </button>

                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={() => {
                                            setShowForm(false);
                                            setEditingComponent(null);
                                            setFormData({ componentName: "", description: "" });
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
                                                <th>Component Name</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((component) => (
                                                <tr key={component.id}>
                                                    <td>{component.componentName}</td>
                                                    <td>{component.description}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={component.status === "y"}
                                                                onChange={() => handleSwitchChange(component.id, component.status === "y" ? "n" : "y")}
                                                                id={`switch-${component.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${component.id}`}
                                                            >
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
                                        <label>Component Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="componentName"
                                            placeholder="Enter blood component name"
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
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            {editingComponent ? 'Update' : 'Save'}
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => {
                                            setShowForm(false);
                                            setEditingComponent(null);
                                            setFormData({ componentName: "", description: "" });
                                        }}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {showModal && (
                                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Reports</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                ...
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                                <button type="button" className="btn btn-primary">Generate</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={popupMessage.onClose}
                                />
                            )}
                            {confirmDialog.isOpen && (
                                <div className="modal d-block" tabIndex="-1" role="dialog">
                                    <div className="modal-dialog" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Confirm Status Change</h5>
                                                <button type="button" className="close" onClick={() => handleConfirm(false)}>
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p>
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{componentData.find(component => component.id === confirmDialog.componentId)?.componentName}</strong>?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                                                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BloodComponentMaster;
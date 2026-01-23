import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const NonDrugMaster = () => {
    const [formData, setFormData] = useState({
        itemCode: "",
        itemName: "",
        itemGroup: "",
        itemType: "",
        section: "",
        itemClass: "",
        itemCategory: "",
        unitAU: ""
    })
    const [popupMessage, setPopupMessage] = useState(null)
    const [nonDrugs, setNonDrugs] = useState([])
    const [masStoreGroup, setMasStoreGroup] = useState([])
    const [masItemTypeData, setMasItemTypeData] = useState([]);
    const [itemSectionData, setItemSectionData] = useState([]);
    const [itemClassData, setItemClassData] = useState([]);
    const [serviceCategoryData, setServiceCategoryData] = useState([]);
    const [storeUnitData, setStoreUnitData] = useState([]);
    const [process, setProcess] = useState(false)
    const [editEnabled, setEditEnabled] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false);

    const [editingNonDrug, setEditingNonDrug] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, nonDrugId: null, newStatus: null, name: "" })

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
    }

    useEffect(() => {
        fetchNonDrugMasterData();
        fetchMasterData();
    }, []);

    useEffect(() => {
        if (formData.itemGroup) {
            fetchItemTypesByGroup(formData.itemGroup);
        } else {
            setMasItemTypeData([]);
            setFormData(prev => ({ ...prev, itemType: "", section: "", itemClass: "", itemCategory: "" }));
        }
    }, [formData.itemGroup]);

    useEffect(() => {
        if (formData.itemType) {
            fetchSectionsByItemType(formData.itemType);
        } else {
            setItemSectionData([]);
            setFormData(prev => ({ ...prev, section: "", itemClass: "", itemCategory: "" }));
        }
    }, [formData.itemType]);

    useEffect(() => {
        if (formData.section) {
            // Fetch categories and classes based on selected section
            fetchCategoriesBySection(formData.section);
            fetchClassesBySection(formData.section);
        } else {
            setServiceCategoryData([]);
            setItemClassData([]);
            setFormData(prev => ({ ...prev, itemClass: "", itemCategory: "" }));
        }
    }, [formData.section]);

    useEffect(() => {
        validateForm();
    }, [formData]);

    const validateForm = () => {
        const isValid = 
            formData.itemCode?.trim() !== "" &&
            formData.itemName?.trim() !== "" &&
            formData.itemGroup !== "" &&
            formData.itemType !== "" &&
            formData.section !== "" &&
            formData.itemClass !== "" &&
            formData.itemCategory !== "" &&
            formData.unitAU !== "";
        
        setIsFormValid(isValid);
    };

    const fetchNonDrugMasterData = async () => {
        setLoading(true);
        try {
            const mockData = [
                {
                    id: 1,
                    itemCode: "ND001",
                    itemName: "Surgical Gloves",
                    itemGroup: "Medical Supplies",
                    unitAU: "Pair",
                    section: "Surgical",
                    itemClass: "Consumables",
                    status: "y"
                },
                {
                    id: 2,
                    itemCode: "ND002",
                    itemName: "Syringe 5ml",
                    itemGroup: "Medical Supplies",
                    unitAU: "Piece",
                    section: "Pharmacy",
                    itemClass: "Disposables",
                    status: "y"
                },
                {
                    id: 3,
                    itemCode: "ND003",
                    itemName: "Bandage Roll",
                    itemGroup: "Medical Supplies",
                    unitAU: "Roll",
                    section: "Emergency",
                    itemClass: "Wound Care",
                    status: "y"
                }
            ];
            setNonDrugs(mockData);
        } catch (error) {
            console.error("Error fetching non-drug data:", error);
            showPopup("Error fetching non-drug data", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const mockGroups = [
                { id: 1, groupName: "Medical Supplies" },
                { id: 2, groupName: "Surgical Instruments" },
                { id: 3, groupName: "Lab Equipment" }
            ];
            setMasStoreGroup(mockGroups);

            const mockUnits = [
                { unitId: 1, unitName: "Piece" },
                { unitId: 2, unitName: "Box" },
                { unitId: 3, unitName: "Pack" },
                { unitId: 4, unitName: "Pair" },
                { unitId: 5, unitName: "Roll" }
            ];
            setStoreUnitData(mockUnits);
        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    };

    const fetchItemTypesByGroup = async (groupId) => {
        try {
            const mockItemTypes = [
                { id: 1, name: "Disposable" },
                { id: 2, name: "Reusable" },
                { id: 3, name: "Equipment" }
            ];
            setMasItemTypeData(mockItemTypes);
        } catch (error) {
            console.error("Error fetching item types:", error);
        }
    };

    const fetchSectionsByItemType = async (itemTypeId) => {
        try {
            const mockSections = [
                { sectionId: 1, sectionName: "Surgical" },
                { sectionId: 2, sectionName: "Pharmacy" },
                { sectionId: 3, sectionName: "Emergency" },
                { sectionId: 4, sectionName: "Ward" }
            ];
            setItemSectionData(mockSections);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchCategoriesBySection = async (sectionId) => {
        try {
            const mockCategories = [
                { itemCategoryId: 1, itemCategoryName: "Consumables" },
                { itemCategoryId: 2, itemCategoryName: "Disposables" },
                { itemCategoryId: 3, itemCategoryName: "Wound Care" },
                { itemCategoryId: 4, itemCategoryName: "Diagnostic" }
            ];
            setServiceCategoryData(mockCategories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchClassesBySection = async (sectionId) => {
        try {
            const mockClasses = [
                { itemClassId: 1, itemClassName: "Consumables" },
                { itemClassId: 2, itemClassName: "Disposables" },
                { itemClassId: 3, itemClassName: "Wound Care" },
                { itemClassId: 4, itemClassName: "Diagnostic" }
            ];
            setItemClassData(mockClasses);
        } catch (error) {
            console.error("Error fetching item classes:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target
        const updatedFormData = {
            ...formData,
            [name]: value,
        }
        setFormData(updatedFormData)
    }

    const handleSwitchChange = (id, newStatus, name) => {
        setConfirmDialog({ isOpen: true, nonDrugId: id, newStatus, name })
    }

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.nonDrugId !== null) {
            try {
                showPopup("Status updated successfully!", "success");
                await fetchNonDrugMasterData();
            } catch (error) {
                console.error("Error updating status:", error);
                showPopup("Error updating status.", "error");
            }
        }
        setConfirmDialog({ isOpen: false, nonDrugId: null, newStatus: null });
    }

    const handleEdit = async (nonDrug) => {
        try {
            setEditingNonDrug(nonDrug);
            setEditEnabled(true);
            setShowForm(true);

            setFormData({
                itemCode: nonDrug.itemCode || "",
                itemName: nonDrug.itemName || "",
                itemGroup: nonDrug.itemGroup || "",
                itemType: "",
                section: nonDrug.section || "",
                itemClass: nonDrug.itemClass || "",
                itemCategory: "",
                unitAU: nonDrug.unitAU || ""
            });

            if (nonDrug.itemGroup) {
                await fetchItemTypesByGroup(nonDrug.itemGroup);
            }
            
            if (nonDrug.section) {
                await Promise.all([
                    fetchCategoriesBySection(nonDrug.section),
                    fetchClassesBySection(nonDrug.section)
                ]);
            }
        } catch (error) {
            console.error("Error in handleEdit:", error);
            showPopup("Error loading non-drug data for editing", "error");
        }
    };

    const handleAdd = () => {
        setEditingNonDrug(null);
        setEditEnabled(false);
        setShowForm(true);
        setFormData({
            itemCode: "",
            itemName: "",
            itemGroup: "",
            itemType: "",
            section: "",
            itemClass: "",
            itemCategory: "",
            unitAU: ""
        });
    }

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!isFormValid) {
            showPopup("Please fill all required fields marked with *", "error");
            return;
        }

        setProcess(true);

        try {
            const payload = {
                itemCode: formData.itemCode.trim(),
                itemName: formData.itemName.trim(),
                itemGroup: formData.itemGroup,
                itemType: formData.itemType,
                section: formData.section,
                itemClass: formData.itemClass,
                itemCategory: formData.itemCategory,
                unitAU: formData.unitAU,
                status: "y"
            };

            console.log("Saving payload:", payload);

            if (editingNonDrug && editEnabled) {
                showPopup("Non-Drug updated successfully!", "success");
            } else {
                showPopup("Non-Drug added successfully!", "success");
            }

            resetForm();
            await fetchNonDrugMasterData();

        } catch (error) {
            console.error("Error saving non-drug:", error);
            showPopup("Failed to save non-drug. Please try again.", "error");
        } finally {
            setProcess(false);
        }
    };

    const resetForm = () => {
        setEditingNonDrug(null);
        setEditEnabled(false);
        setShowForm(false);
        setFormData({
            itemCode: "",
            itemName: "",
            itemGroup: "",
            itemType: "",
            section: "",
            itemClass: "",
            itemCategory: "",
            unitAU: ""
        });
    };

    const handleBack = () => {
        resetForm();
    }

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchNonDrugMasterData();
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
            },
        })
    }

    const filteredNonDrugs = nonDrugs.filter((item) => {
        const q = (searchQuery || "").toLowerCase();

        return (
            (item.itemCode || "").toLowerCase().includes(q) ||
            (item.itemName || "").toLowerCase().includes(q) ||
            (item.itemGroup || "").toLowerCase().includes(q) ||
            (item.itemClass || "").toLowerCase().includes(q) ||
            (item.section || "").toLowerCase().includes(q) ||
            (item.unitAU ? item.unitAU.toString().toLowerCase() : "").includes(q)
        );
    });

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredNonDrugs.slice(indexOfFirst, indexOfLast);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Non-Drug Master</h4>
                            {loading && <LoadingScreen />}

                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <>
                                        <form className="d-inline-block searchform me-4" role="search">
                                            <div className="input-group searchinput">
                                                <input
                                                    type="search"
                                                    className="form-control"
                                                    placeholder="Search"
                                                    aria-label="Search"
                                                    value={searchQuery}
                                                    onChange={handleSearchChange}
                                                />
                                                <span className="input-group-text" id="search-icon">
                                                    <i className="fa fa-search"></i>
                                                </span>
                                            </div>
                                        </form>
                                        <div className="d-flex align-items-center ms-auto">
                                            <button type="button" className="btn btn-success me-2" onClick={handleAdd}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn-success me-2 flex-shrink-0" 
                                                onClick={handleRefresh}
                                            >
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button type="button" className="btn btn-secondary" onClick={handleBack}>
                                        <i className="mdi mdi-arrow-left"></i> Back
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="card-body">
                            {!showForm ? (
                                <>
                                    <div className="table-responsive packagelist">
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Item Code</th>
                                                    <th>Item Name</th>
                                                    <th>Item Group</th>
                                                    <th>Unit</th>
                                                    <th>Section</th>
                                                    <th>Item Class</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.length > 0 ? (
                                                    currentItems.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.itemCode}</td>
                                                            <td>{item.itemName}</td>
                                                            <td>{item.itemGroup}</td>
                                                            <td>{item.unitAU}</td>
                                                            <td>{item.section}</td>
                                                            <td>{item.itemClass}</td>
                                                            <td>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={item.status === "y"}
                                                                        onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y", item.itemName)}
                                                                        id={`switch-${item.id}`}
                                                                    />
                                                                    <label
                                                                        className="form-check-label px-0"
                                                                        htmlFor={`switch-${item.id}`}
                                                                    >
                                                                        {item.status === "y" ? "Active" : "Deactivated"}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-success me-2"
                                                                    onClick={() => handleEdit(item)}
                                                                    disabled={item.status !== "y"}
                                                                >
                                                                    <i className="fa fa-pencil"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" className="text-center">
                                                            No non-drug items found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {filteredNonDrugs.length > 0 && (
                                        <Pagination
                                            totalItems={filteredNonDrugs.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Code <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="itemCode"
                                                placeholder="Item Code"
                                                onChange={handleInputChange}
                                                value={formData.itemCode}
                                                required
                                                disabled={editEnabled}
                                            />
                                        </div>
                                        <div className="form-group col-md-8 mt-3">
                                            <label>
                                                Item Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="itemName"
                                                placeholder="Item Name"
                                                onChange={handleInputChange}
                                                value={formData.itemName}
                                                required
                                            />
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Group <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="itemGroup"
                                                value={formData.itemGroup}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Item Group</option>
                                                {masStoreGroup.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.groupName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Type <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="itemType"
                                                value={formData.itemType}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.itemGroup}
                                            >
                                                <option value="">Select Item Type</option>
                                                {masItemTypeData.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Section <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="section"
                                                value={formData.section}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.itemType}
                                            >
                                                <option value="">Select Item Section</option>
                                                {itemSectionData.map((section) => (
                                                    <option key={section.sectionId} value={section.sectionId}>
                                                        {section.sectionName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Class <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="itemClass"
                                                value={formData.itemClass}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.section}
                                            >
                                                <option value="">Select Item Class</option>
                                                {itemClassData.map((cls) => (
                                                    <option key={cls.itemClassId} value={cls.itemClassId}>
                                                        {cls.itemClassName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Category <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="itemCategory"
                                                value={formData.itemCategory}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.section}
                                            >
                                                <option value="">Select Category</option>
                                                {serviceCategoryData.map((cat) => (
                                                    <option key={cat.itemCategoryId} value={cat.itemCategoryId}>
                                                        {cat.itemCategoryName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Unit A/U <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="unitAU"
                                                value={formData.unitAU}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Unit A/U</option>
                                                {storeUnitData.map(unit => (
                                                    <option key={unit.unitId} value={unit.unitId}>{unit.unitName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary me-2"
                                            disabled={!isFormValid || process}
                                        >
                                            {process ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    {editEnabled ? "Updating..." : "Saving..."}
                                                </>
                                            ) : (
                                                editEnabled ? "Update" : "Save"
                                            )}
                                        </button>

                                        <button 
                                            type="button" 
                                            className="btn btn-danger" 
                                            onClick={handleBack}
                                            disabled={process}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Confirmation Modal */}
                            {confirmDialog.isOpen && (
                                <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                    <div className="modal-dialog modal-dialog-centered" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Confirm Status Change</h5>
                                                <button type="button" className="btn-close" onClick={() => handleConfirm(false)}></button>
                                            </div>
                                            <div className="modal-body">
                                                <p>
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                    <strong>{confirmDialog.name}</strong>?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                                                    No
                                                </button>
                                                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                                                    Yes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {popupMessage && (
                                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NonDrugMaster
import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_DRUG_MAS, MAS_STORE_GROUP, MAS_ITEM_TYPE, MAS_ITEM_SECTION, MAS_ITEM_CLASS, MAS_ITEM_CATEGORY, MAS_STORE_UNIT, MAS_HSN } from "../../../config/apiConfig";

const DrugMaster = () => {
    const [formData, setFormData] = useState({
        drugCode: "",
        drugName: "",
        itemGroup: "",
        section: "",
        itemType: "",
        unitAU: "",
        itemClass: "",
        dispensingUnit: "",
        itemCategory: "",
        dispensingQty: "",
        reorderLevel: "",
        reorderLevelStore: "",
        hsnCode: "",
        noOfDays: "",
        frequency: "",
        dosage: "",
        facilityCode: "",
        dangerousDrug: false,
        inactiveForEntry: false,
    })
    const [popupMessage, setPopupMessage] = useState(null)
    const [drugs, setDrugs] = useState([])
    const [masStoreGroup, setMasStoreGroup] = useState([])
    const [masItemTypeData, setMasItemTypeData] = useState([]);
    const [itemSectionData, setItemSectionData] = useState([]);
    const [itemClassData, setItemClassData] = useState([]);
    const [serviceCategoryData, setServiceCategoryData] = useState([]);
    const [storeUnitData, setStoreUnitData] = useState([]);
    const [hsnList, setHsnList] = useState([]);
    const [process, setProcess] = useState(false)
    const [editEnabled, setEditEnabled] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageInput, setPageInput] = useState("")
    const [loading, setLoading] = useState(false);
    const departmentId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
    const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");

    const itemsPerPage = 5
    const [editingDrug, setEditingDrug] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, drugId: null, newStatus: null, name: "" })

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    useEffect(() => {
        fetchDrugMasterData();
        fetchMasStoreGroup();
        fetchStoreUnit();
        fetchHsnData();
    }, []);

    useEffect(() => {
        if (formData.itemGroup) {
            fetchMasItemType(formData.itemGroup);
        } else {
            setMasItemTypeData([]);
            setFormData(prev => ({ ...prev, itemType: "", section: "", itemClass: "", itemCategory: "" }));
        }
    }, [formData.itemGroup]);

    useEffect(() => {
        if (formData.itemType) {
            fetchItemSectionData(formData.itemType);
        } else {
            setItemSectionData([]);
            setFormData(prev => ({ ...prev, section: "", itemClass: "", itemCategory: "" }));
        }
    }, [formData.itemType]);

    useEffect(() => {
        if (formData.section) {
            fetchServiceCategoryData(formData.section);
            fetchItemClassData(formData.section);
        } else {
            setServiceCategoryData([]);
            setItemClassData([]);
            setFormData(prev => ({ ...prev, itemClass: "", itemCategory: "" }));
        }
    }, [formData.section]);

    // Validate form whenever formData changes
    useEffect(() => {
        validateForm();
    }, [formData]);

    const validateForm = () => {
        const isValid = 
            formData.drugCode?.trim() !== "" &&
            formData.drugName?.trim() !== "" &&
            formData.itemGroup !== "" &&
            formData.section !== "" &&
            formData.itemType !== "" &&
            formData.itemClass !== "" &&
            formData.dispensingUnit !== "" &&
            formData.unitAU !== "" &&
            formData.itemCategory !== "" &&
            formData.reorderLevel !== "" &&
            formData.facilityCode !== "";
        
        setIsFormValid(isValid);
    };

    const fetchDrugMasterData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`/master/masStoreItemWithotStock/getAll/0`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setDrugs(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setDrugs([]);
            }
        } catch (error) {
            console.error("Error fetching Service Category data:", error);
            showPopup("Error fetching drug data", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchMasStoreGroup = async () => {
        try {
            const data = await getRequest(`${MAS_STORE_GROUP}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setMasStoreGroup(data.response);
            } else {
                setMasStoreGroup([]);
            }
        } catch (error) {
            console.error("Error fetching Store Item data:", error);
        }
    };

    const fetchMasItemType = async (groupId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_TYPE}/findByGroupId/${groupId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setMasItemTypeData(data.response);
            } else {
                setMasItemTypeData([]);
            }
        } catch (error) {
            console.error("Error fetching Item Types:", error);
        }
    };

    const fetchItemSectionData = async (itemTypeId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_SECTION}/findByItemType/${itemTypeId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemSectionData(data.response);
            } else {
                setItemSectionData([]);
            }
        } catch (error) {
            console.error("Error fetching Sections:", error);
        }
    };

    const fetchServiceCategoryData = async (sectionId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_CATEGORY}/findBySectionId/${sectionId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setServiceCategoryData(data.response);
            } else {
                setServiceCategoryData([]);
            }
        } catch (error) {
            console.error("Error fetching Categories:", error);
        }
    };

    const fetchItemClassData = async (sectionId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_CLASS}/getAllBySectionId/${sectionId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemClassData(data.response);
            } else {
                setItemClassData([]);
            }
        } catch (error) {
            console.error("Error fetching Item Classes:", error);
        }
    };

    const fetchStoreUnit = async () => {
        try {
            const data = await getRequest(`${MAS_STORE_UNIT}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setStoreUnitData(data.response);
            } else {
                setStoreUnitData([]);
                console.error("Unexpected API response format for store units:", data);
            }
        } catch (error) {
            console.error("Error fetching store unit data:", error);
            setStoreUnitData([]);
        }
    };

    const fetchHsnData = async () => {
        try {
            const data = await getRequest(`${MAS_HSN}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setHsnList(data.response);
            } else {
                setHsnList([]);
                console.error("Unexpected API response format for HSN codes:", data);
            }
        } catch (error) {
            console.error("Error fetching HSN code data:", error);
            setHsnList([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        const updatedFormData = {
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        }
        setFormData(updatedFormData)
    }

    const handleSwitchChange = (id, newStatus, name) => {
        setConfirmDialog({ isOpen: true, drugId: id, newStatus, name })
    }

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.drugId !== null) {
            try {
                const response = await putRequest(
                    `${MAS_DRUG_MAS}/status/${confirmDialog.drugId}?status=${confirmDialog.newStatus}`,
                );
                if (response.status === 200) {
                    showPopup("Status updated successfully!", "success");
                    await fetchDrugMasterData();
                } else {
                    showPopup(response.message || "Failed to update status.", "error");
                }
            } catch (error) {
                console.error("Error updating status:", error);
                showPopup("Error updating status.", "error");
            }
        }
        setConfirmDialog({ isOpen: false, drugId: null, newStatus: null });
    }

    const handleEdit = async (drug) => {
        try {
            setEditingDrug(drug);
            setEditEnabled(true);
            setShowForm(true);

            // First set the form data with the drug's values
            setFormData({
                drugCode: drug.pvmsNo || "",
                drugName: drug.nomenclature || "",
                itemGroup: drug.groupId?.toString() || "",
                section: drug.sectionId?.toString() || "",
                itemType: drug.itemTypeId?.toString() || "",
                unitAU: drug.unitAU?.toString() || "",
                itemClass: drug.itemClassId?.toString() || "",
                dispensingUnit: drug.dispUnit?.toString() || "",
                itemCategory: drug.masItemCategoryid?.toString() || "",
                dispensingQty: drug.adispQty?.toString() || "",
                reorderLevel: drug.reOrderLevelDispensary?.toString() || "",
                reorderLevelStore: drug.reOrderLevelStore?.toString() || "",
                hsnCode: drug.hsnCode || "",
                noOfDays: drug.noOfDays?.toString() || "",
                frequency: drug.frequency || "",
                dosage: drug.dosage || "",
                facilityCode: drug.facilityCode || "",
                dangerousDrug: drug.dangerousDrug || false,
                inactiveForEntry: drug.inactiveForEntry || false,
            });

            // Then fetch dependent data
            if (drug.groupId) {
                await fetchMasItemType(drug.groupId);
            }
            
            if (drug.itemTypeId) {
                await fetchItemSectionData(drug.itemTypeId);
            }
            
            if (drug.sectionId) {
                await Promise.all([
                    fetchServiceCategoryData(drug.sectionId),
                    fetchItemClassData(drug.sectionId)
                ]);
            }
        } catch (error) {
            console.error("Error in handleEdit:", error);
            showPopup("Error loading drug data for editing", "error");
        }
    };

    const handleAdd = () => {
        setEditingDrug(null);
        setEditEnabled(false);
        setShowForm(true);
        setFormData({
            drugCode: "",
            drugName: "",
            itemGroup: "",
            section: "",
            itemType: "",
            unitAU: "",
            itemClass: "",
            dispensingUnit: "",
            itemCategory: "",
            dispensingQty: "",
            reorderLevel: "",
            reorderLevelStore: "",
            hsnCode: "",
            noOfDays: "",
            frequency: "",
            dosage: "",
            facilityCode: "",
            dangerousDrug: false,
            inactiveForEntry: false,
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
                pvmsNo: formData.drugCode.trim(),
                nomenclature: formData.drugName.trim(),
                groupId: Number(formData.itemGroup),
                itemTypeId: Number(formData.itemType),
                dispUnit: formData.dispensingUnit,
                unitAU: Number(formData.unitAU) || 0,
                sectionId: Number(formData.section),
                itemClassId: Number(formData.itemClass),
                masItemCategoryId: Number(formData.itemCategory),
                adispQty: Number(formData.dispensingQty) || 0,
                reOrderLevelDispensary: Number(formData.reorderLevel) || 0,
                reOrderLevelStore: Number(formData.reorderLevelStore) || 0,
                hsnCode: formData.hsnCode || "",
                noOfDays: Number(formData.noOfDays) || 0,
                frequency: formData.frequency || "",
                dosage: formData.dosage || "",
                facilityCode: formData.facilityCode,
                dangerousDrug: formData.dangerousDrug,
                inactiveForEntry: formData.inactiveForEntry,
                status: "y"
            };

            console.log("Saving payload:", payload);
            console.log("Is edit mode:", editEnabled);
            console.log("Editing drug ID:", editingDrug?.itemId);

            let response;
            let url;

            if (editingDrug && editEnabled) {
                // UPDATE operation
                url = `${MAS_DRUG_MAS}/update/${editingDrug.itemId}`;
                console.log("Update URL:", url);
                response = await putRequest(url, payload);
            } else {
                // CREATE operation
                url = `${MAS_DRUG_MAS}/create`;
                console.log("Create URL:", url);
                response = await postRequest(url, payload);
            }

            console.log("API Response:", response);

            if (response.status === 200 || response.status === 201) {
                showPopup(editEnabled ? "Drug updated successfully!" : "Drug added successfully!", "success");
                resetForm();
                await fetchDrugMasterData();
            } else {
                throw new Error(response.message || response.response?.message || "Failed to save drug");
            }

        } catch (error) {
            console.error("Error saving drug:", error);
            showPopup(error.message || "Failed to save drug. Please try again.", "error");
        } finally {
            setProcess(false);
        }
    };

    const resetForm = () => {
        setEditingDrug(null);
        setEditEnabled(false);
        setShowForm(false);
        setFormData({
            drugCode: "",
            drugName: "",
            itemGroup: "",
            section: "",
            itemType: "",
            unitAU: "",
            itemClass: "",
            dispensingUnit: "",
            itemCategory: "",
            dispensingQty: "",
            reorderLevel: "",
            reorderLevelStore: "",
            hsnCode: "",
            noOfDays: "",
            frequency: "",
            dosage: "",
            facilityCode: "",
            dangerousDrug: false,
            inactiveForEntry: false,
        });
    };

    const handleBack = () => {
        resetForm();
    }

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
            },
        })
    }

    const filteredDrugs = drugs.filter((item) => {
        const q = (searchQuery || "").toLowerCase();

        return (
            (item.pvmsNo || "").toLowerCase().includes(q) ||
            (item.nomenclature || "").toLowerCase().includes(q) ||
            (item.groupName || "").toLowerCase().includes(q) ||
            (item.itemClassName || "").toLowerCase().includes(q) ||
            (item.sectionName || "").toLowerCase().includes(q) ||
            (item.unitAU ? item.unitAU.toString().toLowerCase() : "").includes(q)
        );
    });

    const filteredTotalPages = Math.ceil(filteredDrugs.length / itemsPerPage)
    const currentItems = filteredDrugs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handlePageNavigation = () => {
        const pageNumber = Number.parseInt(pageInput, 10)
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber)
        } else {
            alert("Please enter a valid page number.")
        }
    }

    const renderPagination = () => {
        const pageNumbers = []
        const maxVisiblePages = 5
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1)

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        if (startPage > 1) {
            pageNumbers.push(1)
            if (startPage > 2) pageNumbers.push("...")
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i)
        }

        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("...")
            pageNumbers.push(filteredTotalPages)
        }

        return pageNumbers.map((number, index) => (
            <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
                {typeof number === "number" ? (
                    <button className="page-link" onClick={() => setCurrentPage(number)}>
                        {number}
                    </button>
                ) : (
                    <span className="page-link disabled">{number}</span>
                )}
            </li>
        ))
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Item Drug Master</h4>
                            {loading && <LoadingScreen />}

                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm && (
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
                                        <button type="button" className="btn btn-success me-2" onClick={handleAdd}>
                                            <i className="mdi mdi-plus"></i> Add
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Drug Code</th>
                                                <th>Drug Name</th>
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
                                                    <tr key={item.itemId}>
                                                        <td>{item.pvmsNo}</td>
                                                        <td>{item.nomenclature}</td>
                                                        <td>{item.groupName}</td>
                                                        <td>{item.unitAU}</td>
                                                        <td>{item.sectionName}</td>
                                                        <td>{item.itemClassName}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={item.status === "y"}
                                                                    onChange={() => handleSwitchChange(item.itemId, item.status === "y" ? "n" : "y", item.nomenclature)}
                                                                    id={`switch-${item.itemId}`}
                                                                />
                                                                <label
                                                                    className="form-check-label px-0"
                                                                    htmlFor={`switch-${item.itemId}`}
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
                                                        No drugs found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="d-flex justify-content-end mb-3">
                                        <button type="button" className="btn btn-secondary" onClick={handleBack}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    </div>

                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Drug Code <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="drugCode"
                                                placeholder="Drug Code"
                                                onChange={handleInputChange}
                                                value={formData.drugCode}
                                                required
                                                disabled={editEnabled}
                                            />
                                        </div>
                                        <div className="form-group col-md-8 mt-3">
                                            <label>
                                                Drug Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="drugName"
                                                placeholder="Drug Name"
                                                onChange={handleInputChange}
                                                value={formData.drugName}
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
                                                <option value="">Select Store Item</option>
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
                                                <option value=""> Select Item Class </option>
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
                                                <option value=""> Select Category </option>
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
                                                <option value="">Select Store Unit</option>
                                                {storeUnitData.map(unit => (
                                                    <option key={unit.unitId} value={unit.unitId}>{unit.unitName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Dispensing Unit <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="dispensingUnit"
                                                value={formData.dispensingUnit}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Dispensing Unit</option>
                                                {storeUnitData.map(unit => (
                                                    <option key={unit.unitId} value={unit.unitId}>{unit.unitName}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>Dispensing Qty</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Dispensing Qty"
                                                name="dispensingQty"
                                                value={formData.dispensingQty}
                                                onChange={handleInputChange}
                                                min="0"
                                            />
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Re-order Level-Dispensary <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="reorderLevel"
                                                value={formData.reorderLevel}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                            />
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>Re-order Level-Store</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="reorderLevelStore"
                                                placeholder="Re-order Level-Store"
                                                value={formData.reorderLevelStore}
                                                onChange={handleInputChange}
                                                min="0"
                                            />
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>HSN Code</label>
                                            <select
                                                className="form-select"
                                                name="hsnCode"
                                                value={formData.hsnCode}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select HSN Code</option>
                                                {hsnList.map((hsn) => (
                                                    <option key={hsn.hsnCode} value={hsn.hsnCode}>
                                                        {hsn.hsnCode}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>Dosage</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Dosage"
                                                name="dosage"
                                                value={formData.dosage}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>No of Days</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="No of Days"
                                                name="noOfDays"
                                                value={formData.noOfDays}
                                                onChange={handleInputChange}
                                                min="0"
                                            />
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>Frequency</label>
                                            <select
                                                className="form-select"
                                                name="frequency"
                                                value={formData.frequency}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select</option>
                                                <option value="Once Daily">Once Daily</option>
                                                <option value="Twice Daily">Twice Daily</option>
                                                <option value="Thrice Daily">Thrice Daily</option>
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Facility Code <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                name="facilityCode"
                                                value={formData.facilityCode}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="Primary">Primary</option>
                                                <option value="Secondary">Secondary</option>
                                                <option value="Tertiary">Tertiary</option>
                                            </select>
                                        </div>

                                        <div className="form-group col-md-6 mt-3">
                                            <label>Options</label>
                                            <div className="form-control d-flex align-items-center">
                                                <div className="form-check me-4">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="dangerousDrug"
                                                        name="dangerousDrug"
                                                        checked={formData.dangerousDrug}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="dangerousDrug">
                                                        Dangerous Drug
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="inactiveForEntry"
                                                        name="inactiveForEntry"
                                                        checked={formData.inactiveForEntry}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="inactiveForEntry">
                                                        Inactive for entry
                                                    </label>
                                                </div>
                                            </div>
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

                            {/* Pagination - only show when not in form mode */}
                            {!showForm && filteredDrugs.length > 0 && (
                                <nav className="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        <span>
                                            Page {currentPage} of {filteredTotalPages} | Total Records: {filteredDrugs.length}
                                        </span>
                                    </div>
                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                &laquo; Previous
                                            </button>
                                        </li>
                                        {renderPagination()}
                                        <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === filteredTotalPages}
                                            >
                                                Next &raquo;
                                            </button>
                                        </li>
                                    </ul>
                                    <div className="d-flex align-items-center">
                                        <input
                                            type="number"
                                            min="1"
                                            max={filteredTotalPages}
                                            value={pageInput}
                                            onChange={(e) => setPageInput(e.target.value)}
                                            placeholder="Go to page"
                                            className="form-control me-2"
                                            style={{ width: '100px' }}
                                        />
                                        <button className="btn btn-primary" onClick={handlePageNavigation}>
                                            Go
                                        </button>
                                    </div>
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DrugMaster
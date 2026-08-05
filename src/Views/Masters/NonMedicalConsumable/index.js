import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_NON_DRUG_ITEM, GET_NON_MEDICAL_CONSUMABLE_ITEMS, MAS_NON_DRUG_ITEM_GET_BY_ID, MAS_NON_DRUG_ITEM_UPDATE, MAS_DRUG_MAS, MAS_STORE_GROUP, MAS_ITEM_TYPE, MAS_ITEM_SECTION, MAS_ITEM_CLASS, MAS_ITEM_CATEGORY, MAS_STORE_UNIT, MAS_ITEM_SECTION_BY_TYPE, MAS_HSN } from "../../../config/apiConfig";
import Pagination from "../../../Components/Pagination";
import { ITEM_TYPE_CODE_NONMED_CON, SECTION_CODE_DRUG } from "../../../config/constants";

const NonConsumableMaster = () => {
    const [formData, setFormData] = useState({
        itemCode: "",
        itemName: "",
        itemGroup: "",
        itemType: "",
        section: "",
        itemClass: "",
        itemCategory: "",
        unitAU: "",
        hsnCode: ""
    })
    const [popupMessage, setPopupMessage] = useState(null)
    const [nonDrugs, setNonDrugs] = useState([])
    const [masStoreGroup, setMasStoreGroup] = useState([])
    const [hsnList, setHsnList] = useState([])
    const [masItemTypeData, setMasItemTypeData] = useState([]);
    const [itemSectionData, setItemSectionData] = useState([]);
    const [itemClassData, setItemClassData] = useState([]);
    const [serviceCategoryData, setServiceCategoryData] = useState([]);
    const [storeUnitData, setStoreUnitData] = useState([]);
    const [process, setProcess] = useState(false)
    const [editEnabled, setEditEnabled] = useState(false)

    const [searchParams, setSearchParams] = useState({
        itemName: "",
        section: "",
        itemClass: ""
    })
    const [appliedSearchParams, setAppliedSearchParams] = useState({
        itemName: "",
        section: "",
        itemClass: ""
    })
    const [searchSections, setSearchSections] = useState([])
    const [searchItemClasses, setSearchItemClasses] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const [editingNonDrug, setEditingNonDrug] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, nonDrugId: null, newStatus: null, name: "" })

    const handleSearchChange = (e) => {
        const { name, value } = e.target
        setSearchParams(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setAppliedSearchParams(searchParams)
        setCurrentPage(1)
        fetchNonDrugMasterData(1, searchParams)
    }

    const handleResetSearch = () => {
        const resetParams = {
            itemName: "",
            section: "",
            itemClass: ""
        };
        setSearchParams(resetParams)
        setAppliedSearchParams(resetParams)
        setCurrentPage(1)
        fetchNonDrugMasterData(1, resetParams)
    }

    const fetchSearchSections = async () => {
        try {
            const data = await getRequest(`${MAS_ITEM_SECTION_BY_TYPE}/${ITEM_TYPE_CODE_NONMED_CON}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                // Filter out DRUGS section
                const filteredSections = data.response.filter(
                    sec => sec.sectionCode !== SECTION_CODE_DRUG && sec.sectionName?.toUpperCase() !== "DRUGS"
                );
                setSearchSections(filteredSections);
            } else {
                setSearchSections([]);
            }
        } catch (error) {
            console.error("Error fetching search sections:", error);
            setSearchSections([]);
        }
    };

    const fetchSearchItemClasses = async (sectionId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_CLASS}/getAllBySectionId/${sectionId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setSearchItemClasses(data.response);
            } else {
                setSearchItemClasses([]);
            }
        } catch (error) {
            console.error("Error fetching search item classes:", error);
            setSearchItemClasses([]);
        }
    };

    useEffect(() => {
        fetchMasterData();
        fetchSearchSections();
    }, []);

    useEffect(() => {
        fetchNonDrugMasterData(currentPage, appliedSearchParams);
    }, [currentPage, appliedSearchParams]);

    useEffect(() => {
        if (searchParams.section) {
            fetchSearchItemClasses(searchParams.section);
        } else {
            setSearchItemClasses([]);
            setSearchParams(prev => ({ ...prev, itemClass: "" }));
        }
    }, [searchParams.section]);

    useEffect(() => {
        if (formData.itemGroup) {
            fetchItemTypesByGroup(formData.itemGroup);
        } else {
            setMasItemTypeData([]);
            setFormData(prev => ({ ...prev, itemType: "", section: "", itemClass: "", itemCategory: "" }));
        }
    }, [formData.itemGroup]);

    useEffect(() => {
        if (masItemTypeData.length > 0 && formData.itemGroup) {
            const targetType = masItemTypeData.find(t => t.name?.toUpperCase() === "NON-MEDICAL CONSUMABLE");
            if (targetType) {
                const targetTypeIdStr = targetType.id.toString();
                if (formData.itemType !== targetTypeIdStr) {
                    setFormData(prev => ({ ...prev, itemType: targetTypeIdStr }));
                }
            }
        }
    }, [masItemTypeData, formData.itemGroup]);

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

    const normalizeItem = (item) => ({
        id: item.itemId || item.id || null,
        itemCode: item.itemCode || item.pvmsNo || "",
        itemName: item.itemName || item.nomenclature || "",
        itemGroup: item.groupName || item.itemGroup || item.groupId || "",
        itemType: item.itemTypeName || item.itemType || item.itemTypeId || "",
        section: item.sectionName || item.section || item.sectionId || "",
        itemClass: item.itemClassName || item.itemClass || item.itemClassId || "",
        itemCategory: item.itemCategoryName || item.itemCategory || item.masItemCategoryId || "",
        unitAU: item.unitAuName || item.unitAU || "",
        status: item.status || "",
        raw: item,
    });

    const fetchNonDrugMasterData = async (page = 1, search = searchParams) => {
        if (isInitialLoad) {
            setLoading(true);
        } else {
            setTableLoading(true);
        }
        try {
            const queryParams = new URLSearchParams({
                page: (page - 1).toString(),
                size: "5"
            });
            if (search.itemName) queryParams.append("itemName", search.itemName);
            if (search.section) queryParams.append("sectionId", search.section);
            if (search.itemClass) queryParams.append("itemClassId", search.itemClass);

            const data = await getRequest(`${GET_NON_MEDICAL_CONSUMABLE_ITEMS}?${queryParams.toString()}`);
            if (data.status === 200 && data.response) {
                const itemsList = Array.isArray(data.response.content) ? data.response.content : [];
                setNonDrugs(itemsList.map(normalizeItem));
                setTotalItems(data.response.totalElements || 0);
            } else {
                setNonDrugs([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error("Error fetching non-drug data:", error);
            showPopup("Error fetching non-drug data", "error");
            setNonDrugs([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
            setTableLoading(false);
            setIsInitialLoad(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const groupData = await getRequest(`${MAS_STORE_GROUP}/getAll/1`);
            if (groupData.status === 200 && Array.isArray(groupData.response)) {
                setMasStoreGroup(groupData.response);
            } else {
                setMasStoreGroup([]);
            }

            const unitData = await getRequest(`${MAS_STORE_UNIT}/getAll/1`);
            if (unitData.status === 200 && Array.isArray(unitData.response)) {
                setStoreUnitData(unitData.response);
            } else {
                setStoreUnitData([]);
            }

            const hsnData = await getRequest(`${MAS_HSN}/getAll/1`);
            if (hsnData.status === 200 && Array.isArray(hsnData.response)) {
                setHsnList(hsnData.response);
            } else {
                setHsnList([]);
            }
        } catch (error) {
            console.error("Error fetching master data:", error);
            setMasStoreGroup([]);
            setStoreUnitData([]);
            setHsnList([]);
        }
    };

    const fetchItemTypesByGroup = async (groupId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_TYPE}/findByGroupId/${groupId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setMasItemTypeData(data.response);
            } else {
                setMasItemTypeData([]);
            }
        } catch (error) {
            console.error("Error fetching item types:", error);
            setMasItemTypeData([]);
        }
    };

    const fetchSectionsByItemType = async (itemTypeId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_SECTION}/findByItemType/${itemTypeId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemSectionData(data.response);
            } else {
                setItemSectionData([]);
            }
        } catch (error) {
            console.error("Error fetching sections:", error);
            setItemSectionData([]);
        }
    };

    const fetchCategoriesBySection = async (sectionId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_CATEGORY}/findBySectionId/${sectionId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setServiceCategoryData(data.response);
            } else {
                setServiceCategoryData([]);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setServiceCategoryData([]);
        }
    };

    const fetchClassesBySection = async (sectionId) => {
        try {
            const data = await getRequest(`${MAS_ITEM_CLASS}/getAllBySectionId/${sectionId}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemClassData(data.response);
            } else {
                setItemClassData([]);
            }
        } catch (error) {
            console.error("Error fetching item classes:", error);
            setItemClassData([]);
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
                const response = await putRequest(
                    `${MAS_DRUG_MAS}/status/${confirmDialog.nonDrugId}?status=${confirmDialog.newStatus}`,
                    {}
                );
                if (response.status === 200) {
                    setPopupMessage({
                        message: `Non-drug item "${confirmDialog.name}" ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        type: "success",
                        onClose: () => {
                            setPopupMessage(null);
                            fetchNonDrugMasterData(currentPage, appliedSearchParams);
                        }
                    });
                } else {
                    throw new Error(response.message || "Failed to update status.");
                }
            } catch (error) {
                console.error("Error updating status:", error);
                showPopup(error.message || "Error updating status.", "error");
            }
        }
        setConfirmDialog({ isOpen: false, nonDrugId: null, newStatus: null, name: "" });
    }

    const handleEdit = async (nonDrug) => {
        try {
            const itemId = nonDrug.itemId || nonDrug.id;
            let details = nonDrug;
            if (itemId) {
                const data = await getRequest(`${MAS_NON_DRUG_ITEM_GET_BY_ID}/${itemId}`);
                if (data.status === 200 && data.response) {
                    details = data.response;
                }
            }

            setEditingNonDrug(details);
            setEditEnabled(true);
            setShowForm(true);

            const consumableGroup = masStoreGroup.find(g => g.groupName?.toUpperCase() === "CONSUMABLE");
            const defaultGroupId = consumableGroup ? consumableGroup.id.toString() : (details.groupId || details.itemGroupId || details.itemGroup || "2");
            const itemTypeId = details.itemTypeId || details.itemType || "";
            const sectionId = details.sectionId || details.section || "";
            const itemClassId = details.itemClassId || details.itemClass || "";
            const categoryId = details.masItemCategoryId || details.itemCategoryId || details.itemCategory || "";
            const unitAUValue = details.unitAU || details.unitAu || "";
            const hsnCodeValue = details.hsn || details.hsnCode || "";

            setFormData({
                itemCode: details.itemCode || details.pvmsNo || "",
                itemName: details.itemName || details.nomenclature || "",
                itemGroup: defaultGroupId?.toString() || "",
                itemType: itemTypeId?.toString() || "",
                section: sectionId?.toString() || "",
                itemClass: itemClassId?.toString() || "",
                itemCategory: categoryId?.toString() || "",
                unitAU: unitAUValue?.toString() || "",
                hsnCode: hsnCodeValue?.toString() || ""
            });

            if (defaultGroupId) {
                await fetchItemTypesByGroup(defaultGroupId);
            }
            if (itemTypeId) {
                await fetchSectionsByItemType(itemTypeId);
            }
            if (sectionId) {
                await Promise.all([
                    fetchCategoriesBySection(sectionId),
                    fetchClassesBySection(sectionId),
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
        const consumableGroup = masStoreGroup.find(g => g.groupName?.toUpperCase() === "CONSUMABLE");
        const defaultGroupId = consumableGroup ? consumableGroup.id.toString() : "2"; // fallback to 2
        setFormData({
            itemCode: "",
            itemName: "",
            itemGroup: defaultGroupId,
            itemType: "",
            section: "",
            itemClass: "",
            itemCategory: "",
            unitAU: "",
            hsnCode: ""
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
                pvmsNo: formData.itemCode.trim(),
                nomenclature: formData.itemName.trim(),
                groupId: Number(formData.itemGroup),
                itemTypeId: Number(formData.itemType),
                sectionId: Number(formData.section),
                itemClassId: Number(formData.itemClass),
                masItemCategoryId: Number(formData.itemCategory),
                unitAU: Number(formData.unitAU),
                hsn: formData.hsnCode,
                status: "y"
            };

            let response;
            if (editingNonDrug && editEnabled) {
                const itemId = editingNonDrug.itemId || editingNonDrug.id;
                response = await putRequest(`${MAS_NON_DRUG_ITEM_UPDATE}/${itemId}`, payload);
            } else {
                response = await postRequest(`${MAS_NON_DRUG_ITEM}/create`, payload);
            }

            const actualStatus = response?.data?.status !== undefined ? response.data.status : response?.status;
            const actualMessage = response?.data?.message || response?.message || response?.response?.message || "Failed to save non-drug item";

            if (actualStatus === 200 || actualStatus === 201) {
                setPopupMessage({
                    message: editEnabled ? "Non-drug item updated successfully!" : "Non-drug item added successfully!",
                    type: "success",
                    onClose: () => {
                        setPopupMessage(null);
                        resetForm();
                        const resetParams = {
                            itemName: "",
                            section: "",
                            itemClass: ""
                        };
                        setSearchParams(resetParams);
                        setAppliedSearchParams(resetParams);
                        setCurrentPage(1);
                        fetchNonDrugMasterData(1, resetParams);
                    }
                });
            } else {
                throw new Error(actualMessage);
            }

        } catch (error) {
            console.error("Error saving non-drug:", error);
            showPopup(error.message || "Failed to save non-drug. Please try again.", "error");
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
            unitAU: "",
            hsnCode: ""
        });
    };

    const handleBack = () => {
        resetForm();
    }

    const handleRefresh = () => {
        const resetParams = {
            itemName: "",
            section: "",
            itemClass: ""
        };
        setSearchParams(resetParams);
        setAppliedSearchParams(resetParams);
        setCurrentPage(1);
        fetchNonDrugMasterData(1, resetParams);
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

    const currentItems = nonDrugs;

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Non Medical Consumbale</h4>
                            {loading && <LoadingScreen />}

                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
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
                                    <div className="mb-4">
                                        <form onSubmit={handleSearch}>
                                            <div className="row g-3 align-items-end">
                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold">Item Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="itemName"
                                                        placeholder="Enter Item Name"
                                                        value={searchParams.itemName}
                                                        onChange={handleSearchChange}
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold">Section</label>
                                                    <select
                                                        className="form-select"
                                                        name="section"
                                                        value={searchParams.section}
                                                        onChange={handleSearchChange}
                                                    >
                                                        <option value="">Select Section</option>
                                                        {searchSections.map(sec => (
                                                            <option key={sec.sectionId} value={sec.sectionId}>
                                                                {sec.sectionName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold">Item Class</label>
                                                    <select
                                                        className="form-select"
                                                        name="itemClass"
                                                        value={searchParams.itemClass}
                                                        onChange={handleSearchChange}
                                                        disabled={!searchParams.section}
                                                    >
                                                        <option value="">Select Item Class</option>
                                                        {searchItemClasses.map(cls => (
                                                            <option key={cls.itemClassId} value={cls.itemClassId}>
                                                                {cls.itemClassName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-3 d-flex align-items-end gap-2">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                    >
                                                        Search
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={handleResetSearch}
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    <div style={{ position: "relative", minHeight: "200px" }}>
                                        {tableLoading && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    zIndex: 5,
                                                }}
                                            >
                                                <div className="d-flex flex-column align-items-center">
                                                    <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <span className="mt-2 fw-bold text-primary">Loading Non-Drug Items...</span>
                                                </div>
                                            </div>
                                        )}
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
                                                                        checked={item.status?.toLowerCase() === "y"}
                                                                        onChange={() => handleSwitchChange(item.id, item.status?.toLowerCase() === "y" ? "n" : "y", item.itemName)}
                                                                        id={`switch-${item.id}`}
                                                                    />
                                                                    <label
                                                                        className="form-check-label px-0"
                                                                        htmlFor={`switch-${item.id}`}
                                                                    >
                                                                        {item.status?.toLowerCase() === "y" ? "Active" : "Deactivated"}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-success me-2"
                                                                    onClick={() => handleEdit(item)}
                                                                    disabled={item.status?.toLowerCase() !== "y"}
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
                                    </div>
                                    
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {totalItems > 0 && (
                                        <Pagination
                                            totalItems={totalItems}
                                            itemsPerPage={5}
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
                                                disabled={true}
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
                                                disabled={true}
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

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                HSN Code
                                            </label>
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

export default NonConsumableMaster;
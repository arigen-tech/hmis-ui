import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_DRUG_MAS, MAS_STORE_ITEM_WITHOUT_STOCK, MAS_STORE_GROUP, MAS_ITEM_TYPE, MAS_ITEM_SECTION, MAS_ITEM_CLASS, MAS_ITEM_CATEGORY, MAS_STORE_UNIT, MAS_HSN , MAS_DRUGSCHEDULE } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { SECTION_ID_DRUGS } from "../../../config/constants";

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
        dosageUnit: "",
        itemCategory: "",
        dispensingQty: "",
        reorderLevel: "",
        reorderLevelStore: "",
        hsnCode: "",
        drugSchedule: "",
        isGeneric: "",
        dangerousDrug: false,
        highValueDrug: false,
        availableInOpd: false,
        availableInIpd: false,
        availableInEmergency: false,
        availableInOt: false,
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
    const [drugScheduleData, setDrugScheduleData] = useState([]);
    const [process, setProcess] = useState(false)
    const [editEnabled, setEditEnabled] = useState(false)

    const [searchParams, setSearchParams] = useState({
        itemName: "",
        itemClass: "",
        itemCategory: ""
    })
    const [appliedSearchParams, setAppliedSearchParams] = useState({
        itemName: "",
        itemClass: "",
        itemCategory: ""
    })
    const [searchItemClasses, setSearchItemClasses] = useState([])
    const [searchItemCategories, setSearchItemCategories] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const departmentId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
    const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");

    const [editingDrug, setEditingDrug] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, drugId: null, newStatus: null, name: "" })

    // No facility dropdown states

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
        fetchDrugMasterData(0, searchParams)
    }

    const handleResetSearch = () => {
        const resetParams = {
            itemName: "",
            itemClass: "",
            itemCategory: ""
        };
        setSearchParams(resetParams)
        setAppliedSearchParams(resetParams)
        setCurrentPage(1)
        fetchDrugMasterData(0, resetParams)
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
        fetchDrugMasterData(page - 1)
    }

    // No click outside handler

    useEffect(() => {
        fetchDrugMasterData(0);
        fetchMasStoreGroup();
        fetchStoreUnit();
        fetchHsnData();
        fetchDrugScheduleData();
        fetchSearchItemClasses();
        fetchSearchItemCategories();
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

    // Auto-select Item Group = CONSUMABLE
    useEffect(() => {
        if (showForm && masStoreGroup.length > 0) {
            const consumableGroup = masStoreGroup.find(g => g.groupName?.toUpperCase() === "CONSUMABLE");
            if (consumableGroup && formData.itemGroup !== consumableGroup.id.toString()) {
                setFormData(prev => ({ ...prev, itemGroup: consumableGroup.id.toString() }));
            }
        }
    }, [masStoreGroup, showForm, formData.itemGroup]);

    // Auto-select Item Type = MEDICAL CONSUMABLE
    useEffect(() => {
        if (showForm && masItemTypeData.length > 0) {
            const medicalConsumableType = masItemTypeData.find(t => t.name?.toUpperCase() === "MEDICAL CONSUMABLE");
            if (medicalConsumableType && formData.itemType !== medicalConsumableType.id.toString()) {
                setFormData(prev => ({ ...prev, itemType: medicalConsumableType.id.toString() }));
            }
        }
    }, [masItemTypeData, showForm, formData.itemType]);

    // Auto-select Section = DRUGS
    useEffect(() => {
        if (showForm && itemSectionData.length > 0) {
            const drugsSection = itemSectionData.find(s => s.sectionName?.toUpperCase() === "DRUGS" || s.sectionId === SECTION_ID_DRUGS);
            if (drugsSection && formData.section !== drugsSection.sectionId.toString()) {
                setFormData(prev => ({ ...prev, section: drugsSection.sectionId.toString() }));
            }
        }
    }, [itemSectionData, showForm, formData.section]);

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
            formData.reorderLevel !== "";
        
        setIsFormValid(isValid);
    };

    const fetchDrugMasterData = async (page = 0, customParams = null) => {
        if (isInitialLoad) {
            setLoading(true);
        } else {
            setTableLoading(true);
        }
        try {
            const params = customParams || appliedSearchParams;
            const nomenclature = params.itemName || "";
            const itemClassId = params.itemClass || "";
            const masItemCategoryid = params.itemCategory || "";

            const url = `${MAS_STORE_ITEM_WITHOUT_STOCK}/getAllPaginated/0?page=${page}&size=${DEFAULT_ITEMS_PER_PAGE}&nomenclature=${encodeURIComponent(nomenclature)}&itemClassId=${itemClassId}&masItemCategoryid=${masItemCategoryid}`;
            const data = await getRequest(url);
            if (data.status === 200 && data.response) {
                setDrugs(data.response.content || []);
                setTotalPages(data.response.totalPages || 0);
                setTotalItems(data.response.totalElements || 0);
            } else {
                console.error("Unexpected API response format:", data);
                setDrugs([]);
                setTotalPages(0);
                setTotalItems(0);
            }
        } catch (error) {
            console.error("Error fetching drug data:", error);
            showPopup("Error fetching drug data", "error");
        } finally {
            setLoading(false);
            setTableLoading(false);
            setIsInitialLoad(false);
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

    const fetchDrugScheduleData = async () => {
        try {
            const data = await getRequest(`${MAS_DRUGSCHEDULE}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setDrugScheduleData(data.response);
            } else {
                setDrugScheduleData([]);
                console.error("Unexpected API response format for drug schedule:", data);
            }
        } catch (error) {
            console.error("Error fetching drug schedule data:", error);
            setDrugScheduleData([]);
        }
    };

    // No fetchFacilityData needed

    const fetchSearchItemClasses = async () => {
        try {
            const data = await getRequest(`${MAS_ITEM_CLASS}/getAllBySectionId/${SECTION_ID_DRUGS}`);
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

    const fetchSearchItemCategories = async () => {
        try {
            const data = await getRequest(`${MAS_ITEM_CATEGORY}/findBySectionId/${SECTION_ID_DRUGS}`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setSearchItemCategories(data.response);
            } else {
                setSearchItemCategories([]);
            }
        } catch (error) {
            console.error("Error fetching search item categories:", error);
            setSearchItemCategories([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        
        const updatedFormData = {
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        }
        setFormData(updatedFormData)
    };

    const handleSwitchChange = (id, currentStatus, name) => {
        const newStatus = currentStatus?.toLowerCase() === "y" ? "n" : "y";
        setConfirmDialog({ isOpen: true, drugId: id, newStatus, name });
    }

    // UPDATED: handleConfirm with proper popup pattern
    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.drugId !== null) {
            try {
                const response = await putRequest(
                    `${MAS_DRUG_MAS}/status/${confirmDialog.drugId}?status=${confirmDialog.newStatus}`,
                );
                if (response.status === 200) {
                    // Set popup with onClose callback to refresh data
                    setPopupMessage({
                        message: `Drug "${confirmDialog.name}" ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        type: "success",
                        onClose: () => {
                            setPopupMessage(null);
                            fetchDrugMasterData(currentPage - 1); // Refresh data on current page after status change
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
        setConfirmDialog({ isOpen: false, drugId: null, newStatus: null, name: "" });
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
                dosageUnit: drug.dosageUnit || "",
                itemCategory: drug.masItemCategoryid?.toString() || "",
                dispensingQty: drug.adispQty?.toString() || "",
                reorderLevel: drug.reOrderLevelDispensary?.toString() || "",
                reorderLevelStore: drug.reOrderLevelStore?.toString() || "",
                hsnCode: drug.hsnCode || "",
                drugSchedule: drug.masDrugScheduleRule || drug.drugSchedule || "",
                isGeneric: drug.isGeneric || "",
                dangerousDrug: drug.dangerousDrug?.toUpperCase() === "Y" || drug.dangerousDrug === true,
                highValueDrug: drug.highValueDrug?.toUpperCase() === "Y" || drug.highValueDrug === true,
                availableInOpd: drug.availableInOpd?.toUpperCase() === "Y" || drug.availableInOpd === true,
                availableInIpd: drug.availableInIpd?.toUpperCase() === "Y" || drug.availableInIpd === true,
                availableInEmergency: drug.availableInEmergency?.toUpperCase() === "Y" || drug.availableInEmergency === true,
                availableInOt: drug.availableInOt?.toUpperCase() === "Y" || drug.availableInOt === true,
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
        setShowForm(true);
        setEditEnabled(false);
        setFormData({
            drugCode: "",
            drugName: "",
            itemGroup: "",
            section: "",
            itemType: "",
            unitAU: "",
            itemClass: "",
            dispensingUnit: "",
            dosageUnit: "",
            itemCategory: "",
            dispensingQty: "",
            reorderLevel: "",
            reorderLevelStore: "",
            hsnCode: "",
            drugSchedule: "",
            isGeneric: "",
            dangerousDrug: false,
            highValueDrug: false,
            availableInOpd: false,
            availableInIpd: false,
            availableInEmergency: false,
            availableInOt: false,
        });
    };

    const handleBack = () => {
        resetForm();
    }

    // UPDATED: handleSave with proper popup pattern
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
                dispUnit: Number(formData.dispensingUnit),
                dosageUnit: formData.dosageUnit,
                unitAU: Number(formData.unitAU) || 0,
                sectionId: Number(formData.section),
                itemClassId: Number(formData.itemClass),
                masItemCategoryId: Number(formData.itemCategory),
                adispQty: Number(formData.dispensingQty) || 0,
                reOrderLevelDispensary: Number(formData.reorderLevel) || 0,
                reOrderLevelStore: Number(formData.reorderLevelStore) || 0,
                reOrderLevelWard: 0,
                hsnCode: formData.hsnCode || "",
                drugSchedule: formData.drugSchedule || null,
                isGeneric: formData.isGeneric || "n",
                dangerousDrug: formData.dangerousDrug ? "Y" : "N",
                highValueDrug: formData.highValueDrug ? "Y" : "N",
                availableInOpd: formData.availableInOpd ? "Y" : "N",
                availableInIpd: formData.availableInIpd ? "Y" : "N",
                availableInEmergency: formData.availableInEmergency ? "Y" : "N",
                availableInOt: formData.availableInOt ? "Y" : "N",
                status: "y"
            };

            console.log("Saving payload:", payload);

            let response;

            if (editingDrug && editEnabled) {
                response = await putRequest(`${MAS_DRUG_MAS}/update/${editingDrug.itemId}`, payload);
            } else {
                response = await postRequest(`${MAS_DRUG_MAS}/create`, payload);
            }

            console.log("API Response:", response);

            if (response.status === 200 || response.status === 201) {
                // KEY CHANGE: Set popup with onClose callback to handle everything after OK click
                setPopupMessage({
                    message: editEnabled ? "Drug updated successfully!" : "Drug added successfully!",
                    type: "success",
                    onClose: () => {
                        setPopupMessage(null);
                        resetForm();
                        const resetParams = {
                            itemName: "",
                            itemClass: "",
                            itemCategory: ""
                        };
                        setSearchParams(resetParams);
                        setAppliedSearchParams(resetParams);
                        fetchDrugMasterData(0, resetParams); // Data refresh happens here on first page
                        setCurrentPage(1);
                    }
                });
            } else {
                throw new Error(response.message || response.response?.message || "Failed to save drug");
            }

        } catch (error) {
            console.error("Error saving drug:", error);
            showPopup(error.message || "Error saving drug.", "error");
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
            drugSchedule: "",
            isGeneric: "",
            dangerousDrug: false,
            highValueDrug: false,
            availableInOpd: false,
            availableInIpd: false,
            availableInEmergency: false,
            availableInOt: false,
        });
    };

    const handleRefresh = () => {
        const resetParams = {
            itemName: "",
            itemClass: "",
            itemCategory: ""
        };
        setSearchParams(resetParams);
        setAppliedSearchParams(resetParams);
        setCurrentPage(1);
        fetchDrugMasterData(0, resetParams);
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    }

    const currentItems = drugs;

    // No getSelectedFacilityText helper

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Drug Master</h4>
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
                                                    <label className="form-label fw-bold">Item Class</label>
                                                    <select
                                                        className="form-select"
                                                        name="itemClass"
                                                        value={searchParams.itemClass}
                                                        onChange={handleSearchChange}
                                                    >
                                                        <option value="">Select Item Class</option>
                                                        {searchItemClasses.map(cls => (
                                                            <option key={cls.itemClassId} value={cls.itemClassId}>
                                                                {cls.itemClassName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold">Item Category</label>
                                                    <select
                                                        className="form-select"
                                                        name="itemCategory"
                                                        value={searchParams.itemCategory}
                                                        onChange={handleSearchChange}
                                                    >
                                                        <option value="">Select Category</option>
                                                        {searchItemCategories.map(cat => (
                                                            <option key={cat.itemCategoryId} value={cat.itemCategoryId}>
                                                                {cat.itemCategoryName}
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
                                                    <span className="mt-2 fw-bold text-primary">Loading Drugs...</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="table-responsive packagelist">
                                            <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Drug Code</th>
                                                    <th>Drug Name</th>
                                                    <th>Item Category</th>
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
                                                            <td>{item.masItemCategoryName || "-"}</td>
                                                            <td>{item.dispUnitName || item.unitAuName || item.unitAU}</td>
                                                            <td>{item.sectionName}</td>
                                                            <td>{item.itemClassName}</td>
                                                            <td>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={item.status?.toLowerCase() === "y"}
                                                                        onChange={() => handleSwitchChange(item.itemId, item.status, item.nomenclature)}
                                                                        id={`switch-${item.itemId}`}
                                                                    />
                                                                    <label
                                                                        className="form-check-label px-0"
                                                                        htmlFor={`switch-${item.itemId}`}
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
                                                            No drugs found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    </div>
                                    
                                    {totalItems > 0 && (
                                        <Pagination
                                            totalItems={totalItems}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={handlePageChange}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
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
                                                disabled={true}
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
                                                disabled={true}
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
                                            <label>
                                                Dosage Unit
                                            </label>
                                            <select
                                                className="form-select"
                                                name="dosageUnit"
                                                value={formData.dosageUnit}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Dosage Unit</option>
                                                {storeUnitData.map(unit => (
                                                    <option key={unit.unitId} value={unit.unitName}>{unit.unitName}</option>
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
                                            <label>Drug Schedule</label>
                                            <select
                                                className="form-select"
                                                name="drugSchedule"
                                                value={formData.drugSchedule}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Drug Schedule</option>
                                                {drugScheduleData.map((schedule) => (
                                                    <option key={schedule.scheduleCode} value={schedule.scheduleCode}>
                                                        {schedule.scheduleName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>Is Generic</label>
                                            <select
                                                className="form-select"
                                                name="isGeneric"
                                                value={formData.isGeneric}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select</option>
                                                <option value="y">Yes</option>
                                                <option value="n">No</option>
                                            </select>
                                        </div>

                                        {/* Facility Code Removed */}

                                        <div className="form-group col-md-6 mt-3">
                                            <label>Options</label>
                                            <div className="form-control d-flex flex-wrap gap-3">
                                                <div className="form-check form-check-inline">
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
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="highValueDrug"
                                                        name="highValueDrug"
                                                        checked={formData.highValueDrug}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="highValueDrug">
                                                        High Value Drug
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group col-md-6 mt-3">
                                            <label>Available in</label>
                                            <div className="form-control d-flex flex-wrap gap-3">
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="availableInOpd"
                                                        name="availableInOpd"
                                                        checked={formData.availableInOpd}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="availableInOpd">
                                                        OPD
                                                    </label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="availableInIpd"
                                                        name="availableInIpd"
                                                        checked={formData.availableInIpd}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="availableInIpd">
                                                        IPD
                                                    </label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="availableInEmergency"
                                                        name="availableInEmergency"
                                                        checked={formData.availableInEmergency}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="availableInEmergency">
                                                        EMERGENCY
                                                    </label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="availableInOt"
                                                        name="availableInOt"
                                                        checked={formData.availableInOt}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="availableInOt">
                                                        OT
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DrugMaster
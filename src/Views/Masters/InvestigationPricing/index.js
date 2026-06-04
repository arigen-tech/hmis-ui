import { useState, useEffect, useRef } from "react"
import Popup from "../../../Components/popup"
import {INVESTIGATION_PRICE_DETAILS, ALL_INVESTIGATION, ALL_INVESTIGATION_PRICE_DETAILS } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import {
    FETCH_INV_PRICING_ERR_MSG, FAIL_TO_LOAD_INV_OPTION, FILL_ALL_REQUIRED_FIELDS, TO_DATE_AFTER_FROM_DATE,
    UPDATE_INV_PRICING_SUCC_MSG, ADD_INV_PRICING_SUCC_MSG, FAIL_TO_UPDATE_STS, FAIL_TO_SAVE_CHANGES,
    SEARCH_CRITERIA_MANDATORY_WARN_MSG
} from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const Investigationpricing = () => {
    const [investigationList, setInvestigationList] = useState([])
    const [investigationOptions, setInvestigationOptions] = useState([])
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState({ 
        isOpen: false, 
        investigationId: null, 
        newStatus: "",
        name: "" 
    })
    const [formData, setFormData] = useState({
        investigationId: "",
        fromDate: "",
        toDate: "",
        price: "",
    })
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [editingInvestigation, setEditingInvestigation] = useState(null)
    const [popupMessage, setPopupMessage] = useState(null)

    // Pagination and search states
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [isShowAllLoading, setIsShowAllLoading] = useState(false)
    const [searchText, setSearchText] = useState("")

    // Search criteria
    const [investigationName, setInvestigationName] = useState("")

    const isMounted = useRef(true)

    useEffect(() => {
        fetchInvestigationOptions()
        fetchInvestigationPriceDetails(0, true)
        return () => {
            isMounted.current = false
        }
    }, [])

    // Fetch all investigation price details with server-side pagination
    const fetchInvestigationPriceDetails = async (page = 0, isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true)
            }

            const params = new URLSearchParams({
                page: page,
                size: DEFAULT_ITEMS_PER_PAGE
            })

            // Add search parameter if exists
            if (investigationName?.trim()) {
                params.append('investigationName', investigationName.trim())
            }

            const response = await getRequest(`${ALL_INVESTIGATION_PRICE_DETAILS}/0?${params.toString()}`)

            if (response && response.status === 200 && response.response) {
                setInvestigationList(response.response.content || [])
                setTotalPages(response.response.totalPages || 0)
                setTotalElements(response.response.totalElements || 0)
            }
        } catch (err) {
            console.error("Error fetching investigation price details:", err)
            showPopup(FETCH_INV_PRICING_ERR_MSG, "error")
            setInvestigationList([])
            setTotalPages(0)
            setTotalElements(0)
        } finally {
            if (isInitialLoad) {
                setLoading(false)
            } 
            setIsSearching(false)
            setIsShowAllLoading(false)
        }
    }

    // Fetch investigation options for dropdown
    const fetchInvestigationOptions = async () => {
        try {
            const response = await getRequest(`${ALL_INVESTIGATION}/1`)
            if (response && response.response) {
                setInvestigationOptions(response.response)
            }
        } catch (err) {
            console.error("Error fetching investigation options:", err)
            showPopup(FAIL_TO_LOAD_INV_OPTION, "error")
        }
    }

    // Check if search is enabled
    const isSearchEnabled = () => {
        return investigationName?.trim() !== ""
    }

    // Handle search button click
    const handleSearch = () => {
        if (!isSearchEnabled()) {
            showPopup(SEARCH_CRITERIA_MANDATORY_WARN_MSG, "warning")
            return
        }
        setIsSearching(true)
        setCurrentPage(0)
        fetchInvestigationPriceDetails(0, false)
    }

    // Handle show all button click
    const handleShowAll = async () => {
        setIsShowAllLoading(true);
        
        setInvestigationName("");
        setCurrentPage(0);
        
        try {
            const params = new URLSearchParams({
                page: 0,
                size: DEFAULT_ITEMS_PER_PAGE
            });
            
            const response = await getRequest(`${ALL_INVESTIGATION_PRICE_DETAILS}/0?${params.toString()}`);
            
            if (response && response.status === 200 && response.response) {
                setInvestigationList(response.response.content || []);
                setTotalPages(response.response.totalPages || 0);
                setTotalElements(response.response.totalElements || 0);
            } else {
                setInvestigationList([]);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (error) {
            console.error("Error fetching investigation price details:", error);
            showPopup(FETCH_INV_PRICING_ERR_MSG, "error");
            setInvestigationList([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setIsShowAllLoading(false);
        }
    };

    // Handle pagination page change
    const handlePageChange = (page) => {
        const newPage = page - 1
        setCurrentPage(newPage)
        fetchInvestigationPriceDetails(newPage, false)
    }

    const handleEdit = (item) => {
        setEditingInvestigation(item)
        setShowForm(true)
        setFormData({
            investigationId: item.investigationId?.toString() || "",
            fromDate: formatDateForInput(item.fromDt) || "",
            toDate: formatDateForInput(item.toDt) || "",
            price: item.price,
        })
        setSearchText(item.investigationName || getInvestigationName(item.investigationId) || "")
        setIsFormValid(true)
    }

    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString || dateString === "-") return ""
        try {
            const date = new Date(dateString)
            return date.toISOString().split('T')[0]
        } catch (e) {
            return dateString
        }
    }

    const formatDateForDisplay = (dateString) => {
        if (!dateString || dateString === "-") return "";

        try {
            const date = new Date(dateString);

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (e) {
            return "";
        }
    };

    const resetForm = () => {
        setEditingInvestigation(null)
        setShowForm(false)
        setFormData({ investigationId: "", fromDate: "", toDate: "", price: "" })
        setSearchText("")
        setIsFormValid(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()

        if (!formData.investigationId || !formData.fromDate || !formData.toDate || !formData.price) {
            showPopup(FILL_ALL_REQUIRED_FIELDS, "error")
            return
        }

        if (new Date(formData.toDate) < new Date(formData.fromDate)) {
            showPopup(TO_DATE_AFTER_FROM_DATE, "error")
            return
        }

        setSaving(true)

        try {
            const requestData = {
                investigationId: parseInt(formData.investigationId),
                fromDt: formData.fromDate,
                toDt: formData.toDate,
                price: parseFloat(formData.price),
            }

            if (editingInvestigation) {
                const response = await putRequest(`${INVESTIGATION_PRICE_DETAILS}/update/${editingInvestigation.id}`, requestData)
                
                if (response && response.status === 200) {
                    setPopupMessage({
                        message: UPDATE_INV_PRICING_SUCC_MSG,
                        type: "success",
                        onClose: () => {
                            setPopupMessage(null)
                            resetForm()
                            fetchInvestigationPriceDetails(currentPage, false)
                        }
                    })
                } else {
                    throw new Error(response.message || FAIL_TO_SAVE_CHANGES)
                }
            } else {
                const response = await postRequest(`${INVESTIGATION_PRICE_DETAILS}/add`, requestData)
                
                if (response.status === 201 || response.status === 200) {
                    setPopupMessage({
                        message: ADD_INV_PRICING_SUCC_MSG,
                        type: "success",
                        onClose: () => {
                            setPopupMessage(null)
                            resetForm()
                            fetchInvestigationPriceDetails(0, false)
                        }
                    })
                } else {
                    throw new Error(response.message || FAIL_TO_SAVE_CHANGES)
                }
            }
        } catch (err) {
            console.error("Error in save operation:", err)
            showPopup(
                err.response?.data?.message || FAIL_TO_SAVE_CHANGES,
                "error"
            )
        } finally {
            setSaving(false)
        }
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

    const handleSwitchChange = (id, currentStatus, name) => {
        const newStatus = currentStatus === "y" ? "n" : "y"
        setConfirmDialog({ isOpen: true, investigationId: id, newStatus, name })
    }

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.investigationId !== null) {
            setSaving(true)

            try {
                const response = await putRequest(
                    `${INVESTIGATION_PRICE_DETAILS}/status/${confirmDialog.investigationId}?status=${confirmDialog.newStatus}`
                )

                if (response && response.status === 200) {
                    setPopupMessage({
                        message: `Investigation price "${confirmDialog.name}" ${
                            confirmDialog.newStatus === "y" ? "activated" : "deactivated"
                        } successfully!`,
                        type: "success",
                        onClose: () => {
                            setPopupMessage(null)
                            resetForm()
                            fetchInvestigationPriceDetails(currentPage, false)
                        },
                    })
                } else {
                    throw new Error(response.message || "Failed to update status")
                }
            } catch (err) {
                console.error("Error updating investigation price details status:", err)
                showPopup(FAIL_TO_UPDATE_STS, "error")
            } finally {
                setSaving(false)
            }
        }

        setConfirmDialog({
            isOpen: false,
            investigationId: null,
            newStatus: "",
            name: "",
        })
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target

        if (id === "price") {
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setFormData((prevData) => ({ ...prevData, [id]: value }))
            }
            return
        }

        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleAddClick = () => {
        resetForm()
        setShowForm(true)
    }

    const handleInvestigationSearch = (e) => {
        const value = e.target.value
        setSearchText(value)
        setDropdownOpen(value.trim() !== "")
    }

    const handleInvestigationSelect = (investigation) => {
        setFormData({
            ...formData,
            investigationId: investigation.investigationId.toString()
        })
        setSearchText(investigation.investigationName || investigation.investigationId.toString())
        setDropdownOpen(false)
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownOpen && !event.target.closest(".dropdown-search-container")) {
                setDropdownOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [dropdownOpen])

    useEffect(() => {
        const isValid = !!formData.investigationId &&
            !!formData.price &&
            !!formData.fromDate &&
            !!formData.toDate
        setIsFormValid(isValid)
    }, [formData])

    const getInvestigationName = (id) => {
        const investigation = investigationOptions.find(item => item.investigationId?.toString() === id?.toString())
        return investigation ? investigation.investigationName : id
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Investigation Pricing Master</h4>

                            <div className="d-flex align-items-center">
                                {!showForm && (
                                    <button
                                        type="button"
                                        className="btn btn-success me-2"
                                        onClick={handleAddClick}
                                    >
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>
                                )}

                                {showForm && (
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={resetForm}
                                    >
                                        <i className="mdi mdi-arrow-left"></i> Back
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <>
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        <div className="col-md-4 align-items-center">
                                            <label className="mb-1"><b>Investigation name</b></label>
                                            <input
                                                type="text"
                                                className="form-control me-2"
                                                placeholder="Search by investigation name..."
                                                value={investigationName}
                                                onChange={(e) => setInvestigationName(e.target.value)}
                                                style={{ width: '250px' }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleSearch}
                                            disabled={isSearching || !isSearchEnabled()}
                                        >
                                            {isSearching ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Searching...
                                                </>
                                            ) : (
                                                'Search'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleShowAll}
                                            disabled={isShowAllLoading}
                                        >
                                            {isShowAllLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Showing All...
                                                </>
                                            ) : (
                                                'Show All'
                                            )}
                                        </button>
                                    </div>

                                    <div className="table-responsive packagelist">
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Investigation Name</th>
                                                    <th>From Date</th>
                                                    <th>To Date</th>
                                                    <th>Price</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {investigationList.length > 0 ? (
                                                    investigationList.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.investigationName || getInvestigationName(item.investigationId)}</td>
                                                            <td>{formatDateForDisplay(item.fromDt)}</td>
                                                            <td>{formatDateForDisplay(item.toDt)}</td>
                                                            <td>₹{item.price}</td>
                                                            <td>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={item.status === "y"}
                                                                        onChange={() => handleSwitchChange(
                                                                            item.id, 
                                                                            item.status, 
                                                                            item.investigationName || getInvestigationName(item.investigationId)
                                                                        )}
                                                                        id={`switch-${item.id}`}
                                                                    />
                                                                    <label
                                                                        className="form-check-label ms-2"
                                                                        htmlFor={`switch-${item.id}`}
                                                                    >
                                                                        {item.status === "y" ? "Active" : "Inactive"}
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-success btn-sm"
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
                                                        <td colSpan="6" className="text-center py-4">
                                                            No Records Found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Server-side Pagination */}
                                    {investigationList.length > 0 && totalPages > 0 && (
                                        <Pagination
                                            totalItems={totalElements}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage + 1}
                                            onPageChange={handlePageChange}
                                            totalPages={totalPages}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>
                                            Investigation <span className="text-danger">*</span>
                                        </label>

                                        <div className="dropdown-search-container position-relative">
                                            <input
                                                type="text"
                                                className="form-control mt-1"
                                                id="investigationId"
                                                placeholder="Search Investigation"
                                                autoComplete="off"
                                                required
                                                value={searchText || getInvestigationName(formData.investigationId) || ""}
                                                onChange={handleInvestigationSearch}
                                                onFocus={(e) => {
                                                    if (e.target.value.trim() !== "") {
                                                        setDropdownOpen(true);
                                                    }
                                                }}
                                            />
                                            {dropdownOpen && searchText.trim() !== "" && (
                                                <ul
                                                    className="list-group position-absolute w-100 mt-1"
                                                    style={{
                                                        zIndex: 1000,
                                                        maxHeight: '200px',
                                                        overflowY: 'auto',
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #ccc',
                                                    }}
                                                >
                                                    {investigationOptions
                                                        .filter(item =>
                                                            item.investigationName &&
                                                            (item.investigationName.toLowerCase().includes(searchText.toLowerCase()) ||
                                                                item.investigationId.toString().includes(searchText))
                                                        )
                                                        .map((item, index) => (
                                                            <li
                                                                key={index}
                                                                className="list-group-item list-group-item-action"
                                                                style={{ backgroundColor: '#e3e8e6', cursor: 'pointer' }}
                                                                onClick={() => handleInvestigationSelect(item)}
                                                            >
                                                                {item.investigationName || "N/A"}
                                                            </li>
                                                        ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group col-md-4 mt-3">
                                        <label>
                                            From Date <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="form-control mt-1"
                                            id="fromDate"
                                            onChange={handleInputChange}
                                            value={formData.fromDate}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>
                                            To Date <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="form-control mt-1"
                                            id="toDate"
                                            onChange={handleInputChange}
                                            value={formData.toDate}
                                            required
                                        />
                                        {formData.fromDate && formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate) && (
                                            <div className="text-danger mt-1">To Date must be after From Date</div>
                                        )}
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>
                                            Price <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group mt-1">
                                            <span className="input-group-text">₹</span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="price"
                                                placeholder="Price"
                                                onChange={handleInputChange}
                                                value={formData.price}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group col-md-12 mt-3 d-flex justify-content-end">
                                        <button
                                            type="submit"
                                            className="btn btn-primary me-2"
                                            disabled={!isFormValid || saving}
                                        >
                                            {saving ? "Saving..." : editingInvestigation ? "Update" : "Save"}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger" 
                                            onClick={resetForm}
                                        >
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

                            {confirmDialog.isOpen && (
                                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-body">
                                                Are you sure you want to{" "}
                                                {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                <strong>{confirmDialog.name}</strong>?
                                            </div>
                                            <div className="modal-footer">
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => handleConfirm(false)}
                                                >
                                                    No
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleConfirm(true)}
                                                >
                                                    Yes
                                                </button>
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

export default Investigationpricing
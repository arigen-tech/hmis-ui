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
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, investigationId: null, newStatus: false })
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
    const [isSearching, setIsSearching] = useState(false)
    const [isShowAllLoading, setIsShowAllLoading] = useState(false)
    const [searchText, setSearchText] = useState("")
    const [paginationLoading,setPaginationLoading]= useState(false)

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
    
    // Clear search field
    setInvestigationName("");
    setCurrentPage(0);
    
    // Fetch all data without any search criteria from page 0
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
        const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (e) {
        return "";
    }
};

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

        try {
            setLoading(true)

            const requestData = {
                investigationId: parseInt(formData.investigationId),
                fromDt: formData.fromDate,
                toDt: formData.toDate,
                price: parseFloat(formData.price),
            }

            if (editingInvestigation) {
                putRequest(`${INVESTIGATION_PRICE_DETAILS}/update/${editingInvestigation.id}`, requestData)
                    .then(response => {
                        if (response && response.status === 200) {
                            showPopup(UPDATE_INV_PRICING_SUCC_MSG, "success")
                            fetchInvestigationPriceDetails(currentPage, false)
                            resetForm()
                        } else {
                            showPopup(response.message || FAIL_TO_SAVE_CHANGES, "error")
                        }
                    })
                    .catch(error => {
                        console.error("Error updating investigation price:", error)
                        const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred"
                        showPopup(errorMessage, "error")
                    })
                    .finally(() => {
                        setLoading(false)
                    })
            } else {
                postRequest(`${INVESTIGATION_PRICE_DETAILS}/add`, requestData)
                    .then(response => {
                        if (response && response.status === 200) {
                            showPopup(ADD_INV_PRICING_SUCC_MSG, "success")
                            fetchInvestigationPriceDetails(0, false)
                            resetForm()
                        } else {
                            showPopup(FAIL_TO_SAVE_CHANGES, "error")
                        }
                    })
                    .catch(error => {
                        console.error("Error adding investigation price:", error)
                        const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred"
                        showPopup(errorMessage, "error")
                    })
                    .finally(() => {
                        setLoading(false)
                    })
            }
        } catch (err) {
            console.error("Error in save operation:", err)
            showPopup(FAIL_TO_SAVE_CHANGES, "error")
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEditingInvestigation(null)
        setShowForm(false)
        setFormData({ investigationId: "", fromDate: "", toDate: "", price: "" })
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

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, investigationId: id, newStatus })
    }

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.investigationId !== null) {
            try {
                setLoading(true)

                const response = await putRequest(
                    `${INVESTIGATION_PRICE_DETAILS}/status/${confirmDialog.investigationId}?status=${confirmDialog.newStatus}`
                )

                if (response && response.status === 200) {
                    setInvestigationList((prevData) =>
                        prevData.map((item) =>
                            item.id === confirmDialog.investigationId ? { ...item, status: confirmDialog.newStatus } : item
                        )
                    )
                    showPopup(
                        `Investigation price details ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
                        "success"
                    )
                    fetchInvestigationPriceDetails(currentPage, false)
                }
            } catch (err) {
                console.error("Error updating investigation price details status:", err)
                showPopup(FAIL_TO_UPDATE_STS, "error")
            } finally {
                setLoading(false)
            }
        }
        setConfirmDialog({ isOpen: false, investigationId: null, newStatus: null })
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

        setTimeout(() => {
            const updatedFormData = { ...formData, [id]: value }
            const isValid = !!updatedFormData.investigationId &&
                !!updatedFormData.price &&
                !!updatedFormData.fromDate &&
                !!updatedFormData.toDate
            setIsFormValid(isValid)
        }, 0)
    }

    const handleAddClick = () => {
        setFormData({ investigationId: "", fromDate: "", toDate: "", price: "" })
        setEditingInvestigation(null)
        setShowForm(true)
        setIsFormValid(false)
        setSearchText("")
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

        setTimeout(() => {
            const updatedFormData = {
                ...formData,
                investigationId: investigation.investigationId.toString()
            }
            const isValid = !!updatedFormData.investigationId &&
                !!updatedFormData.price &&
                !!updatedFormData.fromDate &&
                !!updatedFormData.toDate
            setIsFormValid(isValid)
        }, 0)
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

    const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "";

    try {
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
};

    const getInvestigationName = (id) => {
        const investigation = investigationOptions.find(item => item.investigationId?.toString() === id?.toString())
        return investigation ? investigation.investigationName : id
    }

    const debugFormState = () => {
        console.log("Current form state:", formData)
        console.log("Is form valid?", isFormValid)
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
                                    <div className="d-flex align-items-center gap-2">
                                        {/* Search Input */}

                                        <button
                                            type="button"
                                            className="btn btn-success me-2"
                                            onClick={handleAddClick}
                                        >
                                            <i className="mdi mdi-plus"></i> Add
                                        </button>
                                    </div>
                                )}

                                {showForm && (
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
                                            className="btn btn-primary "
                                            onClick={handleSearch}
                                            disabled={isSearching || !isSearchEnabled()}
                                        >
                                            {isSearching ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Searching...
                                                </>
                                            ) : (
                                                <>
                                                    Search
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleShowAll}
                                            disabled={ isShowAllLoading}
                                        >
                                            {isShowAllLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Showing All...
                                                </>
                                            ) : (
                                                <>
                                                    Show All
                                                </>
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
                                                {paginationLoading ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center py-4">
                                                            <div className="spinner-border text-primary spinner-sm" role="status">
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div>
                                                            <span className="ms-2">Loading page...</span>
                                                        </td>
                                                    </tr>
                                                ) : investigationList.length > 0 ? (
                                                    investigationList.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.investigationName || getInvestigationName(item.investigationId)}</td>
                                                            <td>{formatDate(item.fromDt)}</td>
                                                            <td>{formatDate(item.toDt)}</td>
                                                            <td>₹{item.price}</td>
                                                            <td>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={item.status === "y"}
                                                                        onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                                                                        id={`switch-${item.id}`}
                                                                    />
                                                                    <label
                                                                        className="form-check-label px-0"
                                                                        htmlFor={`switch-${item.id}`}
                                                                        onClick={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
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
                                                        <td colSpan="6" className="text-center py-4">
                                                            No records found
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
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    </div>
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Investigation <span className="text-danger">*</span>
                                            </label>

                                            <div className="dropdown-search-container position-relative">
                                                <input
                                                    type="text"
                                                    className="form-control"
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
                                                className="form-control"
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
                                                className="form-control"
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
                                            <div className="input-group">
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
                                    </div>

                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary me-2"
                                            onClick={(e) => {
                                                debugFormState();
                                                handleSave(e);
                                            }}
                                        >
                                            {editingInvestigation ? "Update" : "Save"}
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {popupMessage && (
                                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                    <strong>
                                                        {getInvestigationName(
                                                            investigationList.find((item) => item.id === confirmDialog.investigationId)
                                                                ?.investigationId
                                                        )}
                                                    </strong>
                                                    ?
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Investigationpricing
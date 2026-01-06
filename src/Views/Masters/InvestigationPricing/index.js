import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import axios from "axios"
import { API_HOST, INVESTIGATION_PRICE_DETAILS, ALL_INVESTIGATION, ALL_INVESTIGATION_PRICE_DETAILS } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"
import { FETCH_INV_PRICING_ERR_MSG, FAIL_TO_LOAD_INV_OPTION,FILL_ALL_REQUIRED_FIELDS,TO_DATE_AFTER_FROM_DATE,
    UPDATE_INV_PRICING_SUCC_MSG,ADD_INV_PRICING_SUCC_MSG,FAIL_TO_UPDATE_STS,FAIL_TO_SAVE_CHANGES
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
    const [searchQuery, setSearchQuery] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [editingInvestigation, setEditingInvestigation] = useState(null)
    const [popupMessage, setPopupMessage] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState("")

    useEffect(() => {
        fetchInvestigationPriceDetails()
        fetchInvestigationOptions()
    }, [])

    // Fetch all investigation price details
    const fetchInvestigationPriceDetails = async () => {
        try {
            setLoading(true)
            const response = await getRequest(`${ALL_INVESTIGATION_PRICE_DETAILS}/0`)
            if (response && response.response) {
                setInvestigationList(response.response)
            }
        } catch (err) {
            console.error("Error fetching investigation price details:", err)
            showPopup(FETCH_INV_PRICING_ERR_MSG, "error")
        } finally {
            setLoading(false)
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

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
    }


    const filteredInvestigationList = investigationList.filter(
        (item) =>
            (item.investigationId && item.investigationId.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.price && item.price.toString().toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredInvestigationList.slice(indexOfFirst, indexOfLast);

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
            return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
        } catch (e) {
            return dateString
        }
    }

    const handleSave = async (e) => {
    e.preventDefault()
    
    // Check form validation again just to be safe
    if (!formData.investigationId || !formData.fromDate || !formData.toDate || !formData.price) {
        showPopup(FILL_ALL_REQUIRED_FIELDS, "error")
        return
    }
    
    // Check date validation
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
            // Update existing price details
            putRequest(`${INVESTIGATION_PRICE_DETAILS}/update/${editingInvestigation.id}`, requestData)
                .then(response => {
                    if (response && response.status === 200) {
                        showPopup(UPDATE_INV_PRICING_SUCC_MSG, "success")
                        fetchInvestigationPriceDetails() // Refresh the list
                        resetForm()
                    } else {
                        showPopup(FAIL_TO_SAVE_CHANGES, "error")
                    }
                })
                .catch(error => {
                    console.error("Error updating investigation price:", error)
                    
                    // Extract error message from response
                    const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred"
                    showPopup(errorMessage, "error")
                })
                .finally(() => {
                    setLoading(false)
                })
        } else {
            // Add new price details
            postRequest(`${INVESTIGATION_PRICE_DETAILS}/add`, requestData)
                .then(response => {
                    if (response && response.status === 200) {
                        showPopup(ADD_INV_PRICING_SUCC_MSG, "success")
                        fetchInvestigationPriceDetails() // Refresh the list
                        resetForm()
                    } else {
                        showPopup(FAIL_TO_SAVE_CHANGES, "error")
                    }
                })
                .catch(error => {
                    console.error("Error adding investigation price:", error)
                    
                    // Extract error message from response
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

// Helper function to reset form state
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
                    fetchInvestigationPriceDetails() 
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

        // Validate the price input to allow only numbers and decimal points
        if (id === "price") {
            // Check if the value is a valid number (including empty string)
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setFormData((prevData) => ({ ...prevData, [id]: value }))
            }
            return // Exit the function after validation
        }

        setFormData((prevData) => ({ ...prevData, [id]: value }))

        // Check for form validity after input changes
        setTimeout(() => {
            const updatedFormData = { ...formData, [id]: value }
            const isValid = !!updatedFormData.investigationId && 
                           !!updatedFormData.price && 
                           !!updatedFormData.fromDate && 
                           !!updatedFormData.toDate
            setIsFormValid(isValid)
            console.log("Form validity after input change:", isValid, updatedFormData)
        }, 0)
    }

    const handleRefresh = () => {
        setSearchQuery("")
        setCurrentPage(1)
        fetchInvestigationPriceDetails()
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
            console.log("Form validity after investigation selection:", isValid, updatedFormData)
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
        console.log("Form validity in useEffect:", isValid, formData)
    }, [formData])

    const formatDate = (dateString) => {
        if (!dateString || dateString === "-") return "-"

        try {
            const date = new Date(dateString)
            return date.toISOString().split('T')[0]
        } catch (e) {
            return dateString
        }
    }

    
    const getInvestigationName = (id) => {
        const investigation = investigationOptions.find(item => item.investigationId?.toString() === id?.toString())
        return investigation ? investigation.investigationName : id
    }

   
    const debugFormState = () => {
        console.log("Current form state:", formData)
        console.log("Is form valid?", isFormValid)
        console.log("Are dates valid?", !(formData.fromDate && formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate)))
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Investigation Pricing Master</h4>

                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search "
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
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
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={handleAddClick}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2 flex-shrink-0"
                                                onClick={handleRefresh}
                                            >
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <>
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
                                                {currentItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{getInvestigationName(item.investigationId)}</td>
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
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {filteredInvestigationList.length > 0 && (
                                        <Pagination
                                            totalItems={filteredInvestigationList.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
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
                                                    placeholder="Search Investigation ID"
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
                                                debugFormState(); // Debug info in console
                                                handleSave(e);
                                            }}
                                        >
                                            Save
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
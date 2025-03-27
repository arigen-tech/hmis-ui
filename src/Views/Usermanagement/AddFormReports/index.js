

import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { ALL_APPLICATIONS, APPLICATION, ALL_USER_APPLICATION, USER_APPLICATION } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../service/apiService"

const Addformreports = () => {
    const [loading, setLoading] = useState(false)
    const [popupMessage, setPopupMessage] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)

    // Options for dropdowns
    const [menuNameOptions, setMenuNameOptions] = useState([])
    const [parentIdOptions, setParentIdOptions] = useState([])
    const [appNameOptions, setAppNameOptions] = useState([])

    // Dropdown visibility states
    const [isMenuNameDropdownVisible, setIsMenuNameDropdownVisible] = useState(false)
    const [isParentIdDropdownVisible, setIsParentIdDropdownVisible] = useState(false)
    const [isAppNameDropdownVisible, setIsAppNameDropdownVisible] = useState(false)

    // Form data state
    const [formData, setFormData] = useState({
        menuId: "",
        menuName: "",
        parentId: "",
        parentName: "",
        url: "",
        status: "",
    })

    // Edit mode specific states
    const [selectedAppName, setSelectedAppName] = useState("")
    const [isEditDataLoaded, setIsEditDataLoaded] = useState(false)
    const [originalParentId, setOriginalParentId] = useState("")

    // Fetch menu name options
    useEffect(() => {
        const fetchMenuNameOptions = async () => {
            try {
                setLoading(true)
                const response = await getRequest(`${ALL_USER_APPLICATION}/1`)

                if (response && response.response) {
                    const menuOptions = response.response.map((item) => ({
                        id: item.id.toString(),
                        name: item.userAppName,
                        url: item.url,
                    }))
                    setMenuNameOptions(menuOptions)
                } else {
                    console.log("Unexpected response structure:", response)
                    setMenuNameOptions([])
                }
            } catch (err) {
                console.error("Error fetching menu names:", err)
                showPopup("Error fetching menu names. Please try again later.", "error")
            } finally {
                setLoading(false)
            }
        }

        fetchMenuNameOptions()
    }, [])

   
   // Fetch parent ID options
useEffect(() => {
    const fetchParentIdOptions = async () => {
        try {
            setLoading(true)
            const response = await getRequest(`${APPLICATION}/getAllParents/1`)

            if (response && response.response) {
                const parentOptions = response.response.map((item) => ({
                    id: item.appId ? item.appId.toString() : "",
                    name: item.name || "",
                    url: item.url || "",
                }))
                setParentIdOptions(parentOptions)
            } else {
                console.log("Unexpected response structure:", response)
                setParentIdOptions([])
            }
        } catch (err) {
            console.error("Error fetching parent IDs:", err)
            showPopup("Error fetching parent IDs. Please try again later.", "error")
        } finally {
            setLoading(false)
        }
    }

    fetchParentIdOptions()
}, [])

    // Fetch application names for edit mode dropdown
    useEffect(() => {
        const fetchAppNames = async () => {
            if (isEditMode) {
                try {
                    setLoading(true)
                    const response = await getRequest(`${ALL_APPLICATIONS}/0`)

                    if (response && response.response) {
                        const appOptions = response.response.map((item) => {
                            // Add null checks for all properties
                            return {
                                id: item.appId ? item.appId.toString() : "",
                                name: item.name || "",
                                parentId: item.parentId || "",
                                url: item.url || "",
                                status: item.status === "y" ? "active" : "inactive",
                            }
                        })
                        setAppNameOptions(appOptions)
                    } else {
                        console.log("Unexpected response structure:", response)
                        setAppNameOptions([])
                        showPopup("Unexpected response format from server", "error")
                    }
                } catch (err) {
                    console.error("Error fetching application names:", err)
                    showPopup("Error fetching application names. Please try again later.", "error")
                } finally {
                    setLoading(false)
                }
            }
        }

        fetchAppNames()
    }, [isEditMode])

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
                setShowModal(false)
            },
        })
        setShowModal(true)
    }
    const handleMenuNameChange = (e) => {
        const inputValue = e.target.value
        setFormData((prev) => ({
            ...prev,
            // Only update menuId if not in edit mode
            ...(!isEditMode && { menuId: "" }),
            menuName: inputValue,
            // Only update url if not in edit mode
            ...(!isEditMode && { url: "" }),
        }))
        setIsMenuNameDropdownVisible(true)
    }

   

    const handleInputChange = (e) => {
        const { id, value } = e.target

        // Prevent changing parent ID in edit mode
        if (isEditMode && id === "parentName") {
            return
        }

        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }))
    }
    const handleMenuNameSelect = (selectedMenu) => {
        setFormData((prev) => ({
            ...prev,
            
            ...(!isEditMode && { menuId: selectedMenu.id }),
            menuName: selectedMenu.name,
            
            ...(isEditMode && { url: selectedMenu.url  }),
           
            ...(!isEditMode && { url: selectedMenu.url  }),
        }))
        setIsMenuNameDropdownVisible(false)
    }
    
   

    const handleParentIdChange = (e) => {
        const inputValue = e.target.value
        setFormData((prev) => ({
            ...prev,
            parentId: "",
            parentName: inputValue,
        }))
        setIsParentIdDropdownVisible(true)
    }



    const handleParentIdSelect = (selectedParent) => {
        setFormData((prev) => ({
            ...prev,
            parentId: selectedParent.id,
            parentName: selectedParent.name,
        }))
        setIsParentIdDropdownVisible(false)
    }

    const handleAppNameChange = (e) => {
        const inputValue = e.target.value
        setSelectedAppName(inputValue)
        setIsAppNameDropdownVisible(true)
    }

    const handleAppNameSelect = (selectedApp) => {
        // Find the parent name corresponding to the parent ID
        const parentName = parentIdOptions.find(parent => parent.id === selectedApp.parentId)?.name || '';
    
        setSelectedAppName(selectedApp.name)
        setFormData({
            menuId: selectedApp.id,
            menuName: selectedApp.name,
            parentId: selectedApp.parentId,
            parentName: parentName,
            url: selectedApp.url,
            status: selectedApp.status,
        })
        setOriginalParentId(selectedApp.parentId)
        setIsEditDataLoaded(true)
        setIsAppNameDropdownVisible(false)
    }
    const handleSubmit = async (e) => {
        e.preventDefault()

        // More Robust Validation
        if (!formData.menuName.trim()) {
            showPopup("Menu Name is required", "warning")
            return
        }
        if (!formData.menuId.trim()) {
            showPopup("Menu ID is required", "warning")
            return
        }
        if (!formData.url.trim()) {
            showPopup("URL is required", "warning")
            return
        }
        if (!formData.status) {
            showPopup("Status is required", "warning")
            return
        }

        try {
            setLoading(true)

           
            const allApplicationsResponse = await getRequest(`${ALL_APPLICATIONS}/0`)

            if (allApplicationsResponse && allApplicationsResponse.response) {
                
                const isDuplicate = allApplicationsResponse.response.some(app =>
                    app.name.toLowerCase() === formData.menuName.toLowerCase() &&
                    
                    (app.parentId || '') === (isEditMode ? originalParentId : (formData.parentId || '')) &&
                    
                    (!isEditMode || app.appId.toString() !== formData.menuId)
                )

                if (isDuplicate) {
                    showPopup("An application with the same name and parent already exists!", "error")
                    setLoading(false)
                    return
                }
            }

            // Prepare submit data
            const submitData = isEditMode
                ? {
                    appId: formData.menuId,
                    name: formData.menuName,
                    parentId: originalParentId,
                    url: formData.url,
                    status: formData.status === "active" ? "y" : "n",
                }
                : {
                    menuId: formData.menuId,
                    name: formData.menuName,
                    parentId: formData.parentId || null,
                    url: formData.url,
                    status: formData.status === "active" ? "y" : "n",
                }

            const apiCall = isEditMode ? putRequest : postRequest
            const endpoint = isEditMode ? `${APPLICATION}/edit/${formData.menuId}` : `${APPLICATION}/create`

            const response = await apiCall(endpoint, submitData)

            // Rest of the existing submit logic remains the same...
            if (response) {
                if (response.response) {
                    showPopup(
                        isEditMode
                            ? "Application updated successfully"
                            : "Application created successfully",
                        "success"
                    )

                    // Reset form and states
                    resetForm()
                } else {
                    
                    console.error('Unexpected response structure:', response)
                    showPopup(
                        isEditMode
                            ? "Failed to update application"
                            : "Failed to create application",
                        "error"
                    )
                }
            } else {
                showPopup("No response received from server", "error")
            }
        } catch (err) {
            
            console.error("Full error details:", {
                message: err.message,
                response: err.response,
                stack: err.stack
            })

           
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Unexpected error occurred. Please try again later."

            showPopup(errorMessage, "error")
        } finally {
            setLoading(false)
        }
    }

   
    const resetForm = () => {
        setFormData({
            menuId: "",
            menuName: "",
            parentId: "",
            parentName: "",
            url: "",
            status: "",
        })

        
        setIsEditDataLoaded(false)
        setSelectedAppName("")
        setOriginalParentId("")
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : (
                                <form className="forms row" onSubmit={handleSubmit}>
                                    <h5 className="bg-light p-3 rounded">{isEditMode ? "Edit" : "Add"} Forms/Reports</h5>

                                    {isEditMode && (
                                        <div className="row mb-3">
                                            <div className="form-group col-12 position-relative">
                                                <label className="me-2 mb-0">
                                                    APP Name <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control mt-1"
                                                    id="appName"
                                                    placeholder="Search Application Name"
                                                    value={selectedAppName}
                                                    onChange={handleAppNameChange}
                                                    autoComplete="off"
                                                    required
                                                    disabled={isEditDataLoaded}
                                                />
                                                {isAppNameDropdownVisible && selectedAppName && (
                                                    <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
                                                        {appNameOptions
                                                            .filter((app) => app.name.toLowerCase().includes(selectedAppName.toLowerCase()))
                                                            .map((app) => (
                                                                <li
                                                                    key={app.id}
                                                                    className="list-group-item list-group-item-action"
                                                                    onClick={() => handleAppNameSelect(app)}
                                                                >
                                                                    {app.name} (Parent: {app.parentId})
                                                                </li>
                                                            ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group col-md-4 position-relative">
                                        <label>
                                            Menu Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="menuName"
                                            placeholder="Search Menu Name"
                                            value={formData.menuName}
                                            onChange={handleMenuNameChange}
                                            autoComplete="off"
                                            required
                                            disabled={isEditMode && !isEditDataLoaded}
                                        />
                                        {isMenuNameDropdownVisible && formData.menuName && (
                                            <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
                                                {menuNameOptions
                                                    .filter((menu) => menu.name.toLowerCase().includes(formData.menuName.toLowerCase()))
                                                    .map((menu) => (
                                                        <li
                                                            key={menu.id}
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => handleMenuNameSelect(menu)}
                                                        >
                                                            {menu.name}
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>
                                            Menu ID <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="menuId"
                                            placeholder="Menu ID"
                                            value={formData.menuId}
                                            onChange={handleInputChange}
                                            required
                                            readOnly
                                            disabled={isEditMode}
                                        />
                                    </div>

                                    <div className="form-group col-md-4 position-relative">
                                        <label>Parent ID</label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="parentName"
                                            placeholder="Search Parent ID"
                                            value={
                                                isEditMode 
                                                    ? (formData.parentId ? `${formData.parentId} - ${formData.parentName}` : formData.parentName)
                                                    : formData.parentName
                                            }
                                            onChange={handleParentIdChange}
                                            autoComplete="off"
                                            disabled={isEditMode}
                                        />
                                        {isParentIdDropdownVisible && formData.parentName && !isEditMode && (
                                            <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000 }}>
                                                {parentIdOptions
                                                    .filter((parent) => parent.name.toLowerCase().includes(formData.parentName.toLowerCase()))
                                                    .map((parent) => (
                                                        <li
                                                            key={parent.id}
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => handleParentIdSelect(parent)}
                                                        >
                                                            {parent.name} (ID: {parent.id})
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                        <input type="hidden" id="parentId" value={formData.parentId} />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>
                                            URL <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control mt-1"
                                            id="url"
                                            placeholder="URL"
                                            value={formData.url}
                                            onChange={handleInputChange}
                                            required
                                            readOnly={!isEditMode}
                                            disabled={isEditMode && !isEditDataLoaded}
                                        />
                                    </div>

                                    <div className="form-group col-md-4">
                                        <label>
                                            Status <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control mt-1"
                                            id="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            required
                                            disabled={isEditMode && !isEditDataLoaded}
                                        >
                                            <option value="">Select Status</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                                        {isEditMode ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditMode(false)
                                                        setIsEditDataLoaded(false)
                                                        setSelectedAppName("")
                                                        setOriginalParentId("")
                                                        setFormData({
                                                            menuId: "",
                                                            menuName: "",
                                                            parentId: "",
                                                            parentName: "",
                                                            url: "",
                                                            status: "",
                                                        })
                                                    }}
                                                    className="btn btn-secondary me-2"
                                                >
                                                    Back
                                                </button>
                                                <button type="submit" className="btn btn-primary" disabled={!isEditDataLoaded}>
                                                    Update
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button type="submit" className="btn btn-primary me-2">
                                                    Add
                                                </button>
                                                <button type="button" onClick={() => setIsEditMode(true)} className="btn btn-secondary">
                                                    Edit
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            )}

                            {/* Popup Component */}
                            {showModal && popupMessage && (
                                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Addformreports


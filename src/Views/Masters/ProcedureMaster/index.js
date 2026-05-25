import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index"
import { getRequest, putRequest, postRequest } from "../../../service/apiService"
import { MAS_PROCEDURE, MAS_DEPARTMENT } from "../../../config/apiConfig"
import { ADD_PROCEDURE_SUCC_MSG, UPDATE_PROCEDURE_SUCC_MSG, FAIL_TO_SAVE_CHANGES, FAIL_TO_UPDATE_STS } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const ProcedureMaster = () => {
  const [formData, setFormData] = useState({
    procedureCode: "",
    procedureName: "",
    departmentId: "",
    opdAllowed: "",
    ipdAllowed: "",
    isNursing: "",
    procedureLevel: ""
  })

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    procedureId: null, 
    newStatus: "", 
    procedureName: "" 
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [procedureData, setProcedureData] = useState([])
  const [departmentData, setDepartmentData] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [process, setProcess] = useState(false)

  // Constants for validation
  const PROCEDURE_CODE_MAX_LENGTH = 8
  const PROCEDURE_NAME_MAX_LENGTH = 30

  // Dropdown options
  const yesNoOptions = [
    { value: "Y", label: "Yes" },
    { value: "N", label: "No" }
  ]

  const procedureLevelOptions = [
    { value: "MIN", label: "Minor" },
    { value: "MOD", label: "Moderate" },
    { value: "MAJ", label: "Major" }
  ]

  useEffect(() => {
    fetchProcedureData()
    fetchDepartmentData()
  }, [])

  useEffect(() => {
    if (showForm) {
      fetchDepartmentData()
    }
  }, [showForm])

  // Validate form
  useEffect(() => {
    const { procedureCode, procedureName, departmentId, opdAllowed, ipdAllowed, isNursing, procedureLevel } = formData
    setIsFormValid(
      procedureCode.trim() !== "" &&
      procedureName.trim() !== "" &&
      departmentId !== "" &&
      opdAllowed !== "" &&
      ipdAllowed !== "" &&
      isNursing !== "" &&
      procedureLevel !== ""
    )
  }, [formData])

  // Filter data based on search query
  const filteredProcedureData = procedureData.filter(procedure =>
    procedure.procedureCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    procedure.procedureName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchProcedureData = async () => {
    setLoading(true)
    try {
      const data = await getRequest(`${MAS_PROCEDURE}/getAll/0`)
      
      if (data.status === 200 && data.response) {
        setProcedureData(data.response)
        setTotalItems(data.response.length)
        setTotalPages(Math.ceil(data.response.length / DEFAULT_ITEMS_PER_PAGE))
      } else {
        console.error("Unexpected API response format:", data)
        setProcedureData([])
        setTotalItems(0)
        setTotalPages(0)
      }
    } catch (error) {
      console.error("Error fetching Procedure data:", error)
      setProcedureData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartmentData = async () => {
    try {
      const data = await getRequest(`${MAS_DEPARTMENT}/getAll/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        // Filter for OPD departments only
        const opdDepartments = data.response.filter(dept =>
          dept.departmentTypeName && dept.departmentTypeName.toUpperCase() === "OPD"
        )
        setDepartmentData(opdDepartments)
        return opdDepartments
      } else {
        console.error("Unexpected API response format:", data)
        setDepartmentData([])
        return []
      }
    } catch (error) {
      console.error("Error fetching Department data:", error)
      return []
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleEdit = async (item) => {
    setEditingProcedure(item)
    
    await fetchDepartmentData()
    
    setFormData({
      procedureCode: item.procedureCode || "",
      procedureName: item.procedureName || "",
      departmentId: item.departmentId?.toString() || "",
      opdAllowed: item.opdAllowed || "",
      ipdAllowed: item.ipdAllowed || "",
      isNursing: item.isNursing || "",
      procedureLevel: item.procedureLevel || ""
    })
    
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setProcess(true)
    if (!isFormValid) {
      setProcess(false)
      return
    }

    const payload = {
      procedureCode: formData.procedureCode,
      procedureName: formData.procedureName,
      departmentId: parseInt(formData.departmentId, 10),
      opdAllowed: formData.opdAllowed,
      ipdAllowed: formData.ipdAllowed,
      isNursing: formData.isNursing,
      procedureLevel: formData.procedureLevel
    }

    try {
      let response
      if (editingProcedure) {
        response = await putRequest(
          `${MAS_PROCEDURE}/update/${editingProcedure.procedureId}`,
          payload
        )
        if (response.status === 200) {
          setPopupMessage({
            message: "Procedure updated successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              resetForm()
              fetchProcedureData()
              setCurrentPage(1)
            }
          })
        } else {
          throw new Error(response.message || "Update failed")
        }
      } else {
        response = await postRequest(`${MAS_PROCEDURE}/create`, payload)
        if (response.status === 201 || response.status === 200) {
          setPopupMessage({
            message: "Procedure added successfully!",
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              resetForm()
              fetchProcedureData()
              setCurrentPage(1)
            }
          })
        } else {
          throw new Error(response.message || "Save failed")
        }
      }
    } catch (error) {
      console.error("Error saving Procedure:", error)
      showPopup(FAIL_TO_SAVE_CHANGES, "error")
    } finally {
      setProcess(false)
    }
  }

  const resetForm = () => {
    setEditingProcedure(null)
    setShowForm(false)
    setFormData({
      procedureCode: "",
      procedureName: "",
      departmentId: "",
      opdAllowed: "",
      ipdAllowed: "",
      isNursing: "",
      procedureLevel: ""
    })
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

  const handleSwitchChange = (id, name, newStatus) => {
    setConfirmDialog({ 
      isOpen: true, 
      procedureId: id, 
      newStatus, 
      procedureName: name 
    })
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.procedureId !== null) {
      setProcess(true)
      try {
        const response = await putRequest(
          `${MAS_PROCEDURE}/status/${confirmDialog.procedureId}?status=${confirmDialog.newStatus}`
        )

        if (response.status === 200) {
          setPopupMessage({
            message: `Procedure ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            type: "success",
            onClose: () => {
              setPopupMessage(null)
              fetchProcedureData()
              setCurrentPage(1)
            }
          })
        } else {
          throw new Error(response.message || "Failed to update status")
        }
      } catch (error) {
        console.error("Error updating status:", error)
        showPopup(FAIL_TO_UPDATE_STS, "error")
      } finally {
        setProcess(false)
      }
    }
    setConfirmDialog({ 
      isOpen: false, 
      procedureId: null, 
      newStatus: "", 
      procedureName: "" 
    })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }))
  }

  const handleSelectChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }))
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCurrentPage(1)
    fetchProcedureData()
  }

  const handleActivate = async () => {
    if (editingProcedure && editingProcedure.status === "n") {
      setProcess(true)
      try {
        const response = await putRequest(
          `${MAS_PROCEDURE}/status/${editingProcedure.procedureId}?status=y`
        )

        if (response.status === 200) {
          showPopup("Procedure activated successfully!", "success")
          resetForm()
          await fetchProcedureData()
          setCurrentPage(1)
        } else {
          throw new Error(response.message || "Failed to activate")
        }
      } catch (error) {
        console.error("Error activating procedure:", error)
        showPopup("Failed to activate procedure", "error")
      } finally {
        setProcess(false)
      }
    }
  }

  // Get current page items
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE
  const currentItems = filteredProcedureData.slice(indexOfFirstItem, indexOfLastItem)

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "N/A"
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return "N/A"
    }
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && <LoadingScreen />}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Procedure Master</h4>

              <div className="d-flex justify-content-between align-items-center gap-2">
                {!showForm && (
                  <>
                    <form className="d-inline-block searchform me-2" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by code or name"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleRefresh}
                    >
                      <i className="mdi mdi-refresh"></i> Show All
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setEditingProcedure(null)
                        setFormData({
                          procedureCode: "",
                          procedureName: "",
                          departmentId: "",
                          opdAllowed: "",
                          ipdAllowed: "",
                          isNursing: "",
                          procedureLevel: ""
                        })
                        setShowForm(true)
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                  </>
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
                          <th>Procedure Code</th>
                          <th>Procedure Name</th>
                          <th>Department</th>
                          <th>OPD Allowed</th>
                          <th>IPD Allowed</th>
                          <th>Is Nursing</th>
                          <th>Procedure Level</th>
                          <th>Status</th>
                          <th>Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => {
                            const levelLabel = procedureLevelOptions.find(
                              opt => opt.value === item.procedureLevel
                            )?.label || item.procedureLevel || "-"
                            
                            const opdLabel = item.opdAllowed === "Y" ? "Yes" : "No"
                            const ipdLabel = item.ipdAllowed === "Y" ? "Yes" : "No"
                            const nursingLabel = item.isNursing === "Y" ? "Yes" : "No"
                            
                            return (
                              <tr key={item.procedureId}>
                                <td>{item.procedureCode || '-'}</td>
                                <td style={{ textTransform: "capitalize" }}>{item.procedureName || '-'}</td>
                                <td>{item.departmentName || '-'}</td>
                                <td>{opdLabel}</td>
                                <td>{ipdLabel}</td>
                                <td>{nursingLabel}</td>
                                <td>{levelLabel}</td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={item.status === "y"}
                                      onChange={() => handleSwitchChange(
                                        item.procedureId, 
                                        item.procedureName, 
                                        item.status === "y" ? "n" : "y"
                                      )}
                                      id={`switch-${item.procedureId}`}
                                    />
                                    <label
                                      className="form-check-label px-0"
                                      htmlFor={`switch-${item.procedureId}`}
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
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredProcedureData.length > 0 && (
                    <Pagination
                      totalItems={filteredProcedureData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                <>
                  <form className="forms row" onSubmit={handleSave}>
                    <div className="d-flex justify-content-end mb-3">
                      <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        <i className="mdi mdi-arrow-left"></i> Back
                      </button>
                    </div>
                    <div className="row">
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Procedure Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="procedureCode"
                          placeholder="Enter procedure code"
                          onChange={handleInputChange}
                          value={formData.procedureCode}
                          maxLength={PROCEDURE_CODE_MAX_LENGTH}
                          required
                          disabled={process}
                        />
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Procedure Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="procedureName"
                          placeholder="Enter procedure name"
                          onChange={handleInputChange}
                          value={formData.procedureName}
                          maxLength={PROCEDURE_NAME_MAX_LENGTH}
                          required
                          disabled={process}
                        />
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Department <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="departmentId"
                          onChange={handleSelectChange}
                          value={formData.departmentId}
                          required
                          disabled={process}
                        >
                          <option value="">Select Department</option>
                          {departmentData.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          OPD Allowed <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="opdAllowed"
                          onChange={handleSelectChange}
                          value={formData.opdAllowed}
                          required
                          disabled={process}
                        >
                          <option value="">Select Option</option>
                          {yesNoOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          IPD Allowed <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="ipdAllowed"
                          onChange={handleSelectChange}
                          value={formData.ipdAllowed}
                          required
                          disabled={process}
                        >
                          <option value="">Select Option</option>
                          {yesNoOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Is Nursing <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="isNursing"
                          onChange={handleSelectChange}
                          value={formData.isNursing}
                          required
                          disabled={process}
                        >
                          <option value="">Select Option</option>
                          {yesNoOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group col-md-4 mt-3">
                        <label>
                          Procedure Level <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="procedureLevel"
                          onChange={handleSelectChange}
                          value={formData.procedureLevel}
                          required
                          disabled={process}
                        >
                          <option value="">Select Procedure Level</option>
                          {procedureLevelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group col-md-12 d-flex justify-content-end mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={process || !isFormValid}
                      >
                        {process ? "Processing..." : (editingProcedure ? 'Update' : 'Save')}
                      </button>
                      
                      {editingProcedure && editingProcedure.status === "n" && (
                        <button
                          type="button"
                          className="btn btn-success me-2"
                          onClick={handleActivate}
                          disabled={process}
                        >
                          Activate
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={resetForm}
                        disabled={process}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="btn-close" onClick={() => handleConfirm(false)} aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {confirmDialog.procedureName}
                          </strong>
                          {" "}procedure?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)} disabled={process}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)} disabled={process}>
                          {process ? "Processing..." : "Confirm"}
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

export default ProcedureMaster
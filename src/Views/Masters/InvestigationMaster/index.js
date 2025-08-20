"use client"

import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import { getRequest } from "../../../service/apiService"
import { 
  MAS_INVESTIGATION,
  MAS_DG_SAMPLE,
  DG_UOM,
  MAS_MAIN_CHARGE_CODE,
  MAS_SUB_CHARGE_CODE,
  DG_MAS_COLLECTION
} from "../../../config/apiConfig"

const InvestigationMaster = () => {
    const [investigations, setInvestigations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageInput, setPageInput] = useState("")
    const [selectedInvestigation, setSelectedInvestigation] = useState(null)
    const [formData, setFormData] = useState({
        investigationName: "",
        department: "",
        modality: "",
        sample: "",
        container: "",
        uom: "",
        resultType: "Select",
        minimumValue: "",
        maximumValue: "",
        loincCode: "",
        flag: "Select",
        confidential: false,
        pandemic: false,
        pandemicCases: "",
        status: "n",
    })
    const [confirmDialog, setConfirmDialog] = useState({ 
      isOpen: false, 
      investigationId: null, 
      newStatus: null 
    })
    const [dropdownOptions, setDropdownOptions] = useState({
      departments: [],
      modalities: [],
      samples: [],
      containers: [],
      uoms: []
    })
    const [popupMessage, setPopupMessage] = useState(null)

    const itemsPerPage = 3

    // Fetch all required data on component mount
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true)
          
          // Fetch all data in parallel
          const [
            investigationsRes,
            departmentsRes,
            modalitiesRes,
            samplesRes,
            containersRes,
            uomsRes
          ] = await Promise.all([
            getRequest(`${MAS_INVESTIGATION}/getAll/0`),
            getRequest(`${MAS_MAIN_CHARGE_CODE}/getAll/1`),
            getRequest(`${MAS_SUB_CHARGE_CODE}/getAll/1`),
            getRequest(`${MAS_DG_SAMPLE}/getAll/1`),
            getRequest(`${DG_MAS_COLLECTION}/getAll/1`),
            getRequest(`${DG_UOM}/getAll/1`)
          ])

          // Set investigations data
          if (investigationsRes && investigationsRes.response) {
            setInvestigations(investigationsRes.response.map(item => ({
              ...item,
              id: item.investigationId // Add id for consistency
            })))
          }

          // Set dropdown options
          setDropdownOptions({
            departments: departmentsRes?.response || [],
            modalities: modalitiesRes?.response || [],
            samples: samplesRes?.response || [],
            containers: containersRes?.response || [],
            uoms: uomsRes?.response || []
          })

        } catch (error) {
          console.error('Error fetching data:', error)
          showPopup("Failed to load initial data", "error")
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }, [])

    const showPopup = (message, type = "info") => {
      setPopupMessage({
        message,
        type,
        onClose: () => setPopupMessage(null)
      })
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1)
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        })
    }

    const handleReset = () => {
        setFormData({
            investigationName: "",
            department: "",
            modality: "",
            sample: "",
            container: "",
            uom: "",
            resultType: "Select",
            minimumValue: "",
            maximumValue: "",
            loincCode: "",
            flag: "Select",
            confidential: false,
            pandemic: false,
            pandemicCases: "",
            status: "n",
        })
        setSelectedInvestigation(null)
    }

    const handleStatusToggle = (id) => {
        const investigation = investigations.find((item) => item.investigationId === id)
        if (investigation) {
            const newStatus = investigation.status === "y" ? "n" : "y"
            setConfirmDialog({ isOpen: true, investigationId: id, newStatus })
        }
    }

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.investigationId !== null) {
          try {
            setLoading(true)
            
            // Here you would typically make an API call to update the status
            // const response = await putRequest(`${MAS_INVESTIGATION}/status/${confirmDialog.investigationId}`, {
            //   status: confirmDialog.newStatus
            // })
            
            // For now, we'll update the local state
            const updatedInvestigations = investigations.map((item) => {
                if (item.investigationId === confirmDialog.investigationId) {
                    return { ...item, status: confirmDialog.newStatus }
                }
                return item
            })

            setInvestigations(updatedInvestigations)

            // Update the selected investigation and form data if it's currently selected
            if (selectedInvestigation && selectedInvestigation.investigationId === confirmDialog.investigationId) {
                setSelectedInvestigation({ ...selectedInvestigation, status: confirmDialog.newStatus })
                setFormData({ ...formData, status: confirmDialog.newStatus })
            }

            showPopup(`Investigation ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`, "success")
          } catch (error) {
            console.error('Error updating status:', error)
            showPopup("Failed to update investigation status", "error")
          } finally {
            setLoading(false)
          }
        }
        setConfirmDialog({ isOpen: false, investigationId: null, newStatus: null })
    }

    const handleRowClick = (investigation) => {
        setSelectedInvestigation(investigation)
        setFormData({
            investigationName: investigation.investigationName || "",
            department: investigation.mainChargeCodeName || "",
            modality: investigation.subChargeCodeName || "",
            sample: investigation.sampleName || "",
            container: investigation.collectionName || "",
            uom: investigation.uomName || "",
            resultType: investigation.multipleResults || "Select",
            minimumValue: investigation.minNormalValue || "",
            maximumValue: investigation.maxNormalValue || "",
            loincCode: investigation.hicCode || "",
            flag: "Select",
            confidential: investigation.confidential === "y" || false,
            pandemic: false,
            pandemicCases: "",
            status: investigation.status || "n",
        })
    }

    const handleSubmit = async () => {
      if (!selectedInvestigation) return
      
      try {
        setLoading(true)
        
        // Here you would typically make an API call to save the changes
        // const response = await putRequest(`${MAS_INVESTIGATION}/update/${selectedInvestigation.investigationId}`, {
        //   investigationName: formData.investigationName,
        //   mainChargeCodeName: formData.department,
        //   subChargeCodeName: formData.modality,
        //   sampleName: formData.sample,
        //   collectionName: formData.container,
        //   uomName: formData.uom,
        //   multipleResults: formData.resultType,
        //   minNormalValue: formData.minimumValue,
        //   maxNormalValue: formData.maximumValue,
        //   hicCode: formData.loincCode,
        //   confidential: formData.confidential ? "y" : "n",
        //   status: formData.status
        // })
        
        // For now, we'll update the local state
        const updatedInvestigations = investigations.map(item => 
          item.investigationId === selectedInvestigation.investigationId ? { 
            ...item, 
            investigationName: formData.investigationName,
            mainChargeCodeName: formData.department,
            subChargeCodeName: formData.modality,
            sampleName: formData.sample,
            collectionName: formData.container,
            uomName: formData.uom,
            multipleResults: formData.resultType,
            minNormalValue: formData.minimumValue,
            maxNormalValue: formData.maximumValue,
            hicCode: formData.loincCode,
            confidential: formData.confidential ? "y" : "n",
            status: formData.status
          } : item
        )
        
        setInvestigations(updatedInvestigations)
        showPopup("Investigation updated successfully!", "success")
      } catch (error) {
        console.error('Error saving investigation:', error)
        showPopup("Failed to save investigation", "error")
      } finally {
        setLoading(false)
      }
    }

    const filteredInvestigations = investigations.filter(
        (item) =>
            item.investigationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subChargeCodeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sampleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.uomName?.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const filteredTotalPages = Math.ceil(filteredInvestigations.length / itemsPerPage)
    const currentItems = filteredInvestigations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handlePageNavigation = () => {
        const pageNumber = Number.parseInt(pageInput, 10)
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber)
        } else {
            showPopup("Please enter a valid page number", "warning")
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

    if (loading && investigations.length === 0) {
      return <LoadingScreen message="Loading investigation data..." />
    }

    return (
        <div className="content-wrapper">
            {popupMessage && (
              <Popup 
                message={popupMessage.message} 
                type={popupMessage.type} 
                onClose={popupMessage.onClose} 
              />
            )}
            {loading && <LoadingScreen overlay />}
            
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header ">
                            <h4 className="card-title p-2">Investigation Master</h4>
                            <div className="d-flex flex-wrap mt-3 mx-0">
                                <div className="d-flex align-items-center col-md-7">
                                    <div className="d-flex align-items-center col-md-7">
                                        <label className="flex-shrink-0 me-2 ms-3">
                                            Investigation Name<span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Investigation Name"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                        />
                                    </div>

                                    <div className="col-md-2 d-flex me-2">
                                        <button type="button" className="btn btn-primary ms-2" onClick={() => setSearchQuery("")}>
                                            <i className="mdi mdi-magnify"></i> Search
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-4 d-flex justify-content-end">
                                    <button type="button" className="btn btn-primary ms-2" onClick={() => setSearchQuery("")}>
                                        <i className="mdi mdi-magnify"></i> Show All
                                    </button>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Investigation Name</th>
                                                <th>Modality</th>
                                                <th>Sample</th>
                                                <th>UOM</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                              currentItems.map((item) => (
                                                  <tr
                                                      key={item.investigationId}
                                                      onClick={() => handleRowClick(item)}
                                                      className={selectedInvestigation && selectedInvestigation.investigationId === item.investigationId ? "table-primary" : ""}
                                                      style={{ cursor: "pointer" }}
                                                  >
                                                      <td>{item.investigationName}</td>
                                                      <td>{item.subChargeCodeName || "-"}</td>
                                                      <td>{item.sampleName || "-"}</td>
                                                      <td>{item.uomName || "-"}</td>
                                                      <td onClick={(e) => e.stopPropagation()}>
                                                          <div className="form-check form-switch">
                                                              <input
                                                                  className="form-check-input"
                                                                  type="checkbox"
                                                                  checked={item.status === "y"}
                                                                  onChange={() => handleStatusToggle(item.investigationId)}
                                                                  id={`switch-${item.investigationId}`}
                                                              />
                                                              <label className="form-check-label" htmlFor={`switch-${item.investigationId}`}>
                                                                  {item.status === "y" ? "Active" : "Deactivated"}
                                                              </label>
                                                          </div>
                                                      </td>
                                                  </tr>
                                              ))
                                            ) : (
                                              <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                  {loading ? "Loading..." : "No investigations found"}
                                                </td>
                                              </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Form Section */}
                                <div className="row mb-3 mt-3">
                                    <div className="col-sm-12">
                                        <div className="card shadow mb-3">
                                            <div className="card-body">
                                                <div className="row g-3 align-items-center">
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Investigation Name<span className="text-danger">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="investigationName"
                                                                value={formData.investigationName}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Department<span className="text-danger">*</span>
                                                            </label>
                                                            <select 
                                                              className="form-select" 
                                                              name="department" 
                                                              value={formData.department} 
                                                              onChange={handleInputChange}
                                                            >
                                                              <option value="">Select Department</option>
                                                              {dropdownOptions.departments.map((dept) => (
                                                                <option key={dept.chargecodeId} value={dept.chargecodeName}>
                                                                  {dept.chargecodeName}
                                                                </option>
                                                              ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Modality<span className="text-danger">*</span>
                                                            </label>
                                                            <select 
                                                              className="form-select" 
                                                              name="modality" 
                                                              value={formData.modality} 
                                                              onChange={handleInputChange}
                                                            >
                                                              <option value="">Select Modality</option>
                                                              {dropdownOptions.modalities.map((mod) => (
                                                                <option key={mod.subId} value={mod.subName}>
                                                                  {mod.subName}
                                                                </option>
                                                              ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Sample<span className="text-danger">*</span>
                                                            </label>
                                                            <select 
                                                              className="form-select" 
                                                              name="sample" 
                                                              value={formData.sample} 
                                                              onChange={handleInputChange}
                                                            >
                                                              <option value="">Select Sample</option>
                                                              {dropdownOptions.samples.map((sample) => (
                                                                <option key={sample.Id} value={sample.sampleDescription}>
                                                                  {sample.sampleDescription}
                                                                </option>
                                                              ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Container<span className="text-danger">*</span>
                                                            </label>
                                                            <select 
                                                              className="form-select" 
                                                              name="container" 
                                                              value={formData.container} 
                                                              onChange={handleInputChange}
                                                            >
                                                              <option value="">Select Container</option>
                                                              {dropdownOptions.containers.map((cont) => (
                                                                <option key={cont.collectionId} value={cont.collectionName}>
                                                                  {cont.collectionName}
                                                                </option>
                                                              ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                UOM<span className="text-danger">*</span>
                                                            </label>
                                                            <select 
                                                              className="form-select" 
                                                              name="uom" 
                                                              value={formData.uom} 
                                                              onChange={handleInputChange}
                                                            >
                                                              <option value="">Select UOM</option>
                                                              {dropdownOptions.uoms.map((uom) => (
                                                                <option key={uom.id} value={uom.name}>
                                                                  {uom.name}
                                                                </option>
                                                              ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Result Type<span className="text-danger">*</span>
                                                            </label>
                                                            <select 
                                                              className="form-select" 
                                                              name="resultType" 
                                                              value={formData.resultType} 
                                                              onChange={handleInputChange}
                                                            >
                                                                <option value="Select">Select</option>
                                                                <option value="Multiple">Multiple</option>
                                                                <option value="Single">Single</option>
                                                                <option value="Range">Range</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Minimum Value</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Minimum Value"
                                                                name="minimumValue"
                                                                value={formData.minimumValue}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Maximum Value</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Maximum Value"
                                                                name="maximumValue"
                                                                value={formData.maximumValue}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">LOINC Code</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="LOINC Code"
                                                                name="loincCode"
                                                                value={formData.loincCode}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label fw-bold mb-1">
                                                                Flag<span className="text-danger">*</span>
                                                            </label>
                                                            <select 
                                                              className="form-select" 
                                                              name="flag" 
                                                              value={formData.flag} 
                                                              onChange={handleInputChange}
                                                            >
                                                                <option value="Select">Select</option>
                                                                <option value="Normal">Normal</option>
                                                                <option value="Critical">Critical</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Options</label>
                                                            <div className="form-control d-flex align-items-center">
                                                                <div className="form-check me-4">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id="confidential"
                                                                        name="confidential"
                                                                        checked={formData.confidential}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                    <label className="form-check-label" htmlFor="confidential">
                                                                        Confidential
                                                                    </label>
                                                                </div>
                                                                <div className="form-check">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id="pandemic"
                                                                        name="pandemic"
                                                                        checked={formData.pandemic}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                    <label className="form-check-label" htmlFor="pandemic">
                                                                        Pandemic
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-2">
                                                            <label className="form-label mb-1">Pandemic Cases</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Pandemic Cases"
                                                                name="pandemicCases"
                                                                value={formData.pandemicCases}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="col-12 text-end mt-2 mb-3">
                                                        <button 
                                                          className="btn btn-success me-2" 
                                                          onClick={handleSubmit}
                                                          disabled={!selectedInvestigation || loading}
                                                        >
                                                          {loading ? "Saving..." : "Save"}
                                                        </button>
                                                        <button 
                                                          className="btn btn-secondary" 
                                                          onClick={handleReset}
                                                          disabled={loading}
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Modal */}
                                {confirmDialog.isOpen && (
                                    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                        <div className="modal-dialog" role="document">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <h5 className="modal-title">Confirm Status Change</h5>
                                                    <button type="button" className="btn-close" onClick={() => handleConfirm(false)}></button>
                                                </div>
                                                <div className="modal-body">
                                                    <p>
                                                        Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                                                        <strong>{investigations.find((item) => item.investigationId === confirmDialog.investigationId)?.investigationName}</strong>?
                                                    </p>
                                                </div>
                                                <div className="modal-footer">
                                                    <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                                                        Cancel
                                                    </button>
                                                    <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                                                        Confirm
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pagination */}
                                <nav className="d-flex justify-content-between align-items-center mt-2">
                                    <div>
                                        <span>
                                            Page {currentPage} of {filteredTotalPages} | Total Records: {filteredInvestigations.length}
                                        </span>
                                    </div>
                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
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
                                        />
                                        <button className="btn btn-primary" onClick={handlePageNavigation}>
                                            Go
                                        </button>
                                    </div>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InvestigationMaster
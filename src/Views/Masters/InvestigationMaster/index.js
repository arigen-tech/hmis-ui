import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import { getRequest, postRequest, putRequest } from "../../../service/apiService"
import {
  MAS_INVESTIGATION,
  MAS_DG_SAMPLE,
  DG_UOM,
  MAS_MAIN_CHARGE_CODE,
  MAS_SUB_CHARGE_CODE,
  DG_MAS_COLLECTION,
  DG_MAS_INVESTIGATION_CATEGORY,
  DG_MAS_INVESTIGATION_METHODOLOGY,
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
    departmentId: "",
    departmentName: "",
    modalityId: "",
    modalityName: "",
    sampleId: "",
    sampleName: "",
    containerId: "",
    containerName: "",
    categoryId:"",
    categoryName:"",
    methodId:"",
    methodName:"",
    uomId: "",
    uomName: "",
    resultType: "Select",
    minimumValue: "",
    maximumValue: "",
    genderApplicable: "Select",
    loincCode: "",
    flag: "Select",
    confidential: false,
    pandemic: false,
    pandemicCases: "",
    status: "n",
  })
  const [subInvestigations, setSubInvestigations] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    investigationId: null,
    newStatus: null,
  })
  const [dropdownOptions, setDropdownOptions] = useState({
    departments: [],
    modalities: [],
    samples: [],
    containers: [],
    uoms: [],
    categories:[],
    methodologies:[],
  })
  const [popupMessage, setPopupMessage] = useState(null)

  const itemsPerPage = 3

  const navigate = useNavigate()

  // Gender mapping functions
  const mapGenderToDisplay = (genderCode) => {
    const genderMap = {
      'm': 'Male',
      'f': 'Female', 
      'c': 'Common'
    }
    return genderMap[genderCode?.toLowerCase()] || "Select"
  }

  const mapGenderToCode = (genderDisplay) => {
    const genderMap = {
      'Male': 'm',
      'Female': 'f',
      'Common': 'c'
    }
    return genderMap[genderDisplay] || null
  }

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [investigationsRes, departmentsRes, modalitiesRes, samplesRes, containersRes, uomsRes,methodologiesRes,categoriesRes] =
          await Promise.all([
            getRequest(`${MAS_INVESTIGATION}/getAll/0`),
            getRequest(`${MAS_MAIN_CHARGE_CODE}/getAll/1`),
            getRequest(`${MAS_SUB_CHARGE_CODE}/getAll/1`),
            getRequest(`${MAS_DG_SAMPLE}/getAll/1`),
            getRequest(`${DG_MAS_COLLECTION}/getAll/1`),
            getRequest(`${DG_UOM}/getAll/1`),
            getRequest(`${DG_MAS_INVESTIGATION_METHODOLOGY}/findAll`),
            getRequest(`${DG_MAS_INVESTIGATION_CATEGORY}/findAll`),
          ])

        // Set investigations data
        if (investigationsRes && investigationsRes.response) {
          setInvestigations(
            investigationsRes.response.map((item) => ({
              ...item,
              id: item.investigationId, // Add id for consistency
            })),
          )
        }

        setDropdownOptions({
          departments:
            departmentsRes?.response?.map((dept) => ({
              id: dept.chargecodeId,
              name: dept.chargecodeName,
            })) || [],
          modalities:
            modalitiesRes?.response?.map((mod) => ({
              id: mod.subId,
              name: mod.subName,
            })) || [],
          samples:
            samplesRes?.response?.map((sample) => ({
              id: sample.Id || sample.id || sample.sampleId,
              name: sample.sampleDescription || sample.name || sample.sampleName,
            })) || [],
          containers:
            containersRes?.response?.map((cont) => ({
              id: cont.collectionId || cont.id,
              name: cont.collectionName || cont.name,
            })) || [],
          uoms:
            uomsRes?.response?.map((uom) => ({
              id: uom.id,
              name: uom.name,
            })) || [],
            methodologies:
            methodologiesRes?.response?.map((method) => ({
              id: method.methodId,
              name: method.methodName,
            })) || [],
            categories:
            categoriesRes?.response?.map((category) => ({
              id: category.categoryId,
              name: category.categoryName,
            })) || [],
        })
      } catch (error) {
        console.error("Error fetching data:", error)
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
      onClose: () => setPopupMessage(null),
    })
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const getSelectedOption = (prefix, value) => {
    const optionsMap = {
      department: dropdownOptions.departments,
      modality: dropdownOptions.modalities,
      sample: dropdownOptions.samples,
      container: dropdownOptions.containers,
      uom: dropdownOptions.uoms,
      methodology: dropdownOptions.methodologies,
      category:dropdownOptions.categories,
    }

    const options = optionsMap[prefix] || []

    // Safely handle undefined or null values
    if (!value && value !== 0) {
      return null
    }

    return options.find((option) => {
      if (!option || !option.id) return false
      return option.id.toString() === value.toString()
    })
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    // For dropdowns that need to update both ID and name
    if (name.endsWith("Id")) {
      const prefix = name.replace("Id", "")
      const selectedOption = getSelectedOption(prefix, value)

      setFormData({
        ...formData,
        [name]: value,
        [`${prefix}Name`]: selectedOption ? selectedOption.name : "",
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      })
    }
  }

  const handleReset = () => {
    setFormData({
      investigationName: "",
      departmentId: "",
      departmentName: "",
      modalityId: "",
      modalityName: "",
      sampleId: "",
      sampleName: "",
      containerId: "",
      containerName: "",
      categoryId:"",
    categoryName:"",
    methodId:"",
    methodName:"",
      uomId: "",
      uomName: "",
      resultType: "Select",
      minimumValue: "",
      maximumValue: "",
      genderApplicable: "Select",
      loincCode: "",
      flag: "Select",
      confidential: false,
      pandemic: false,
      pandemicCases: "",
      status: "n",
    })
    setSelectedInvestigation(null)
    setSubInvestigations([])
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

        // Call API to update status
        const response = await putRequest(`${MAS_INVESTIGATION}/change-status/${confirmDialog.investigationId}?status=${confirmDialog.newStatus}`)

        if (response && response.status === 200) {
          // Update local state
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

          showPopup(
            `Investigation ${confirmDialog.newStatus === "y" ? "activated" : "deactivated"} successfully!`,
            "success",
          )
        } else {
          throw new Error(response?.message || "Failed to update status")
        }
      } catch (error) {
        console.error("Error updating status:", error)
        showPopup("Failed to update investigation status", "error")
      } finally {
        setLoading(false)
      }
    }
    setConfirmDialog({ isOpen: false, investigationId: null, newStatus: null })
  }

  const handleRowClick = (investigation) => {
    const mapInvestigationTypeToResultType = (investigationType) => {
      const typeMap = {
        s: "Single",
        r: "Range",
        m: "Multiple",
        v: "Single" // Assuming 'v' is for Single value
      }
      return typeMap[investigationType?.toLowerCase()] || "Select"
    }

    setSelectedInvestigation(investigation)
    setFormData({
      investigationName: investigation.investigationName || "",
      departmentId: investigation.mainChargeCodeId || "",
      departmentName: investigation.mainChargeCodeName || "",
      modalityId: investigation.subChargeCodeId || "",
      modalityName: investigation.subChargeCodeName || "",
      sampleId: investigation.sampleId || "",
      sampleName: investigation.sampleName || "",
      containerId: investigation.collectionId || "",
      containerName: investigation.collectionName || "",
      methodId:investigation.methodId||'',
      methodName:investigation.methodName||'',
      categoryId:investigation.categoryId||'',
      categoryName:investigation.categoryName||'',
      uomId: investigation.uomId || "",
      uomName: investigation.uomName || "",
      resultType: mapInvestigationTypeToResultType(investigation.investigationType) || "Select",
      minimumValue: investigation.minNormalValue || "",
      maximumValue: investigation.maxNormalValue || "",
      genderApplicable: mapGenderToDisplay(investigation.genderApplicable) || "Select",
      loincCode: investigation.hicCode || "", // Fixed: using hicCode from API
      flag: "Select",
      confidential: investigation.confidential === "y" || false,
      pandemic: false,
      pandemicCases: "",
      status: investigation.status || "n",
    })

    // Store sub-investigation data
    setSubInvestigations(investigation.subInvestigationResponseList || [])
  }

  const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    setLoading(true)

    // Map gender to code before sending to API
    const genderCode = mapGenderToCode(formData.genderApplicable)

    // Prepare the common request payload with correct API field names
    const commonPayload = {
      investigationName: formData.investigationName,
      mainChargeCodeId: Number.parseInt(formData.departmentId) || 0,
      subChargeCodeId: Number.parseInt(formData.modalityId) || 0,
      sampleId: Number.parseInt(formData.sampleId) || 0,
      collectionId: Number.parseInt(formData.containerId) || 0,
      methodId:Number.parseInt(formData.methodId)||0,
      categoryId:Number.parseInt(formData.categoryId)||0,
      // For Multiple result type, UOM can be null, for others it's required
      uomId: formData.resultType === "Multiple" ? 
        (formData.uomId ? Number.parseInt(formData.uomId) : null) : 
        Number.parseInt(formData.uomId) || 0,
      investigationType: formData.resultType.toLowerCase().charAt(0),
      maxNormalValue: formData.maximumValue || null,
      minNormalValue: formData.minimumValue || null,
      multipleResults: formData.resultType === "Multiple" ? "y" : "n",
      hicCode: formData.loincCode,
      confidential: formData.confidential ? "y" : "n",
      status: formData.status,
      genderApplicable: genderCode,
      // Include additional fields that might be required
      appearInDischargeSummary: selectedInvestigation?.appearInDischargeSummary || null,
      testOrderNo: selectedInvestigation?.testOrderNo || null,
      numericOrString: selectedInvestigation?.numericOrString || null,
    }

    let response

    if (selectedInvestigation) {
      // Update existing investigation
      response = await putRequest(
        `${MAS_INVESTIGATION}/update-single-investigation/${selectedInvestigation.investigationId}`,
        commonPayload
      )
    } else {
      // Create new investigation
      response = await postRequest(`${MAS_INVESTIGATION}/create-investigation`, commonPayload)
    }

    if (response && response.status === 200) {
      // Refresh the investigations list
      const investigationsRes = await getRequest(`${MAS_INVESTIGATION}/getAll/0`)
      if (investigationsRes && investigationsRes.response) {
        setInvestigations(
          investigationsRes.response.map((item) => ({
            ...item,
            id: item.investigationId,
          })),
        )
      }

      if (selectedInvestigation) {
        showPopup("Investigation updated successfully!", "success")
      } else {
        showPopup("Investigation created successfully!", "success")
        handleReset() // Reset form after successful creation
      }
    } else {
      throw new Error(response?.message || `Failed to ${selectedInvestigation ? "update" : "create"} investigation`)
    }
  } catch (error) {
    console.error("Error saving investigation:", error)
    showPopup(`Failed to ${selectedInvestigation ? "update" : "create"} investigation`, "error")
  } finally {
    setLoading(false)
  }
}

  const validateForm = () => {
  if (!formData.investigationName.trim()) {
    showPopup("Investigation Name is required", "error")
    return false
  }
  if (!formData.departmentId) {
    showPopup("Department is required", "error")
    return false
  }
  if (!formData.modalityId) {
    showPopup("Modality is required", "error")
    return false
  }
  if (!formData.sampleId) {
    showPopup("Sample is required", "error")
    return false
  }
  if (!formData.containerId) {
    showPopup("Container is required", "error")
    return false
  }
  // Make UOM required only for Single and Range result types, optional for Multiple
  if (formData.resultType !== "Multiple" && !formData.uomId) {
    showPopup("UOM is required for Single and Range result types", "error")
    return false
  }
  if (formData.resultType === "Select") {
    showPopup("Result Type is required", "error")
    return false
  }
  if (formData.genderApplicable === "Select") {
    showPopup("Gender Applicable is required", "error")
    return false
  }
  if (!formData.methodId) {
    showPopup("Investigation Methodology is required", "error")
    return false
  }
  if (!formData.categoryId) {
    showPopup("Investigation Category is required", "error")
    return false
  }
  if (!formData.containerId) {
    showPopup("Container is required", "error")
    return false
  }
  return true
}

  const handleNavigateToSubInvestigations = () => {
    if (!selectedInvestigation) {
      showPopup("Please select an investigation first", "error")
      return
    }

    navigate("/investigation-multiple-results", {
      state: {
        investigationId: selectedInvestigation.investigationId,
        investigationName: selectedInvestigation.investigationName,
        subInvestigations: subInvestigations,
        mainChargeCodeId: formData.departmentId,
        subChargeCodeId: formData.modalityId,
        sampleId: formData.sampleId,
        uomId: formData.uomId,
        collectionId: formData.containerId,
        methodId:formData.methodId,
        categoryId:formData.categoryId,
        genderApplicable: formData.genderApplicable
      }
    })
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
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
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
                        <th>Gender</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((item) => (
                          <tr
                            key={item.investigationId}
                            onClick={() => handleRowClick(item)}
                            className={
                              selectedInvestigation && selectedInvestigation.investigationId === item.investigationId
                                ? "table-primary"
                                : ""
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <td>{item.investigationName}</td>
                            <td>{item.subChargeCodeName || "-"}</td>
                            <td>{item.sampleName || "-"}</td>
                            <td>{item.uomName || "-"}</td>
                            <td>{mapGenderToDisplay(item.genderApplicable) || "-"}</td>
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
                          <td colSpan="6" className="text-center py-4">
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
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleInputChange}
                              >
                                <option value="">Select Department</option>
                                {dropdownOptions.departments.map((dept) => (
                                  <option key={dept.id} value={dept.id}>
                                    {dept.name}
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
                                name="modalityId"
                                value={formData.modalityId}
                                onChange={handleInputChange}
                              >
                                <option value="">Select Modality</option>
                                {dropdownOptions.modalities.map((mod) => (
                                  <option key={mod.id} value={mod.id}>
                                    {mod.name}
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
                                name="sampleId"
                                value={formData.sampleId}
                                onChange={handleInputChange}
                              >
                                <option value="">Select Sample</option>
                                {dropdownOptions.samples.map((sample) => (
                                  <option key={sample.id} value={sample.id}>
                                    {sample.name}
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
                                name="containerId"
                                value={formData.containerId}
                                onChange={handleInputChange}
                              >
                                <option value="">Select Container</option>
                                {dropdownOptions.containers.map((cont) => (
                                  <option key={cont.id} value={cont.id}>
                                    {cont.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>


<div className="col-md-4">
  <div className="mb-2">
    <label className="form-label fw-bold mb-1">
      Methodology <span className="text-danger">*</span>
     </label>
    <select
      className="form-select"
      name="methodId"
      value={formData.methodId}
      onChange={handleInputChange}
    >
      <option value="">Select Methodology </option>
      {dropdownOptions.methodologies.map((cont)=>(
        <option key={cont.id} value={cont.id}>
          {cont.name}
        </option>
      ))}
      
    </select>
  </div>
</div>

<div className="col-md-4">
  <div className="mb-2">
    <label className="form-label fw-bold mb-1">
      Category <span className="text-danger">*</span>
     </label>
    <select
      className="form-select"
      name="categoryId"
      value={formData.categoryId}
      onChange={handleInputChange}
    >
      <option value="">Select Category </option>
      {dropdownOptions.categories.map((cont)=>(
        <option key={cont.id} value={cont.id}>
          {cont.name}
        </option>
      ))}
      
    </select>
  </div>
</div>


                          <div className="col-md-4">
  <div className="mb-2">
    <label className="form-label fw-bold mb-1">
      UOM
      {formData.resultType !== "Multiple" && <span className="text-danger">*</span>}
      {formData.resultType === "Multiple" && <span className="text-muted"> (Optional)</span>}
    </label>
    <select
      className="form-select"
      name="uomId"
      value={formData.uomId}
      onChange={handleInputChange}
    >
      <option value="">Select UOM</option>
      {dropdownOptions.uoms.map((uom) => (
        <option key={uom.id} value={uom.id}>
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
                              <div className="d-flex align-items-center">
                                <select
                                  className="form-select flex-grow-1"
                                  name="resultType"
                                  value={formData.resultType}
                                  onChange={handleInputChange}
                                >
                                  <option value="Select">Select</option>
                                  <option value="Multiple">Multiple</option>
                                  <option value="Single">Single</option>
                                  <option value="Range">Range</option>
                                </select>
                                {selectedInvestigation && formData.resultType === "Multiple" && (
                                  <button
                                    type="button"
                                    className="btn btn-success ms-2"
                                    onClick={handleNavigateToSubInvestigations}
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
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
                              <label className="form-label fw-bold mb-1">
                                Gender Applicable<span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select"
                                name="genderApplicable"
                                value={formData.genderApplicable}
                                onChange={handleInputChange}
                              >
                                <option value="Select">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Common">Common</option>
                              </select>
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
                              <label className="form-label fw-bold mb-1">Flag</label>
                              <select
                                className="form-select"
                                name="flag"
                                value={formData.flag}
                                onChange={handleInputChange}
                              >
                                <option value="Select">Select</option>
                                <option value="Normal">Internal</option>
                                <option value="Critical">External</option>
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
                            <button className="btn btn-success me-2" onClick={handleSubmit} disabled={loading}>
                              {loading ? "Saving..." : selectedInvestigation ? "Update" : "Save"}
                            </button>
                            <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
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
                  <div
                    className="modal d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  >
                    <div className="modal-dialog" role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Confirm Status Change</h5>
                          <button type="button" className="btn-close" onClick={() => handleConfirm(false)}></button>
                        </div>
                        <div className="modal-body">
                          <p>
                            Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                            <strong>
                              {
                                investigations.find((item) => item.investigationId === confirmDialog.investigationId)
                                  ?.investigationName
                              }
                            </strong>
                            ?
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
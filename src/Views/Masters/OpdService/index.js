import { useState } from "react"
import Popup from "../../../Components/popup"

const OPDServiceMaster = () => {
  const [serviceList, setServiceList] = useState([
    {
      id: 1,
      service_code: "OPD001",
      service_name: "OPD Consultation - Ortho",
      base_tariff: 500.0,
      service_category: "consultation",
      department: "Orthopedics" ,
      doctor: "Dr. Smith" ,
      from_date: "2024-01-01",
      to_date: "2024-12-31",
      status: "y",
    },
    {
      id: 2,
      service_code: "OPD002",
      service_name: "OPD Consultation - Nephro",
      base_tariff: 600.0,
      service_category: "consultation",
      department:  "Nephrology" ,
      doctor:  "Dr. Johnson" ,
      from_date: "2024-01-01",
      to_date: "2024-12-31",
      status: "y",
    },
    {
      id: 3,
      service_code: "OPD003",
      service_name: "OPD Consultation - Cardiology",
      base_tariff: 700.0,
      service_category: "consultation",
      department:  "Cardiology" ,
      doctor: "Dr. Lee" ,
      from_date: "2024-01-01",
      to_date: "2024-12-31",
      status: "y",
    },
    {
      id: 4,
      service_code: "OPD004",
      service_name: "OPD Consultation - General",
      base_tariff: 400.0,
      service_category: "diagnostic",
      department: "General Medicine" ,
      doctor: "Dr. Wilson" ,
      from_date: "2024-01-01",
      to_date: "2024-12-31",
      status: "n",
    },
    {
      id: 5,
      service_code: "OPD005",
      service_name: "OPD Emergency Consultation",
      base_tariff: 800.0,
      service_category: "emergency",
      department:   "Emergency" ,
      doctor:  "Dr. Brown" ,
      from_date: "2024-01-01",
      to_date: "2024-12-31",
      status: "y",
    },
  ])

  const serviceCategories = [
    { value: "consultation", label: "Consultation" },
    { value: "diagnostic", label: "Diagnostic" },
    { value: "procedure", label: "Procedure" },
    { value: "emergency", label: "Emergency" },
    { value: "follow-up", label: "Follow-up" },
  ]

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, serviceId: null, newStatus: false })
  const [formData, setFormData] = useState({
    serviceCode: "",
    serviceName: "",
    baseTariff: "",
    serviceCategory: "",
    departmentId: "",
    doctorId: "",
    fromDate: "",
    toDate: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const departments = [
    { id: 201, name: "Orthopedics" },
    { id: 202, name: "Nephrology" },
    { id: 203, name: "Cardiology" },
    { id: 204, name: "General Medicine" },
    { id: 205, name: "Emergency" },
    { id: 206, name: "Pediatrics" },
    { id: 207, name: "Neurology" },
  ]

  const doctors = [
    { id: 101, name: "Dr. Smith" },
    { id: 102, name: "Dr. Johnson" },
    { id: 103, name: "Dr. Lee" },
    { id: 104, name: "Dr. Wilson" },
    { id: 105, name: "Dr. Brown" },
    { id: 106, name: "Dr. Davis" },
    { id: 107, name: "Dr. Miller" },
  ]

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredServiceList = serviceList.filter(
    (item) =>
      item.service_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredServiceList.length / itemsPerPage)

  const currentItems = filteredServiceList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setEditingService(item)
    setShowForm(true)
    setFormData({
      serviceCode: item.service_code,
      serviceName: item.service_name,
      baseTariff: item.base_tariff.toString(),
      serviceCategory: item.service_category,
      departmentId: item.department.id.toString(),
      doctorId: item.doctor.id.toString(),
      fromDate: item.from_date,
      toDate: item.to_date,
    })
    setIsFormValid(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    const selectedDepartment = departments.find((dept) => dept.id === Number.parseInt(formData.departmentId))
    const selectedDoctor = doctors.find((doc) => doc.id === Number.parseInt(formData.doctorId))

    if (editingService) {
      setServiceList(
        serviceList.map((item) =>
          item.id === editingService.id
            ? {
                ...item,
                service_code: formData.serviceCode,
                service_name: formData.serviceName,
                base_tariff: Number.parseFloat(formData.baseTariff),
                service_category: formData.serviceCategory,
                department: selectedDepartment,
                doctor: selectedDoctor,
                from_date: formData.fromDate,
                to_date: formData.toDate,
              }
            : item,
        ),
      )
      showPopup("OPD Service updated successfully!", "success")
    } else {
      const newService = {
        id: Date.now(),
        service_code: formData.serviceCode,
        service_name: formData.serviceName,
        base_tariff: Number.parseFloat(formData.baseTariff),
        service_category: formData.serviceCategory,
        department: selectedDepartment,
        doctor: selectedDoctor,
        from_date: formData.fromDate,
        to_date: formData.toDate,
        status: "y",
      }
      setServiceList([...serviceList, newService])
      showPopup("New OPD Service added successfully!", "success")
    }

    setEditingService(null)
    setShowForm(false)
    setFormData({
      serviceCode: "",
      serviceName: "",
      baseTariff: "",
      serviceCategory: "",
      departmentId: "",
      doctorId: "",
      fromDate: "",
      toDate: "",
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

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, serviceId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.serviceId !== null) {
      setServiceList((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.serviceId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )
    }
    setConfirmDialog({ isOpen: false, serviceId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.serviceCode &&
        !!updatedFormData.serviceName &&
        !!updatedFormData.baseTariff &&
        !!updatedFormData.serviceCategory &&
        !!updatedFormData.departmentId &&
        !!updatedFormData.doctorId &&
        !!updatedFormData.fromDate &&
        !!updatedFormData.toDate,
    )
  }

  const handleSelectChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.serviceCode &&
        !!updatedFormData.serviceName &&
        !!updatedFormData.baseTariff &&
        !!updatedFormData.serviceCategory &&
        !!updatedFormData.departmentId &&
        !!updatedFormData.doctorId &&
        !!updatedFormData.fromDate &&
        !!updatedFormData.toDate,
    )
  }

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
              <h4 className="card-title p-2">OPD Service Master</h4>

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
                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                      <i className="mdi mdi-plus"></i> Add
                    </button>
                    <button type="button" className="btn btn-success me-2">
                      <i className="mdi mdi-plus"></i> Generate Report
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
                        <th>Service Name</th>
                        <th>Base Tariff</th>
                        <th>Service Category</th>
                        <th>Department</th>
                        <th>Doctor</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.service_name}</td>
                          <td>₹{item.base_tariff.toFixed(2)}</td>
                          <td style={{ textTransform: "capitalize" }}>{item.service_category}</td>
                          <td>{item.department}</td>
                          <td>{item.doctor}</td>
                          <td>{new Date(item.from_date).toLocaleDateString()}</td>
                          <td>{new Date(item.to_date).toLocaleDateString()}</td>
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
                        Service Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="serviceCode"
                        placeholder="Service Code"
                        onChange={handleInputChange}
                        value={formData.serviceCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Service Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="serviceName"
                        placeholder="Service Name"
                        onChange={handleInputChange}
                        value={formData.serviceName}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Base Tariff <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="baseTariff"
                        placeholder="Base Tariff"
                        onChange={handleInputChange}
                        value={formData.baseTariff}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Service Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="serviceCategory"
                        onChange={handleSelectChange}
                        value={formData.serviceCategory}
                        required
                      >
                        <option value="">Select Service Category</option>
                        {serviceCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
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
                      >
                        <option value="">Select Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Doctor <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="doctorId"
                        onChange={handleSelectChange}
                        value={formData.doctorId}
                        required
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </option>
                        ))}
                      </select>
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
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                    <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
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
                            {serviceList.find((item) => item.id === confirmDialog.serviceId)?.service_name}
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

              {!showForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredServiceList.length}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OPDServiceMaster

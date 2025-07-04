import { useState } from "react"
import Popup from "../../../Components/popup"

const PackageMaster = () => {
  const [packageList, setPackageList] = useState([
    {
      id: 1,
      package_code: "PKG001",
      package_name: "Basic Health Package",
      description: "Complete basic health checkup package",
      base_cost: 2500.0,
      flat_discount: 200.0,
      discount_percentage: 10.0,
      final_cost: 2050.0,
      from_dt: "2024-01-01",
      to_dt: "2024-12-31",
      status: "y",
    },
    {
      id: 2,
      package_code: "PKG002",
      package_name: "Premium Health Package",
      description: "Comprehensive health screening with advanced tests",
      base_cost: 5000.0,
      flat_discount: 500.0,
      discount_percentage: 15.0,
      final_cost: 4250.0,
      from_dt: "2024-01-01",
      to_dt: "2024-12-31",
      status: "y",
    },
    {
      id: 3,
      package_code: "PKG003",
      package_name: "Cardiac Care Package",
      description: "Specialized cardiac health assessment package",
      base_cost: 3500.0,
      flat_discount: 300.0,
      discount_percentage: 12.0,
      final_cost: 2880.0,
      from_dt: "2024-02-01",
      to_dt: "2024-11-30",
      status: "y",
    },
    {
      id: 4,
      package_code: "PKG004",
      package_name: "Diabetes Care Package",
      description: "Complete diabetes monitoring and care package",
      base_cost: 1800.0,
      flat_discount: 150.0,
      discount_percentage: 8.0,
      final_cost: 1494.0,
      from_dt: "2024-01-15",
      to_dt: "2024-12-15",
      status: "n",
    },
    {
      id: 5,
      package_code: "PKG005",
      package_name: "Women's Health Package",
      description: "Comprehensive women's health screening package",
      base_cost: 4200.0,
      flat_discount: 400.0,
      discount_percentage: 18.0,
      final_cost: 3344.0,
      from_dt: "2024-03-01",
      to_dt: "2024-12-31",
      status: "y",
    },
  ])

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, packageId: null, newStatus: false })
  const [formData, setFormData] = useState({
    packageCode: "",
    packageName: "",
    description: "",
    baseCost: "",
    flatDiscount: "",
    discountPercentage: "",
    finalCost: "",
    fromDt: "",
    toDt: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredPackageList = packageList.filter(
    (item) =>
      item.package_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredPackageList.length / itemsPerPage)
  const currentItems = filteredPackageList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const calculateFinalCost = (baseCost, flatDiscount, discountPercentage) => {
    const base = Number.parseFloat(baseCost) || 0
    const flat = Number.parseFloat(flatDiscount) || 0
    const percentage = Number.parseFloat(discountPercentage) || 0

    const afterFlatDiscount = base - flat
    const percentageDiscount = (afterFlatDiscount * percentage) / 100
    const finalCost = afterFlatDiscount - percentageDiscount

    return Math.max(0, finalCost).toFixed(2)
  }

  const handleEdit = (item) => {
    setEditingPackage(item)
    setShowForm(true)
    setFormData({
      packageCode: item.package_code,
      packageName: item.package_name,
      description: item.description,
      baseCost: item.base_cost.toString(),
      flatDiscount: item.flat_discount.toString(),
      discountPercentage: item.discount_percentage.toString(),
      finalCost: item.final_cost.toString(),
      fromDt: item.from_dt,
      toDt: item.to_dt || "",
    })
    setIsFormValid(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    const finalCost = calculateFinalCost(formData.baseCost, formData.flatDiscount, formData.discountPercentage)

    if (editingPackage) {
      setPackageList(
        packageList.map((item) =>
          item.id === editingPackage.id
            ? {
                ...item,
                package_code: formData.packageCode,
                package_name: formData.packageName,
                description: formData.description,
                base_cost: Number.parseFloat(formData.baseCost),
                flat_discount: Number.parseFloat(formData.flatDiscount),
                discount_percentage: Number.parseFloat(formData.discountPercentage),
                final_cost: Number.parseFloat(finalCost),
                from_dt: formData.fromDt,
                to_dt: formData.toDt || null,
              }
            : item,
        ),
      )
      showPopup("Package updated successfully!", "success")
    } else {
      const newPackage = {
        id: Date.now(),
        package_code: formData.packageCode,
        package_name: formData.packageName,
        description: formData.description,
        base_cost: Number.parseFloat(formData.baseCost),
        flat_discount: Number.parseFloat(formData.flatDiscount),
        discount_percentage: Number.parseFloat(formData.discountPercentage),
        final_cost: Number.parseFloat(finalCost),
        from_dt: formData.fromDt,
        to_dt: formData.toDt || null,
        status: "y",
      }
      setPackageList([...packageList, newPackage])
      showPopup("New Package added successfully!", "success")
    }
    setEditingPackage(null)
    setShowForm(false)
    setFormData({
      packageCode: "",
      packageName: "",
      description: "",
      baseCost: "",
      flatDiscount: "",
      discountPercentage: "",
      finalCost: "",
      fromDt: "",
      toDt: "",
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
    setConfirmDialog({ isOpen: true, packageId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.packageId !== null) {
      setPackageList((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.packageId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )
    }
    setConfirmDialog({ isOpen: false, packageId: null, newStatus: null })
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    const updatedFormData = { ...formData, [id]: value }

    // Auto-calculate final cost when base cost, flat discount, or discount percentage changes
    if (id === "baseCost" || id === "flatDiscount" || id === "discountPercentage") {
      const finalCost = calculateFinalCost(
        id === "baseCost" ? value : formData.baseCost,
        id === "flatDiscount" ? value : formData.flatDiscount,
        id === "discountPercentage" ? value : formData.discountPercentage,
      )
      updatedFormData.finalCost = finalCost
    }

    setFormData(updatedFormData)

    setIsFormValid(
      !!updatedFormData.packageCode &&
        !!updatedFormData.packageName &&
        !!updatedFormData.description &&
        !!updatedFormData.baseCost &&
        !!updatedFormData.fromDt,
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
              <h4 className="card-title p-2">Package Master</h4>
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
                        <th>Package Code</th>
                        <th>Package Name</th>
                        <th>Description</th>
                        <th>Base Cost</th>
                        <th>Flat Discount</th>
                        <th>Discount %</th>
                        <th>Final Cost</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.package_code}</td>
                          <td>{item.package_name}</td>
                          <td>{item.description}</td>
                          <td>₹{item.base_cost.toFixed(2)}</td>
                          <td>₹{item.flat_discount.toFixed(2)}</td>
                          <td>{item.discount_percentage.toFixed(2)}%</td>
                          <td>₹{item.final_cost.toFixed(2)}</td>
                          <td>{item.from_dt}</td>
                          <td>{item.to_dt || "NULL"}</td>
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
                        Package Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="packageCode"
                        placeholder="Package Code"
                        onChange={handleInputChange}
                        value={formData.packageCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Package Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="packageName"
                        placeholder="Package Name"
                        onChange={handleInputChange}
                        value={formData.packageName}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        id="description"
                        placeholder="Package Description"
                        onChange={handleInputChange}
                        value={formData.description}
                        rows="3"
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Base Cost <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="baseCost"
                        placeholder="Base Cost"
                        onChange={handleInputChange}
                        value={formData.baseCost}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>Flat Discount</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="flatDiscount"
                        placeholder="Flat Discount"
                        onChange={handleInputChange}
                        value={formData.flatDiscount}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>Discount Percentage</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="discountPercentage"
                        placeholder="Discount Percentage"
                        onChange={handleInputChange}
                        value={formData.discountPercentage}
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>Final Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="finalCost"
                        placeholder="Final Cost"
                        value={formData.finalCost}
                        readOnly
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        From Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fromDt"
                        onChange={handleInputChange}
                        value={formData.fromDt}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>To Date</label>
                      <input
                        type="date"
                        className="form-control"
                        id="toDt"
                        onChange={handleInputChange}
                        value={formData.toDt}
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
                            {packageList.find((item) => item.id === confirmDialog.packageId)?.package_name}
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
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
              {!showForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredPackageList.length}
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

export default PackageMaster

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const DrugMaster = () => {
  const navigate = useNavigate()
  const [drugs, setDrugs] = useState([
    {
      id: 1,
      drugCode: "D492",
      drugName: "ORAL SUSPENSION 200 MG + 40 MG/5 ML",
      itemGroup: "Drug",
      unit: "ML",
      section: "Anti infective drugs - Other antibacterial",
      itemClass: "LIQUID",
      status: "y",
    },
    {
      id: 2,
      drugCode: "D4",
      drugName: "ACETYL SALICYLIC ACID (ASA) TABLET (ENTERIC COATED) 325 MG",
      itemGroup: "Drug",
      unit: "Tab",
      section: "Non-opioids and non-steroidal anti-inflammatory medicines (NSAIDs)",
      itemClass: "TABLET",
      status: "y",
    },
    {
      id: 3,
      drugCode: "D3",
      drugName: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
      itemGroup: "Drug",
      unit: "Tab",
      section: "Non-opioids and non-steroidal anti-inflammatory medicines (NSAIDs)",
      itemClass: "TABLET",
      status: "y",
    },
    {
      id: 4,
      drugCode: "D2",
      drugName: "Acetyl salicylic acid (Aspirin) - 75 Tab. IP",
      itemGroup: "Drug",
      unit: "Tab",
      section: "Non-opioids and non-steroidal anti-inflammatory medicines (NSAIDs)",
      itemClass: "TABLET",
      status: "n",
    },
    {
      id: 5,
      drugCode: "D556",
      drugName: "ACT (Artesunate Combination Theraphy) red color Age 9-14 years",
      itemGroup: "Drug",
      unit: "Tab",
      section: "Antimalarial medicines- for curative treatment",
      itemClass: "TABLET",
      status: "y",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [formData, setFormData] = useState({
    drugCode: "",
    drugName: "",
    itemGroup: "Drug",
    section: "Anti infective drugs - Other antibacterial",
    itemType: "PVMS",
    unitAU: "BOTTLE",
    itemClass: "LIQUID",
    dispensingUnit: "ML",
    dispensingQty: "",
    reorderLevel: "100",
    noOfDays: "",
    frequency: "Select",
    dosage: "",
    facilityCode: "Primary",
    dangerousDrug: false,
    inactiveForEntry: false,
  })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, drugId: null, newStatus: null })

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
      drugCode: "",
      drugName: "",
      itemGroup: "Drug",
      section: "Anti infective drugs - Other antibacterial",
      itemType: "PVMS",
      unitAU: "BOTTLE",
      itemClass: "LIQUID",
      dispensingUnit: "ML",
      dispensingQty: "",
      reorderLevel: "100",
      noOfDays: "",
      frequency: "Select",
      dosage: "",
      facilityCode: "Primary",
      dangerousDrug: false,
      inactiveForEntry: false,
    })
    setSelectedDrug(null)
  }

  const handleSwitchChange = (id, newStatus) => {
    setConfirmDialog({ isOpen: true, drugId: id, newStatus })
  }

  const handleConfirm = (confirmed) => {
    if (confirmed && confirmDialog.drugId !== null) {
      setDrugs((prevData) =>
        prevData.map((item) =>
          item.id === confirmDialog.drugId ? { ...item, status: confirmDialog.newStatus } : item,
        ),
      )

      // Update selectedDrug if it's the one being changed
      if (selectedDrug && selectedDrug.id === confirmDialog.drugId) {
        setSelectedDrug({ ...selectedDrug, status: confirmDialog.newStatus })
      }
    }
    setConfirmDialog({ isOpen: false, drugId: null, newStatus: null })
  }

  const handleUpdate = () => {
    if (selectedDrug) {
      const updatedDrugs = drugs.map((item) => {
        if (item.id === selectedDrug.id) {
          return {
            ...item,
            drugCode: formData.drugCode,
            drugName: formData.drugName,
            itemGroup: formData.itemGroup,
            section: formData.section,
            itemClass: formData.itemClass,
            unit: formData.dispensingUnit,
          }
        }
        return item
      })
      setDrugs(updatedDrugs)
      alert("Drug updated successfully!")
    }
  }

  const filteredDrugs = drugs.filter(
    (item) =>
      item.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.drugCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredDrugs.length / itemsPerPage)
  const currentItems = filteredDrugs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleRowClick = (drug) => {
    setSelectedDrug(drug)
    setFormData({
      drugCode: drug.drugCode,
      drugName: drug.drugName,
      itemGroup: drug.itemGroup,
      section: drug.section,
      itemType: "PVMS",
      unitAU: "BOTTLE",
      itemClass: drug.itemClass,
      dispensingUnit: drug.unit,
      dispensingQty: "",
      reorderLevel: "100",
      noOfDays: "",
      frequency: "Select",
      dosage: "",
      facilityCode: "Primary",
      dangerousDrug: false,
      inactiveForEntry: false,
    })
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
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Item Drug Master</h4>
              <div className="d-flex flex-wrap mt-3 mx-0">
                <div className="d-flex align-items-center col-md-7">
                  <div className="d-flex align-items-center col-md-7">
                    <label className="flex-shrink-0 me-2 ms-3">
                      Drug Name<span className="text-warning">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Drug Name"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="col-md-2 d-flex me-2">
                    <button type="button" className="btn btn-success ms-2">
                      Search
                    </button>
                  </div>
                </div>
                <div className="col-md-4 d-flex justify-content-end">
                  <button type="button" className="btn ms-2 btn-success" onClick={() => setSearchQuery("")}>
                    Show All
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive packagelist">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#B0C4DE" }}>
                    <tr>
                      <th>Drug Code</th>
                      <th>Drug Name</th>
                      <th>Item Group</th>
                      <th>Unit</th>
                      <th>Section</th>
                      <th>Item Class</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className={selectedDrug && selectedDrug.id === item.id ? "table-primary" : ""}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{item.drugCode}</td>
                        <td>{item.drugName}</td>
                        <td>{item.itemGroup}</td>
                        <td>{item.unit}</td>
                        <td>{item.section}</td>
                        <td>{item.itemClass}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={item.status === "y"}
                              onChange={() => handleSwitchChange(item.id, item.status === "y" ? "n" : "y")}
                              id={`switch-${item.id}`}
                            />
                            <label className="form-check-label px-0" htmlFor={`switch-${item.id}`}>
                              {item.status === "y" ? "Active" : "Deactivated"}
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                              Drug Code<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="drugCode"
                              value={formData.drugCode}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-8">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Drug Name<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="drugName"
                              value={formData.drugName}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Item Group<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="itemGroup"
                              value={formData.itemGroup}
                              onChange={handleInputChange}
                            >
                              <option value="Drug">Drug</option>
                              <option value="Medicine">Medicine</option>
                              <option value="Consumable">Consumable</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Section<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="section"
                              value={formData.section}
                              onChange={handleInputChange}
                            >
                              <option value="Anti infective drugs - Other antibacterial">
                                Anti infective drugs - Other antibacterial
                              </option>
                              <option value="Non-opioids and non-steroidal anti-inflammatory medicines (NSAIDs)">
                                Non-opioids and non-steroidal anti-inflammatory medicines (NSAIDs)
                              </option>
                              <option value="Antimalarial medicines- for curative treatment">
                                Antimalarial medicines- for curative treatment
                              </option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Item Class<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="itemClass"
                              value={formData.itemClass}
                              onChange={handleInputChange}
                            >
                              <option value="LIQUID">LIQUID</option>
                              <option value="TABLET">TABLET</option>
                              <option value="CAPSULE">CAPSULE</option>
                              <option value="INJECTION">INJECTION</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Item Type<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="itemType"
                              value={formData.itemType}
                              onChange={handleInputChange}
                            >
                              <option value="PVMS">PVMS</option>
                              <option value="Standard">Standard</option>
                              <option value="Custom">Custom</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Unit A/U<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="unitAU"
                              value={formData.unitAU}
                              onChange={handleInputChange}
                            >
                              <option value="BOTTLE">BOTTLE</option>
                              <option value="BOX">BOX</option>
                              <option value="STRIP">STRIP</option>
                              <option value="VIAL">VIAL</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Dispensing Unit<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="dispensingUnit"
                              value={formData.dispensingUnit}
                              onChange={handleInputChange}
                            >
                              <option value="ML">ML</option>
                              <option value="Tab">Tab</option>
                              <option value="Capsule">Capsule</option>
                              <option value="Injection">Injection</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label mb-1">Dispensing Qty</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Dispensing Qty"
                              name="dispensingQty"
                              value={formData.dispensingQty}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label mb-1">
                              Re-order Level-Dispensary<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="reorderLevel"
                              value={formData.reorderLevel}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label mb-1">Dosage</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Dosage"
                              name="dosage"
                              value={formData.dosage}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label mb-1">No of Days</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="No of Days"
                              name="noOfDays"
                              value={formData.noOfDays}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">Frequency</label>
                            <select
                              className="form-select"
                              name="frequency"
                              value={formData.frequency}
                              onChange={handleInputChange}
                            >
                              <option value="Select">Select</option>
                              <option value="Once Daily">Once Daily</option>
                              <option value="Twice Daily">Twice Daily</option>
                              <option value="Thrice Daily">Thrice Daily</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-1">
                              Facility Code<span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
                              name="facilityCode"
                              value={formData.facilityCode}
                              onChange={handleInputChange}
                            >
                              <option value="Primary">Primary</option>
                              <option value="Secondary">Secondary</option>
                              <option value="Tertiary">Tertiary</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="mb-2">
                            <label className="form-label mb-1">Options</label>
                            <div className="form-control d-flex align-items-center">
                              <div className="form-check me-4">
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
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="inactiveForEntry"
                                  name="inactiveForEntry"
                                  checked={formData.inactiveForEntry}
                                  onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="inactiveForEntry">
                                  Inactive for entry
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 text-end mt-3 mb-3">
                          <button className="btn me-2 btn-success" disabled={!selectedDrug} onClick={handleUpdate}>
                            Update
                          </button>

                          <button className="btn btn-danger" onClick={handleReset}>
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
                          <strong>{drugs.find((item) => item.id === confirmDialog.drugId)?.drugName}</strong>?
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
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredDrugs.length}
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
                  <span className="me-2">Go To Page</span>
                  <input
                    type="number"
                    min="1"
                    max={filteredTotalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    className="form-control me-2"
                    style={{ width: "80px" }}
                  />
                  <button
                    className="btn btn-success"
                    onClick={handlePageNavigation}
                  >
                    Go
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrugMaster

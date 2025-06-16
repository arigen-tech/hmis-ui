import { useState } from "react"
import Popup from "../../../Components/popup"

const DrugMaster = () => {
  // HSN Code data for dropdown
  const hsnCodes = [
    { code: "30049099", description: "Other medicaments" },
    { code: "30041000", description: "Penicillins and their derivatives" },
    { code: "30042000", description: "Streptomycins and their derivatives" },
    { code: "30043100", description: "Tetracyclines and their derivatives" },
    { code: "30043200", description: "Chloramphenicol and its derivatives" },
    { code: "30043300", description: "Erythromycin and its derivatives" },
    { code: "30043900", description: "Other antibiotics" },
    { code: "30044000", description: "Medicaments containing alkaloids" },
    { code: "30045000", description: "Other medicaments containing vitamins" },
    { code: "30046000", description: "Medicaments containing antimalarial active principles" },
  ]

  const [popupMessage, setPopupMessage] = useState(null)
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
      reorderLevelStore: "50",
      hsnCode: "30049099",
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
      reorderLevelStore: "75",
      hsnCode: "30044000",
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
      reorderLevelStore: "60",
      hsnCode: "30044000",
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
      reorderLevelStore: "40",
      hsnCode: "30044000",
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
      reorderLevelStore: "30",
      hsnCode: "30046000",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const [editingDrug, setEditingDrug] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [formData, setFormData] = useState({
    drugCode: "",
    drugName: "",
    itemGroup: "Drug",
    section: "Anti infective drugs - Other antibacterial",
    itemType: "PVMS",
    unitAU: "BOTTLE",
    itemClass: "LIQUID",
    dispensingUnit: "ML",
    itemCategory: "Category 1",
    dispensingQty: "",
    reorderLevel: "100",
    reorderLevelStore: "",
    hsnCode: "",
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
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    }
    setFormData(updatedFormData)

    // Check if all required fields have values
    setIsFormValid(
      !!updatedFormData.drugCode &&
        !!updatedFormData.drugName &&
        !!updatedFormData.itemGroup &&
        !!updatedFormData.section &&
        !!updatedFormData.itemClass &&
        !!updatedFormData.dispensingUnit &&
        !!updatedFormData.reorderLevel &&
        !!updatedFormData.itemCategory &&
        !!updatedFormData.facilityCode,
    )
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
    }
    setConfirmDialog({ isOpen: false, drugId: null, newStatus: null })
  }

  const handleEdit = (drug) => {
    setEditingDrug(drug)
    setShowForm(true)
    setFormData({
      drugCode: drug.drugCode,
      drugName: drug.drugName,
      itemGroup: drug.itemGroup,
      section: drug.section,
      itemType: "PVMS",
      unitAU: "BOTTLE",
      itemClass: drug.itemClass,
      itemCategory: drug.itemCategory,
      dispensingUnit: drug.unit,
      dispensingQty: "",
      reorderLevel: "100",
      reorderLevelStore: drug.reorderLevelStore || "",
      hsnCode: drug.hsnCode || "",
      noOfDays: "",
      frequency: "Select",
      dosage: "",
      facilityCode: "Primary",
      dangerousDrug: false,
      inactiveForEntry: false,
    })
    setIsFormValid(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    if (editingDrug) {
      setDrugs(
        drugs.map((item) =>
          item.id === editingDrug.id
            ? {
                ...item,
                drugCode: formData.drugCode,
                drugName: formData.drugName,
                itemGroup: formData.itemGroup,
                section: formData.section,
                itemClass: formData.itemClass,
                itemCategory: formData.itemCategory,
                unit: formData.dispensingUnit,
                reorderLevelStore: formData.reorderLevelStore,
                hsnCode: formData.hsnCode,
              }
            : item,
        ),
      )
      showPopup("Drug updated successfully!", "success")
    } else {
      const newDrug = {
        id: Date.now(),
        drugCode: formData.drugCode,
        drugName: formData.drugName,
        itemGroup: formData.itemGroup,
        unit: formData.dispensingUnit,
        section: formData.section,
        itemClass: formData.itemClass,
        itemCategory: formData.itemCategory,
        status: "y",
        reorderLevelStore: formData.reorderLevelStore || "",
        hsnCode: formData.hsnCode || "",
      }
      setDrugs([...drugs, newDrug])
      showPopup("Drug added successfully!", "success")
    }

    setEditingDrug(null)
    setShowForm(false)
   
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

  const filteredDrugs = drugs.filter(
    (item) =>
      item.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.drugCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredDrugs.length / itemsPerPage)
  const currentItems = filteredDrugs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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

  const handleAdd = () => {
    setEditingDrug(null)
     setFormData({
      drugCode: "",
      drugName: "",
      itemGroup: "Drug",
      section: "Anti infective drugs - Other antibacterial",
      itemType: "PVMS",
      unitAU: "BOTTLE",
      itemClass: "LIQUID",
      itemCategory: "Category 2",
      dispensingUnit: "ML",
      dispensingQty: "",
      reorderLevel: "100",
      reorderLevelStore: "",
      hsnCode: "",
      noOfDays: "",
      frequency: "Select",
      dosage: "",
      facilityCode: "Primary",
      dangerousDrug: false,
      inactiveForEntry: false,
    })
    setShowForm(true)
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Item Drug Master</h4>

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
                    <button type="button" className="btn btn-success me-2" onClick={handleAdd}>
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
                        <th>Drug Code</th>
                        <th>Drug Name</th>
                        <th>Item Group</th>
                        <th>Unit</th>
                        <th>Section</th>
                        <th>Item Class</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.drugCode}</td>
                          <td>{item.drugName}</td>
                          <td>{item.itemGroup}</td>
                          <td>{item.unit}</td>
                          <td>{item.section}</td>
                          <td>{item.itemClass}</td>
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
                        Drug Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="drugCode"
                        placeholder="Drug Code"
                        onChange={handleInputChange}
                        value={formData.drugCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-8 mt-3">
                      <label>
                        Drug Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="drugName"
                        placeholder="Drug Name"
                        onChange={handleInputChange}
                        value={formData.drugName}
                        required
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Item Group <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="itemGroup"
                        value={formData.itemGroup}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Drug">Drug</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Consumable">Consumable</option>
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Item Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="itemType"
                        value={formData.itemType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="PVMS">PVMS</option>
                        <option value="Standard">Standard</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Section <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        required
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

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Item Class <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="itemClass"
                        value={formData.itemClass}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="LIQUID">LIQUID</option>
                        <option value="TABLET">TABLET</option>
                        <option value="CAPSULE">CAPSULE</option>
                        <option value="INJECTION">INJECTION</option>
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Item Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="itemCategory"
                        value={formData.itemCategory}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Category 1">Category 1</option>
                        <option value="Category 2">Category 2</option>
                        <option value="Category 3">Category 3</option>
                        <option value="Category 4">Category 4</option>
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Unit A/U <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="unitAU"
                        value={formData.unitAU}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="BOTTLE">BOTTLE</option>
                        <option value="BOX">BOX</option>
                        <option value="STRIP">STRIP</option>
                        <option value="VIAL">VIAL</option>
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Dispensing Unit <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="dispensingUnit"
                        value={formData.dispensingUnit}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="ML">ML</option>
                        <option value="Tab">Tab</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Injection">Injection</option>
                      </select>
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Dispensing Qty</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Dispensing Qty"
                        name="dispensingQty"
                        value={formData.dispensingQty}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Re-order Level-Dispensary <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="reorderLevel"
                        value={formData.reorderLevel}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                      <div className="form-group col-md-4 mt-3">
                        <label>Re-order Level-Store</label>
                        <input
                          type="text"
                          className="form-control"
                          name="reorderLevelStore"
                          placeholder="Re-order Level-Store"
                          value={formData.reorderLevelStore}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-group col-md-4 mt-3">
                        <label>HSN Code</label>
                        <select
                          className="form-select"
                          name="hsnCode"
                          value={formData.hsnCode}
                          onChange={handleInputChange}
                        >
                          <option value="">Select HSN Code</option>
                          {hsnCodes.map((hsn) => (
                            <option key={hsn.code} value={hsn.code}>
                              {hsn.code} - {hsn.description}
                            </option>
                          ))}
                        </select>
                      </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Dosage</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Dosage"
                        name="dosage"
                        value={formData.dosage}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>No of Days</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="No of Days"
                        name="noOfDays"
                        value={formData.noOfDays}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-4 mt-3">
                      <label>Frequency</label>
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

                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Facility Code <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="facilityCode"
                        value={formData.facilityCode}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Tertiary">Tertiary</option>
                      </select>
                    </div>

                    <div className="form-group col-md-6 mt-3">
                      <label>Options</label>
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

              {/* Confirmation Modal */}
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
                          <strong>{drugs.find((item) => item.id === confirmDialog.drugId)?.drugName}</strong>?
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

              {/* Pagination - only show when not in form mode */}
              {!showForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
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

export default DrugMaster

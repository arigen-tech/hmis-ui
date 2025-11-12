import { useState, useEffect } from "react"
import Popup from "../../../../Components/popup";
import ReactDOM from "react-dom"
import LoadingScreen from "../../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../../service/apiService"
import { MAS_FREQUENCY, MAS_DRUG_MAS, OPD_TEMPLATE, ITEM_CLASS, DRUG_TYPE } from "../../../../config/apiConfig";

// Portal Component for dropdown
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? ReactDOM.createPortal(children, document.body) : null;
};

const TreatmentModal = ({
  show,
  onClose,
  templateType = "create",
  selectedTemplate = null,
  onTemplateSaved
}) => {
  // State management
  const [templateName, setTemplateName] = useState("")
  const [templateCode, setTemplateCode] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [treatmentItems, setTreatmentItems] = useState([{
    drugName: "",
    drugId: null,
    dispUnit: "",
    dosage: "",
    frequency: "OD",
    frequencyId: null,
    days: "",
    total: "",
    instruction: "",
    stock: "",
    itemClassId: null,
    adispQty: null,
  }])
  const [templates, setTemplates] = useState([])
  const [allDrugs, setAllDrugs] = useState([])
  const [allFrequencies, setAllFrequencies] = useState([])
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [activeRowIndex, setActiveRowIndex] = useState(null)
  const [selectedDrugs, setSelectedDrugs] = useState([])
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleDrugInputFocus = (event, index) => {
    const rect = event.target.getBoundingClientRect();
    setDropdownPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      width: rect.width,
      height: rect.height,
    });
    setActiveRowIndex(index);
    setDropdownVisible(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".form-control") &&
        !event.target.closest(".dropdown-list")) {
        setDropdownVisible(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (show) {
      resetForm()
      fetchTemplates()
      fetchAllDrugs()
      fetchAllFrequencies()

      if (templateType === "edit" && selectedTemplate) {
        setSelectedTemplateId(selectedTemplate.templateId)
        loadTemplateData(selectedTemplate)
      }
    }
  }, [show, templateType, selectedTemplate])

  // Load template data when template is selected from dropdown
  useEffect(() => {
    if (templateType === 'edit' && selectedTemplateId && templates.length > 0 && !selectedTemplate) {
      const template = templates.find(t => t.templateId == selectedTemplateId)
      if (template) {
        loadTemplateData(template)
      }
    }
  }, [selectedTemplateId, templates, templateType, selectedTemplate])

  const fetchTemplates = async (flag = 1) => {
    try {
      setLoading(true);
      const response = await getRequest(`${OPD_TEMPLATE}/getAll/${flag}`);
      if (response && response.response) {
        setTemplates(response.response);
      } else {
        showPopup("No templates found", "warning");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      showPopup("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDrugs = async () => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_DRUG_MAS}/getAllBySectionOnly/1`)
      if (response && response.response) {
        // Map API response - store BOTH the numeric ID and the string name
        const mappedDrugs = response.response.map(drug => {
          console.log("Drug mapping:", {
            itemId: drug.itemId,
            nomenclature: drug.nomenclature,
            dispUnit: drug.dispUnit,
            dispUnitName: drug.dispUnitName,
            itemClassId: drug.itemClassId,
            adispQty: drug.adispQty
          })
          return {
            id: drug.itemId,
            name: drug.nomenclature,
            code: drug.pvmsNo,
            dispUnitName: drug.dispUnitName,
            dispUnitId: drug.dispUnit,
            itemClassId: drug.itemClassId,
            adispQty: drug.adispQty,
            // Keep original fields
            itemId: drug.itemId,
            nomenclature: drug.nomenclature,
            pvmsNo: drug.pvmsNo,
            ...drug
          }
        })
        setAllDrugs(mappedDrugs)
        console.log("Drugs loaded successfully:", mappedDrugs)
      } else {
        console.warn("No drugs found in response")
        setAllDrugs([])
      }
    } catch (error) {
      console.error("Error fetching drugs:", error)
      showPopup("Failed to load drugs", "error")
      setAllDrugs([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAllFrequencies = async () => {
    try {
      setLoading(true)
      const response = await getRequest(`${MAS_FREQUENCY}/getAll/1`)
      console.log("Frequency API Response:", response);

      if (response && response.response) {
        setAllFrequencies(response.response)
        console.log("Frequencies loaded:", response.response);
      } else {
        console.warn("No frequencies found in response")
        setAllFrequencies([])
      }
    } catch (error) {
      console.error("Error fetching frequencies:", error)
      showPopup("Failed to load frequencies", "error")
      setAllFrequencies([])
    } finally {
      setLoading(false)
    }
  }

  const loadTemplateData = (template) => {
    setTemplateName(template.opdTemplateName || "")
    setTemplateCode(template.opdTemplateCode || "")

    if (template.treatments && template.treatments.length > 0) {
      const items = template.treatments.map(item => {
        const drug = allDrugs.find(d => d.id === item.itemId)
        const frequency = allFrequencies.find(f => f.frequencyId === item.frequencyId)

        return {
          drugName: drug ? drug.name : `Drug #${item.itemId}`,
          drugId: item.itemId,
          dispUnit: drug ? drug.dispUnitName : "",
          dosage: item.dosage || "",
          frequency: frequency ? frequency.frequencyName : "OD",
          frequencyId: item.frequencyId,
          days: item.noOfDays || "",
          total: item.total || "",
          instruction: item.instruction || "",
          stock: "",
          itemClassId: drug ? drug.itemClassId : null,
          adispQty: drug ? drug.adispQty : null,
        }
      })
      setTreatmentItems(items)
      setSelectedDrugs(template.treatments.map(item => item.itemId))
    } else {
      setTreatmentItems([{
        drugName: "",
        drugId: null,
        dispUnit: "",
        dosage: "",
        frequency: "OD",
        frequencyId: null,
        days: "",
        total: "",
        instruction: "",
        stock: "",
        itemClassId: null,
        adispQty: null,
      }])
      setSelectedDrugs([])
    }
  }

  const resetForm = () => {
    setTemplateName("")
    setTemplateCode("")
    setTreatmentItems([{
      drugName: "",
      drugId: null,
      dispUnit: "",
      dosage: "",
      frequency: "OD",
      frequencyId: null,
      days: "",
      total: "",
      instruction: "",
      stock: "",
      itemClassId: null,
      adispQty: null,
    }])
    setSelectedDrugs([])
    setSelectedTemplateId("")
    setActiveRowIndex(null)
    setDropdownVisible(false)
  }

  const handleAddTreatmentItem = () => {
    setTreatmentItems([
      ...treatmentItems,
      {
        drugName: "",
        drugId: null,
        dispUnit: "",
        dosage: "",
        frequency: "OD",
        frequencyId: null,
        days: "",
        total: "",
        instruction: "",
        stock: "",
        itemClassId: null,
        adispQty: null,
      },
    ])
  }

  const handleRemoveTreatmentItem = (index) => {
    if (treatmentItems.length === 1) return
    const newItems = treatmentItems.filter((_, i) => i !== index)
    setTreatmentItems(newItems)

    if (treatmentItems[index].drugId) {
      setSelectedDrugs(prev =>
        prev.filter(id => id !== treatmentItems[index].drugId)
      )
    }
  }

  // Calculate total based on itemClassId and adispQty
  const calculateTotal = (item) => {
    if (!item.dosage || !item.days || !item.frequencyId || item.itemClassId === null) {
      return "";
    }

    const dosage = parseFloat(item.dosage) || 0;
    const days = parseFloat(item.days) || 0;

    // Get frequency multiplier from the selected frequency
    const selectedFrequency = allFrequencies.find(f => f.frequencyId === item.frequencyId);
    const frequencyMultiplier = selectedFrequency ? selectedFrequency.feq : 1;

    let total = 0;

    // Calculate total based on itemClassId
    if (DRUG_TYPE.SOLID.includes(item.itemClassId)) {
      // For solid types (tablets and capsules): dosage * frequency * days
      total = Math.ceil(dosage * frequencyMultiplier * days);
    } else if (DRUG_TYPE.LIQUID.includes(item.itemClassId)) {
      // For liquid types: (dosage * frequency * days) / adispQty (if available)
      if (item.adispQty && item.adispQty > 0) {
        total = Math.ceil((dosage * frequencyMultiplier * days) / item.adispQty);
      } else {
        // If liquid type but no adispQty, use solid calculation
        total = Math.ceil(dosage * frequencyMultiplier * days);
      }
    } else {
      // For unknown drug types, set to 1 as safe default
      total = 1;
    }

    return total.toString();
  };

  const handleTreatmentChange = (index, field, value) => {
    const newItems = [...treatmentItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // If dosage, days, or frequency changes, recalculate total
    if (field === "dosage" || field === "days" || field === "frequencyId") {
      const calculatedTotal = calculateTotal(newItems[index]);
      newItems[index].total = calculatedTotal;
    }

    setTreatmentItems(newItems);
  };

  const filterDrugsBySearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      return allDrugs.slice(0, 5)
    }

    const filtered = allDrugs.filter(drug =>
      drug.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.code?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)

    return filtered
  }

  const handleDrugSelect = (index, drug) => {
    // Check if this drug is already selected in a DIFFERENT row
    const drugAlreadyInOtherRow = selectedDrugs.some(
      id => id === drug.id && treatmentItems[index]?.drugId !== drug.id
    )

    if (drugAlreadyInOtherRow) {
      showPopup("This drug is already added to the template", "error")
      return
    }

    const newItems = [...treatmentItems];
    newItems[index] = {
      ...newItems[index],
      drugName: drug.name,
      drugId: drug.id,
      dispUnit: drug.dispUnitName,
      itemClassId: drug.itemClassId,
      adispQty: drug.adispQty
    };

    // Recalculate total after drug selection if all required fields are present
    const calculatedTotal = calculateTotal(newItems[index]);
    newItems[index].total = calculatedTotal;

    setTreatmentItems(newItems);

    // Update selectedDrugs
    setSelectedDrugs(prev => {
      const withoutCurrent = prev.filter(id => id !== treatmentItems[index]?.drugId);
      return [...withoutCurrent, drug.id];
    });

    setDropdownVisible(false);
    setActiveRowIndex(null);
  }

  const handleFrequencySelect = (index, frequencyId) => {
    const frequency = allFrequencies.find(f => f.frequencyId === frequencyId);
    if (frequency) {
      const newItems = [...treatmentItems];
      newItems[index] = {
        ...newItems[index],
        frequency: frequency.frequencyName,
        frequencyId: frequency.frequencyId
      };

      // Recalculate total after frequency selection
      const calculatedTotal = calculateTotal(newItems[index]);
      newItems[index].total = calculatedTotal;

      setTreatmentItems(newItems);
    }
  }

  // Only check for duplicates during CREATE operation
  const isTemplateNameDuplicate = () => {
    if (templateType === 'edit') return false
    return templates.some(template =>
      template.opdTemplateName.toLowerCase() === templateName.trim().toLowerCase()
    )
  }

  // Only check for duplicates during CREATE operation
  const isTemplateCodeDuplicate = () => {
    if (templateType === 'edit') return false
    return templates.some(template =>
      template.opdTemplateCode.toLowerCase() === templateCode.trim().toLowerCase()
    )
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateCode.trim()) {
      showPopup("Please fill in template name and code", "error")
      return
    }

    if (selectedDrugs.length === 0) {
      showPopup("Please add at least one treatment item", "error")
      return
    }

    const uniqueDrugs = [...new Set(selectedDrugs)]
    if (uniqueDrugs.length !== selectedDrugs.length) {
      showPopup("Duplicate drugs found. Please remove duplicates before saving.", "error")
      return
    }

    // Validate all required fields
    for (let i = 0; i < treatmentItems.length; i++) {
      const item = treatmentItems[i]
      if (!item.drugId || !item.dosage || !item.days || !item.frequencyId) {
        showPopup(`Please fill all required fields in row ${i + 1}`, "error")
        return
      }
    }

    try {
      setLoading(true)

      // Only validate duplicates for create operation
      if (templateType === "create") {
        if (isTemplateNameDuplicate()) {
          showPopup("Template name already exists. Please use a different name.", "error")
          return
        }
        if (isTemplateCodeDuplicate()) {
          showPopup("Template code already exists. Please use a different code.", "error")
          return
        }
      }

      const requestData = {
        opdTemplateName: templateName.trim(),
        opdTemplateCode: templateCode.trim(),
        investigationRequestList: [],
        treatments: treatmentItems.map(item => ({
          dosage: item.dosage,
          noOfDays: parseInt(item.days) || 0,
          total: parseInt(item.total) || 0,
          instruction: item.instruction,
          frequencyId: item.frequencyId,
          itemId: item.drugId
        }))
      }

      let response
      if (templateType === "create") {
        response = await postRequest(`${OPD_TEMPLATE}/save`, requestData)
      } else if (templateType === "edit") {
        const templateId = selectedTemplate ? selectedTemplate.templateId : selectedTemplateId
        if (!templateId) {
          showPopup("Please select a template to update", "error")
          return
        }
        response = await putRequest(
          `${OPD_TEMPLATE}/updateOpdTemplateTreatment/${templateId}`,
          requestData
        )
      }

      if (response && response.status === 200) {
        showPopup(
          `Template ${templateType === 'create' ? 'created' : 'updated'} successfully!`,
          "success"
        )
        resetForm()
        if (onTemplateSaved) {
          onTemplateSaved(response.response)
        }
      } else {
        throw new Error(response?.message || "Failed to save template")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      if (error.response?.data?.message?.includes('duplicate') ||
        error.message?.includes('duplicate') ||
        error.response?.data?.message?.includes('already exists')) {
        showPopup(
          "Template name or code already exists. Please use different values.",
          "error"
        )
      } else {
        showPopup(
          `Failed to ${templateType === 'create' ? 'create' : 'update'} template: ${error.message}`,
          "error"
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetTemplate = () => {
    resetForm()
  }

  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      }
    })
  }

  const handleCloseModal = () => {
    if (popupMessage) {
      setPopupMessage(null)
    }
    onClose()
  }

  if (!show) return null

  return (
    <div className="modal fade show d-block" style={{
      backgroundColor: 'rgba(0,0,0,0.5)',
      position: 'fixed',
      top: 0,
      left: '250px',
      right: 0,
      bottom: 0,
      zIndex: 1050
    }}>
      <div className="modal-dialog" style={{
        position: 'fixed',
        top: '50%',
        left: 'calc(250px + (100% - 250px) / 2)',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 270px)',
        maxWidth: 'none',
        margin: 0,
        height: 'auto',
        maxHeight: '90vh'
      }}>
        <div className="modal-content" style={{
          height: 'auto',
          maxHeight: '90vh',
          overflow: 'hidden',
          borderRadius: '8px',
          margin: '0 10px'
        }}>
          {/* Header */}
          <div className="modal-header" style={{
            backgroundColor: '#0d6efd',
            color: 'white',
            borderBottom: '2px solid #0b5ed7',
            padding: '1rem 1.5rem',
            borderRadius: '8px 8px 0 0'
          }}>
            <h5 className="modal-title fw-bold">
              {templateType === 'create' ? 'CREATE' : 'EDIT'} TREATMENT TEMPLATE
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleCloseModal}
            ></button>
          </div>

          <div className="modal-body" style={{
            padding: '1.5rem',
            maxHeight: 'calc(90vh - 100px)',
            overflow: 'auto'
          }}>
            {loading && <LoadingScreen />}

            {/* Template Selection Dropdown - Only for edit mode without preselected template */}
            {templateType === 'edit' && !selectedTemplate && (
              <div className="row mb-3 align-items-center">
                <div className="col-md-2">
                  <label className="form-label fw-bold">SELECT TEMPLATE</label>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    style={{ borderRadius: '4px' }}
                  >
                    <option value="">Select Template</option>
                    {templates.map(template => (
                      <option key={template.templateId} value={template.templateId}>
                        {template.opdTemplateName} ({template.opdTemplateCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Template Name and Code */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">Template Name *</label>
                <input
                  type="text"
                  className={`form-control ${templateType === 'create' && isTemplateNameDuplicate() ? 'is-invalid' : ''}`}
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  style={{ borderRadius: '4px' }}
                />
                {templateType === 'create' && isTemplateNameDuplicate() && (
                  <div className="text-danger small mt-1">Template name already exists</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Template Code *</label>
                <input
                  type="text"
                  className={`form-control ${templateType === 'create' && isTemplateCodeDuplicate() ? 'is-invalid' : ''}`}
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  placeholder="Enter template code"
                  style={{ borderRadius: '4px' }}
                />
                {templateType === 'create' && isTemplateCodeDuplicate() && (
                  <div className="text-danger small mt-1">Template code already exists</div>
                )}
              </div>
            </div>

            {/* Treatment Table */}
<div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
  <table className="table table-bordered" style={{ width: '100%' }}>

                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 370 }}>DRUGS NAME/DRUGS CODE</th>
                    <th style={{ minWidth: '20px', maxWidth: '20px' }}>DISP. UNIT</th>
                    <th style={{ minWidth: '12px', maxWidth: '12px' }}>DOSAGE</th>
                    <th style={{ minWidth: '90px' }}>FREQUENCY</th>
                    <th style={{ minWidth: '12px', maxWidth: '12px' }}>DAYS</th>
                    <th style={{ minWidth: '80px' }}>TOTAL</th>
                    <th style={{ minWidth: '70px' }}>INSTRUCTION</th>
                    {/* <th style={{ minWidth: '80px' }}>STOCK</th> */}
                    <th style={{ minWidth: '40px' }}>ADD</th>
                    <th style={{ minWidth: '40px' }}>DELETE</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentItems.map((row, index) => (
                    <tr key={index}>
                      {/* Drug Name with Search Dropdown */}
                      <td style={{ position: 'relative' }}>
                        <div className="dropdown-search-container position-relative">
                          <input
                            type="text"
                            className="form-control"
                            value={row.drugName}
                            autoComplete="off"
                            onChange={(e) => {
                              const newItems = [...treatmentItems];
                              newItems[index] = {
                                ...newItems[index],
                                drugName: e.target.value,
                                drugId: null,
                                dispUnit: "",
                                itemClassId: null,
                                adispQty: null,
                                total: "" // Reset total when drug is cleared
                              };
                              setTreatmentItems(newItems);
                              if (e.target.value.trim() !== "") {
                                setActiveRowIndex(index);
                              }
                            }}
                            onFocus={(e) => handleDrugInputFocus(e, index)}
                            placeholder="Enter drug name or code"
                            style={{ borderRadius: "4px", minWidth: "180px" }}
                          />

                          {/* Search Dropdown using Portal */}
                          {dropdownVisible && activeRowIndex === index && row.drugName.trim() !== "" && (
                            <Portal>
                              <ul
                                className="list-group position-fixed dropdown-list"
                                style={{
                                  top: `${dropdownPosition.y}px`,
                                  left: `${dropdownPosition.x}px`,
                                  width: `${dropdownPosition.width}px`,
                                  zIndex: 99999,
                                  backgroundColor: "#fff",
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                  maxHeight: "250px",
                                  overflowY: "auto",
                                }}
                              >
                                {filterDrugsBySearch(row.drugName).length > 0 ? (
                                  filterDrugsBySearch(row.drugName).map((drug) => {
                                    const isSelectedInOtherRow = selectedDrugs.some(
                                      (id) => id === drug.id && treatmentItems[index]?.drugId !== drug.id
                                    );
                                    return (
                                      <li
                                        key={drug.id}
                                        className="list-group-item list-group-item-action"
                                        style={{
                                          backgroundColor: isSelectedInOtherRow ? "#ffc107" : "#f8f9fa",
                                          cursor: isSelectedInOtherRow ? "not-allowed" : "pointer",
                                          padding: "8px 12px",
                                        }}
                                        onClick={() => {
                                          if (!isSelectedInOtherRow) handleDrugSelect(index, drug);
                                        }}
                                      >
                                        <div>
                                          <strong>{drug.name}</strong>
                                          <div
                                            style={{
                                              color: "#6c757d",
                                              fontSize: "0.8rem",
                                              marginTop: "2px",
                                            }}
                                          >
                                            
                                            {isSelectedInOtherRow && (
                                              <span className="text-success ms-2">
                                                <i className="fas fa-check-circle me-1"></i> Added
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  })
                                ) : (
                                  <li className="list-group-item text-muted text-center">
                                    {allDrugs.length === 0 ? "No drugs available" : "No drugs found"}
                                  </li>
                                )}
                              </ul>
                            </Portal>
                          )}
                        </div>
                      </td>

                      {/* Disp Unit */}
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={row.dispUnit}
                          readOnly
                          style={{ borderRadius: '4px', minWidth: '20px', maxWidth:'80px', backgroundColor: '#f8f9fa' }}
                        />
                      </td>

                      {/* Dosage */}
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.dosage}
                          onChange={(e) => handleTreatmentChange(index, "dosage", e.target.value)}
                          placeholder="1"
                          style={{ borderRadius: '4px', minwidth: '12px', maxWidth: '102px' }}
                        />
                      </td>

                      {/* Frequency */}
                      <td>
                        <select
                          className="form-select"
                          value={row.frequencyId || ""}
                          onChange={(e) => handleFrequencySelect(index, parseInt(e.target.value))}
                          style={{ borderRadius: '4px', minWidth: '90px' }}
                        >
                          <option value="">Select Frequency...</option>
                          {allFrequencies.map(freq => (
                            <option key={freq.frequencyId} value={freq.frequencyId}>
                              {freq.frequencyName}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Days */}
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.days}
                          onChange={(e) => handleTreatmentChange(index, "days", e.target.value)}
                          placeholder="0"
                          style={{ borderRadius: '4px', minWidth: '12px', maxWidth: '102px' }}
                        />
                      </td>

                      {/* Total - Auto-calculated based on itemClassId and adispQty */}
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.total}
                          onChange={(e) => handleTreatmentChange(index, "total", e.target.value)}
                          placeholder="0"
                          readOnly={row.drugId && row.dosage && row.days && row.frequencyId}
                          style={{
                            borderRadius: '4px',
                            minWidth: '20px',
                            maxWidth: '90px',
                            backgroundColor: (row.drugId && row.dosage && row.days && row.frequencyId) ? '#f8f9fa' : 'white'
                          }}
                        />
                      </td>

                      {/* Instruction */}
                      <td>
                        <select
                          className="form-select"
                          value={row.instruction}
                          onChange={(e) => handleTreatmentChange(index, "instruction", e.target.value)}
                          style={{ borderRadius: '4px', minWidth: '70px' }}
                        >
                          <option value="">Select Instruction...</option>
                          <option value="After Meal">After Meal</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="With Food">With Food</option>
                        </select>
                      </td>

                      {/* Stock */}
                      {/* <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.stock}
                          onChange={(e) => handleTreatmentChange(index, "stock", e.target.value)}
                          placeholder="0"
                          style={{ borderRadius: '4px', minWidth: '70px' }}
                        />
                      </td> */}

                      {/* Add Button */}
                      <td className="text-center align-middle">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={handleAddTreatmentItem}
                          style={{
                            borderRadius: '4px',
                            width: '35px',
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                          }}
                        >
                          +
                        </button>
                      </td>

                      {/* Delete Button */}
                      <td className="text-center align-middle">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveTreatmentItem(index)}
                          disabled={treatmentItems.length === 1}
                          style={{
                            borderRadius: '4px',
                            width: '35px',
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                          }}
                        >
                          −
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="row mt-4">
              <div className="col-md-12">
                <div className="d-flex gap-3 justify-content-start">
                  <button
                    className="btn btn-primary px-4"
                    onClick={handleSaveTemplate}
                    disabled={loading || !templateName.trim() || !templateCode.trim() || selectedDrugs.length === 0 || (templateType === 'create' && (isTemplateNameDuplicate() || isTemplateCodeDuplicate())) || (templateType === 'edit' && !selectedTemplateId && !selectedTemplate)}
                    style={{ borderRadius: '4px' }}
                  >
                    {loading ? 'SAVING...' : templateType === 'create' ? 'SAVE' : 'UPDATE'}
                  </button>
                  <button
                    className="btn btn-secondary px-4"
                    onClick={handleResetTemplate}
                    disabled={loading}
                    style={{ borderRadius: '4px' }}
                  >
                    RESET
                  </button>
                  <button
                    className="btn btn-secondary px-4"
                    onClick={handleCloseModal}
                    disabled={loading}
                    style={{ borderRadius: '4px' }}
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Message */}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  )
}

export default TreatmentModal
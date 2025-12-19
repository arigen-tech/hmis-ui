import { useState, useEffect, useRef } from "react"
import Popup from "../../../../Components/popup";
import ReactDOM from "react-dom"
import LoadingScreen from "../../../../Components/Loading"
import { postRequest, putRequest, getRequest } from "../../../../service/apiService"
import { MAS_FREQUENCY, MAS_DRUG_MAS, OPD_TEMPLATE, ITEM_CLASS, DRUG_TYPE } from "../../../../config/apiConfig";
import DuplicatePopup from "../DuplicatePopup";

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
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data is fully loaded
  const [duplicateItems, setDuplicateItems] = useState([]);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);


  const [drugDropdown, setDrugDropdown] = useState([]);
  const [drugSearch, setDrugSearch] = useState([]);
  const [drugPage, setDrugPage] = useState(0);
  const [drugLastPage, setDrugLastPage] = useState(true);
  const [activeDrugDropdown, setActiveDrugDropdown] = useState(null);

  const drugDebounceRef = useRef([]);
  const drugDropdownRef = useRef(null);


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

  // Fetch initial data - ONLY ONCE when modal opens
  useEffect(() => {
    if (show) {
      resetForm();
      // Fetch all data first
      const fetchData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchTemplates(),
            fetchDrugOptions(),
            fetchAllFrequencies()
          ]);
          setDataLoaded(true);

          // After data is loaded, load template if needed
          if (templateType === "edit" && selectedTemplate) {
            setSelectedTemplateId(selectedTemplate.templateId);
            loadTemplateData(selectedTemplate);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          showPopup("Failed to load data", "error");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [show, templateType]);

  // Load template data when template is selected from dropdown
  useEffect(() => {
    if (templateType === 'edit' && selectedTemplateId && templates.length > 0 && !selectedTemplate && dataLoaded) {
      const template = templates.find(t => t.templateId == selectedTemplateId);
      if (template) {
        loadTemplateData(template);
      }
    }
  }, [selectedTemplateId, templates, templateType, selectedTemplate, dataLoaded]);

  // Reload template data when drugs/frequencies become available
  useEffect(() => {
    if (templateType === "edit" && selectedTemplateId && templates.length > 0 && dataLoaded) {
      const template = templates.find(t => t.templateId == selectedTemplateId);
      if (template) {
        console.log("Reloading template data with available drugs/frequencies");
        loadTemplateData(template);
      }
    }
  }, [allDrugs, allFrequencies, selectedTemplateId, templateType, templates, dataLoaded]);

  const fetchTemplates = async (flag = 1) => {
    try {
      const response = await getRequest(`${OPD_TEMPLATE}/getAll/${flag}`);
      if (response && response.response) {
        setTemplates(response.response);
        return true;
      } else {
        showPopup("No templates found", "warning");
        return false;
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      showPopup("Failed to load templates", "error");
      return false;
    }
  };

  const fetchDrugOptions = async (searchText = "", page = 0) => {
    try {
      const response = await getRequest(
        `${MAS_DRUG_MAS}/getAllBySectionOnlyDynamic?flag=1&search=${encodeURIComponent(
          searchText
        )}&page=${page}&size=20`
      );

      if (response.status === 200 && response.response?.content) {
        return {
          list: response.response.content,
          last: response.response.last,
        };
      }

      return { list: [], last: true };
    } catch (err) {
      console.error("Error fetching drug options:", err);
      return { list: [], last: true };
    }
  };


  const handleDrugSearch = (value, index) => {
    setDrugSearch((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

    if (drugDebounceRef.current[index]) {
      clearTimeout(drugDebounceRef.current[index]);
    }

    drugDebounceRef.current[index] = setTimeout(async () => {
      if (!value.trim()) {
        setDrugDropdown([]);
        return;
      }

      const result = await fetchDrugOptions(value, 0);
      setDrugDropdown(result.list);
      setDrugLastPage(result.last);
      setDrugPage(0);
      setActiveDrugDropdown(index);
    }, 700);
  };


  const loadFirstDrugPage = async (index) => {
    const searchText = drugSearch[index] || "";
    const result = await fetchDrugOptions(searchText, 0);

    setDrugDropdown(result.list);
    setDrugLastPage(result.last);
    setDrugPage(0);
    setActiveDrugDropdown(index);
  };

  const loadMoreDrugs = async () => {
    if (drugLastPage || activeDrugDropdown === null) return;

    const nextPage = drugPage + 1;
    const result = await fetchDrugOptions(
      drugSearch[activeDrugDropdown] || "",
      nextPage
    );

    setDrugDropdown((prev) => [...prev, ...result.list]);
    setDrugLastPage(result.last);
    setDrugPage(nextPage);
  };


  const updateDrug = (selectedDrug, index) => {
    if (!selectedDrug) return;

    const isDuplicate = treatmentItems.some(
      (item, i) => item.drugId === selectedDrug.itemId && i !== index
    );

    if (isDuplicate) {
      setDuplicateItems([selectedDrug]);
      setShowDuplicatePopup(true);
      return;
    }

    setTreatmentItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        drugName: selectedDrug.nomenclature,
        dispUnit: selectedDrug.dispUnitName,
        drugId: selectedDrug.itemId,
        itemClassId: selectedDrug.itemClassId,
        aDispQty: selectedDrug.aDispQty ?? 1,
        total: calculateTotal({
          ...updated[index],
          aDispQty: selectedDrug.aDispQty ?? 1,
        }),
      };
      return updated;
    });

    setActiveDrugDropdown(null);
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        drugDropdownRef.current &&
        !drugDropdownRef.current.contains(e.target)
      ) {
        setActiveDrugDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);




  const fetchAllFrequencies = async () => {
    try {
      const response = await getRequest(`${MAS_FREQUENCY}/getAll/1`);
      if (response && response.response) {
        setAllFrequencies(response.response);
        console.log("Frequencies loaded:", response.response.length);
        return true;
      } else {
        console.warn("No frequencies found in response");
        setAllFrequencies([]);
        return false;
      }
    } catch (error) {
      console.error("Error fetching frequencies:", error);
      showPopup("Failed to load frequencies", "error");
      setAllFrequencies([]);
      return false;
    }
  };

  const loadTemplateData = (template) => {
    if (!dataLoaded) {
      console.log("Data not loaded yet, skipping template load");
      return;
    }

    setTemplateName(template.opdTemplateName || "");
    setTemplateCode(template.opdTemplateCode || "");

    if (template.treatments && template.treatments.length > 0) {
      const items = template.treatments.map(item => {
        // Find drug - use multiple possible properties for compatibility
        const drug = allDrugs.find(d =>
          d.id === item.itemId ||
          d.itemId === item.itemId ||
          d.drugId === item.itemId
        );

        // Find frequency
        const frequency = allFrequencies.find(f => f.frequencyId === item.frequencyId);

        console.log("Loading template item:", {
          itemId: item.itemId,
          foundDrug: drug ? drug.name : 'NOT FOUND',
          drugName: drug ? drug.name : null,
          allDrugsCount: allDrugs.length
        });

        // If drug not found, try to find it by name in the template data
        let finalDrugName = "";
        if (drug) {
          finalDrugName = drug.name;
        } else if (item.itemName) {
          // Use the itemName from template if drug not found in allDrugs
          finalDrugName = item.itemName;
        } else {
          // Last resort: show ID but not "Loading..."
          finalDrugName = `Drug (ID: ${item.itemId})`;
        }

        return {
          drugName: finalDrugName,
          drugId: item.itemId,
          dispUnit: drug ? drug.dispUnitName : (item.dispU || ""),
          dosage: item.dosage || "",
          frequency: frequency ? frequency.frequencyName : "OD",
          frequencyId: item.frequencyId,
          days: item.noOfDays || "",
          total: item.total || "",
          instruction: item.instruction || "",
          stock: "",
          itemClassId: drug ? drug.itemClassId : null,
          adispQty: drug ? drug.adispQty : null,
        };
      });

      setTreatmentItems(items);

      // Extract selected drug IDs
      const drugIds = template.treatments
        .map(item => item.itemId)
        .filter(id => id !== null);
      setSelectedDrugs(drugIds);

      console.log("Template loaded successfully:", {
        templateName: template.opdTemplateName,
        itemsCount: items.length,
        selectedDrugs: drugIds
      });
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
      }]);
      setSelectedDrugs([]);
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateCode("");
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
    }]);
    setSelectedDrugs([]);
    setSelectedTemplateId("");
    setActiveRowIndex(null);
    setDropdownVisible(false);
    setDataLoaded(false);
  };

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
    ]);
  };

const handleRemoveTreatmentItem = (index) => {
  const itemToRemove = treatmentItems[index];
  const onlyOneRow = treatmentItems.length === 1;

  const isEmptyRow =
    !itemToRemove.drugName &&
    !itemToRemove.drugId &&
    !itemToRemove.dispUnit &&
    !itemToRemove.dosage &&
    !itemToRemove.days &&
    !itemToRemove.total &&
    !itemToRemove.instruction &&
    !itemToRemove.stock &&
    !itemToRemove.itemClassId &&
    !itemToRemove.adispQty;

  // Only one row & empty → do nothing
  if (onlyOneRow && isEmptyRow) return;

  // Remove from selected drugs if exists
  if (itemToRemove.drugId) {
    setSelectedDrugs((prev) =>
      prev.filter((id) => id !== itemToRemove.drugId)
    );
  }

  let newItems = treatmentItems.filter((_, i) => i !== index);

  // Only one row existed and had data → reset to empty row
  if (onlyOneRow) {
    newItems = [
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
    ];
  }

  setTreatmentItems(newItems);
};


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
      return allDrugs.slice(0, 5);
    }

    const filtered = allDrugs.filter(drug =>
      drug.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.code?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    return filtered;
  };

  const handleDrugSelect = (index, drug) => {
    // Check if this drug is already selected in a DIFFERENT row
    const drugAlreadyInOtherRow = selectedDrugs.some(
      id => id === drug.id && treatmentItems[index]?.drugId !== drug.id
    );

    if (drugAlreadyInOtherRow) {
      showPopup("This drug is already added to the template", "error");
      return;
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
  };

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
  };

  // Only check for duplicates during CREATE operation
  const isTemplateNameDuplicate = () => {
    if (templateType === 'edit') return false;
    return templates.some(template =>
      template.opdTemplateName.toLowerCase() === templateName.trim().toLowerCase()
    );
  };

  // Only check for duplicates during CREATE operation
  const isTemplateCodeDuplicate = () => {
    if (templateType === 'edit') return false;
    return templates.some(template =>
      template.opdTemplateCode.toLowerCase() === templateCode.trim().toLowerCase()
    );
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateCode.trim()) {
      showPopup("Please fill in template name and code", "error");
      return;
    }

    if (selectedDrugs.length === 0) {
      showPopup("Please add at least one treatment item", "error");
      return;
    }

    const uniqueDrugs = [...new Set(selectedDrugs)];
    if (uniqueDrugs.length !== selectedDrugs.length) {
      showPopup("Duplicate drugs found. Please remove duplicates before saving.", "error");
      return;
    }

    // Validate all required fields
    for (let i = 0; i < treatmentItems.length; i++) {
      const item = treatmentItems[i];
      if (!item.drugId || !item.dosage || !item.days || !item.frequencyId) {
        showPopup(`Please fill all required fields in row ${i + 1}`, "error");
        return;
      }
    }

    try {
      setLoading(true);

      // Only validate duplicates for create operation
      if (templateType === "create") {
        if (isTemplateNameDuplicate()) {
          showPopup("Template name already exists. Please use a different name.", "error");
          return;
        }
        if (isTemplateCodeDuplicate()) {
          showPopup("Template code already exists. Please use a different code.", "error");
          return;
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
      };

      let response;
      if (templateType === "create") {
        response = await postRequest(`${OPD_TEMPLATE}/save`, requestData);
      } else if (templateType === "edit") {
        const templateId = selectedTemplate ? selectedTemplate.templateId : selectedTemplateId;
        if (!templateId) {
          showPopup("Please select a template to update", "error");
          return;
        }
        response = await putRequest(
          `${OPD_TEMPLATE}/updateOpdTemplateTreatment/${templateId}`,
          requestData
        );
      }

      if (response && response.status === 200) {
        showPopup(
          `Template ${templateType === 'create' ? 'created' : 'updated'} successfully!`,
          "success"
        );
        resetForm();
        if (onTemplateSaved) {
          onTemplateSaved(response.response);
        }
      } else {
        throw new Error(response?.message || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      if (error.response?.data?.message?.includes('duplicate') ||
        error.message?.includes('duplicate') ||
        error.response?.data?.message?.includes('already exists')) {
        showPopup(
          "Template name or code already exists. Please use different values.",
          "error"
        );
      } else {
        showPopup(
          `Failed to ${templateType === 'create' ? 'create' : 'update'} template: ${error.message}`,
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetTemplate = () => {
    resetForm();
  };

  const showPopup = (message, type = 'info') => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      }
    });
  };

  const handleCloseModal = () => {
    if (popupMessage) {
      setPopupMessage(null);
    }
    onClose();
  };

  if (!show) return null;

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
            <DuplicatePopup
              show={showDuplicatePopup}
              duplicates={duplicateItems}
              onClose={() => setShowDuplicatePopup(false)}
            />
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
                    disabled={!dataLoaded}
                  >
                    <option value="">Select Template</option>
                    {!dataLoaded ? (
                      <option value="" disabled>Loading templates...</option>
                    ) : (
                      templates.map(template => (
                        <option key={template.templateId} value={template.templateId}>
                          {template.opdTemplateName} ({template.opdTemplateCode})
                        </option>
                      ))
                    )}
                  </select>
                  {!dataLoaded && (
                    <div className="text-info small mt-1">Loading templates...</div>
                  )}
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
                  disabled={!dataLoaded}
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
                  disabled={!dataLoaded}
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
                    <th style={{ minWidth: '74px', maxWidth: '74px' }}>DISP. UNIT</th>
                    <th style={{ minWidth: '74px', maxWidth: '74px' }}>DOSAGE</th>
                    <th style={{ minWidth: '90px' }}>FREQUENCY</th>
                    <th style={{ minWidth: '12px', maxWidth: '12px' }}>DAYS</th>
                    <th style={{ minWidth: '80px' }}>TOTAL</th>
                    <th style={{ minWidth: '70px' }}>INSTRUCTION</th>
                    <th style={{ minWidth: '40px' }}>ADD</th>
                    <th style={{ minWidth: '40px' }}>DELETE</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentItems.map((row, index) => (
                    <tr key={index}>
                      {/* Drug Name with Search Dropdown */}
                      <td>
                        <div
                          className="position-relative"
                          style={{ width: "100%", zIndex: 20 }}
                          ref={drugDropdownRef}
                        >
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search Drug..."
                            value={
                              treatmentItems[index].drugName ||
                              drugSearch[index] ||
                              ""
                            }
                            onChange={(e) =>
                              handleDrugSearch(e.target.value, index)
                            }
                            onClick={() => {
                              loadFirstDrugPage(index);
                              setActiveDrugDropdown(index);
                            }}
                            onBlur={() => {
                              setTimeout(() => setActiveDrugDropdown(null), 200);
                            }}
                            autoComplete="off"
                          />

                          {activeDrugDropdown === index && (
                            <div
                              className="border rounded mt-1 bg-white position-absolute w-100"
                              style={{
                                maxHeight: "220px",
                                zIndex: 9999,
                                overflowY: "auto",
                              }}
                              onScroll={(e) => {
                                if (
                                  e.target.scrollHeight - e.target.scrollTop ===
                                  e.target.clientHeight
                                ) {
                                  loadMoreDrugs();
                                }
                              }}
                            >
                              {drugDropdown.length > 0 ? (
                                drugDropdown.map((drug) => (
                                  <div
                                    key={drug.itemId}
                                    className="p-2 cursor-pointer"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => updateDrug(drug, index)}
                                  >
                                    <strong>{drug.nomenclature}</strong> — {drug.pvmsNo}
                                  </div>
                                ))
                              ) : (
                                <div className="p-2 text-muted">
                                  No results found
                                </div>
                              )}

                              {!drugLastPage && (
                                <div className="text-center p-2 small text-primary">
                                  Loading...
                                </div>
                              )}
                            </div>
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
                          style={{ borderRadius: '4px', minWidth: '20px', maxWidth: '80px', backgroundColor: '#f8f9fa' }}
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
                          disabled={!dataLoaded}
                        />
                      </td>

                      {/* Frequency */}
                      <td>
                        <select
                          className="form-select"
                          value={row.frequencyId || ""}
                          onChange={(e) => handleFrequencySelect(index, parseInt(e.target.value))}
                          style={{ borderRadius: '4px', minWidth: '90px' }}
                          disabled={!dataLoaded}
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
                          style={{ borderRadius: '4px', minWidth: '60px', maxWidth: '60px' }}
                          disabled={!dataLoaded}
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
                          disabled={!dataLoaded}
                        />
                      </td>

                      {/* Instruction */}
                      <td>
                        <select
                          className="form-select"
                          value={row.instruction}
                          onChange={(e) => handleTreatmentChange(index, "instruction", e.target.value)}
                          style={{ borderRadius: '4px', minWidth: '70px' }}
                          disabled={!dataLoaded}
                        >
                          <option value="">Select Instruction...</option>
                          <option value="After Meal">After Meal</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="With Food">With Food</option>
                        </select>
                      </td>

                      {/* Add Button */}
                      <td className="text-center align-middle">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={handleAddTreatmentItem}
                          disabled={!dataLoaded}
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
  disabled={
    !dataLoaded ||
    (
      treatmentItems.length === 1 &&
      !treatmentItems[0].drugName &&
      !treatmentItems[0].drugId &&
      !treatmentItems[0].dispUnit &&
      !treatmentItems[0].dosage &&
      !treatmentItems[0].days &&
      !treatmentItems[0].total &&
      !treatmentItems[0].instruction &&
      !treatmentItems[0].stock &&
      !treatmentItems[0].itemClassId &&
      !treatmentItems[0].adispQty
    )
  }
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
                    disabled={loading || !templateName.trim() || !templateCode.trim() || selectedDrugs.length === 0 || (templateType === 'create' && (isTemplateNameDuplicate() || isTemplateCodeDuplicate())) || (templateType === 'edit' && !selectedTemplateId && !selectedTemplate) || !dataLoaded}
                    style={{ borderRadius: '4px' }}
                  >
                    {loading ? 'SAVING...' : templateType === 'create' ? 'SAVE' : 'UPDATE'}
                  </button>
                  <button
                    className="btn btn-secondary px-4"
                    onClick={handleResetTemplate}
                    disabled={loading || !dataLoaded}
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
  );
};

export default TreatmentModal;
import { useState, useEffect, useRef } from "react";
import Popup from "../../../../Components/popup";
import LoadingScreen from "../../../../Components/Loading";
import {
  postRequest,
  putRequest,
  getRequest,
} from "../../../../service/apiService";
import {
  MAS_INVESTIGATION,
  MAS_INVESTIGATION_GET_ALL,
  MAS_INVESTIGATION_UNIQUE_TYPES,
  OPD_TEMPLATE,
  OPD_TEMPLATE_GET_ALL_INVESTIGATIONS_TEMPLATES,
  OPD_TEMPLATE_UPDATE_INVESTIGATIONS_TEMPLATE,
} from "../../../../config/apiConfig";

const InvestigationModal = ({
  show,
  onClose,
  templateType = "create",
  selectedTemplate = null,
  onTemplateSaved,
}) => {
  // State management
  const [templateName, setTemplateName] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [investigationType, setInvestigationType] = useState("");
  const [investigationItems, setInvestigationItems] = useState([
    {
      displayValue: "",
      date: new Date().toISOString().split("T")[0],
      investigationId: null,
    },
  ]);
  const [templates, setTemplates] = useState([]);
  const [allInvestigations, setAllInvestigations] = useState([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [selectedInvestigations, setSelectedInvestigations] = useState([]);
  const [investigationTypes, setInvestigationTypes] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [investigationDropdown, setInvestigationDropdown] = useState([]);
  const [investigationSearch, setInvestigationSearch] = useState([]);
  const [investigationPage, setInvestigationPage] = useState(0);
  const [investigationLastPage, setInvestigationLastPage] = useState(true);
  const [openInvestigationDropdown, setOpenInvestigationDropdown] =
    useState(null);
  const [pendingTemplateToLoad, setPendingTemplateToLoad] = useState(null);

  const debounceInvestigationRef = useRef([]);
  const dropdownInvestigationRef = useRef(null);
  const [labFlag, setLabFlag] = useState("");
  const [radioFlag, setRadioFlag] = useState("");

  const getToday = () => new Date().toISOString().split("T")[0];

  // Reset form when modal opens/closes or templateType changes
  useEffect(() => {
    if (show) {
      resetForm();
      fetchTemplates();
      fetchInvestigations();

      if (templateType === "edit" && selectedTemplate) {
        setSelectedTemplateId(selectedTemplate.templateId);
        loadTemplateData(selectedTemplate);
      }
    }
  }, [show, templateType, selectedTemplate]);

  // Extract investigation types from API response
  useEffect(() => {
    if (allInvestigations.length > 0) {
      extractInvestigationTypes();
    }
  }, [allInvestigations]);

  // Load template data when template is selected from dropdown
  useEffect(() => {
    if (
      templateType === "edit" &&
      selectedTemplateId &&
      templates.length > 0 &&
      !selectedTemplate
    ) {
      const template = templates.find(
        (t) => t.templateId == selectedTemplateId,
      );
      if (template) {
        loadTemplateData(template);
      }
    }
  }, [selectedTemplateId, templates, templateType, selectedTemplate]);

  // Filter investigations based on type
  useEffect(() => {
    filterInvestigations();
  }, [investigationType, allInvestigations]);

  const extractInvestigationTypes = () => {
    const uniqueTypes = [];
    const typeMap = new Map();

    allInvestigations.forEach((inv) => {
      const typeId = inv.mainChargeCodeId;
      const typeName = inv.mainChargeCodeName;

      if (typeId && typeName && !typeMap.has(typeId)) {
        typeMap.set(typeId, typeName);
        uniqueTypes.push({
          id: typeId,
          name: typeName,
          value: typeName.toLowerCase().replace(/\s+/g, "-"),
        });
      }
    });

    setInvestigationTypes(uniqueTypes);
  };

  const fetchTemplates = async (flag = 1) => {
    try {
      setLoading(true);
      const response = await getRequest(
        `${OPD_TEMPLATE}/getInvestigationsTemplates/${flag}`,
      );
      if (response && response.status === 200 && response.response) {
        setTemplates(response.response);
      } else if (
        response &&
        response.response &&
        response.response.length === 0
      ) {
        setTemplates([]);
        console.log("No investigation templates found");
      } else {
        showPopup("Failed to load investigation templates", "error");
      }
    } catch (error) {
      console.error("Error fetching investigation templates:", error);
      showPopup("Failed to load investigation templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadInitialInvestigations = async () => {
    try {
      setLoading(true);
      const result = await fetchInvestigations(0, "");
      if (result && result.list) {
        setAllInvestigations(result.list);
      }
    } catch (error) {
      console.error("Error loading initial investigations:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSaveButtonDisabled = () => {
    if (loading || !templateName.trim() || !templateCode.trim()) {
      return true;
    }

    if (investigationItems.length === 0) {
      return true;
    }

    const allInvestigationsValid = investigationItems.every((item) => {
      return (
        item.investigationId !== null &&
        item.investigationId !== undefined &&
        item.investigationId !== ""
      );
    });

    if (!allInvestigationsValid) {
      return true;
    }

    const investigationIds = investigationItems
      .filter((item) => item.investigationId)
      .map((item) => item.investigationId);
    const hasDuplicates =
      new Set(investigationIds).size !== investigationIds.length;

    if (hasDuplicates) {
      return true;
    }

    if (templateType === "create") {
      if (isTemplateNameDuplicate() || isTemplateCodeDuplicate()) {
        return true;
      }
    }

    if (templateType === "edit" && !selectedTemplateId && !selectedTemplate) {
      return true;
    }

    return false;
  };

  const fetchInvestigations = async (page, searchText = "") => {
    try {
      let url = `${MAS_INVESTIGATION_GET_ALL}?flag=1&page=${page}&size=20`;

      if (searchText) {
        url += `&search=${encodeURIComponent(searchText)}`;
      }

      if (investigationType && !isNaN(Number(investigationType))) {
        url += `&mainChargeCodeId=${Number(investigationType)}`;
      } else if (investigationType) {
        console.warn(
          "Invalid investigationType (not numeric):",
          investigationType,
        );
      }

      const data = await getRequest(url);

      if (data.status === 200 && data.response?.content) {
        return {
          list: data.response.content,
          last: data.response.last,
        };
      }

      return { list: [], last: true };
    } catch (error) {
      console.error("Error fetching investigations:", error);
      return { list: [], last: true };
    }
  };

  const loadFirstInvestigationPage = async (index) => {
    const searchText = investigationSearch[index] || "";
    const result = await fetchInvestigations(0, searchText);
    setInvestigationDropdown(result.list);
    setInvestigationLastPage(result.last);
    setInvestigationPage(0);
  };

  const handleInvestigationSearch = (value, index) => {
    setInvestigationSearch((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

    if (debounceInvestigationRef.current[index]) {
      clearTimeout(debounceInvestigationRef.current[index]);
    }

    debounceInvestigationRef.current[index] = setTimeout(async () => {
      if (!value.trim()) {
        setInvestigationDropdown([]);
        return;
      }

      const result = await fetchInvestigations(0, value);
      setInvestigationDropdown(result.list);
      setInvestigationLastPage(result.last);
      setInvestigationPage(0);
      setOpenInvestigationDropdown(index);
    }, 700);
  };

  const loadMoreInvestigations = async () => {
    if (investigationLastPage || openInvestigationDropdown === null) return;

    const nextPage = investigationPage + 1;
    const result = await fetchInvestigations(
      nextPage,
      investigationSearch[openInvestigationDropdown] || "",
    );

    setInvestigationDropdown((prev) => [...prev, ...result.list]);
    setInvestigationLastPage(result.last);
    setInvestigationPage(nextPage);
  };

  const updateInvestigation = (selected, index) => {
    if (!selected) return;

    // Remove old investigation ID if exists
    const oldId = investigationItems[index]?.investigationId;

    setInvestigationItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        investigationId: selected.investigationId,
        name: selected.investigationName,
      };
      return updated;
    });

    // Update selected investigations
    setSelectedInvestigations((prev) => {
      let updated = [...prev];
      if (oldId) {
        updated = updated.filter((id) => id !== oldId);
      }
      if (!updated.includes(selected.investigationId)) {
        updated.push(selected.investigationId);
      }
      return updated;
    });

    setInvestigationSearch((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });

    setOpenInvestigationDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownInvestigationRef.current &&
        !dropdownInvestigationRef.current.contains(e.target)
      ) {
        setOpenInvestigationDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterInvestigations = () => {
    let filtered = allInvestigations;

    if (investigationType && investigationTypes.length > 0) {
      const selectedType = investigationTypes.find(
        (type) => type.id === investigationType,
      );
      if (selectedType) {
        filtered = filtered.filter(
          (inv) => inv.mainChargeCodeId === selectedType.id,
        );
      }
    }

    setFilteredInvestigations(filtered);
    setInvestigationDropdown(filtered.slice(0, 20));
  };

  const fetchInvestigationTypes = async () => {
    const res = await getRequest(MAS_INVESTIGATION_UNIQUE_TYPES);
    if (res?.response) {
      setInvestigationTypes(res.response);
    }
  };

  useEffect(() => {
    fetchInvestigationTypes();
  }, []);

  const loadTemplateData = (template) => {
    console.log("Loading investigation template data:", template);
    setTemplateName(template.opdTemplateName || "");
    setTemplateCode(template.opdTemplateCode || "");

    const investigations =
      template.investigations || template.investigationResponseList || [];

    if (investigations.length > 0) {
      const items = investigations.map((item) => {
        return {
          investigationId: item.investigationId,
          name:
            item.investigationName || `Investigation #${item.investigationId}`,
          displayValue:
            item.investigationName || `Investigation #${item.investigationId}`,
          date: getToday(),
          templateInvestigationId: item.templateInvestigationId,
        };
      });
      setInvestigationItems(items);

      const investigationIds = items
        .filter((item) => item.investigationId)
        .map((item) => item.investigationId);

      if (investigationIds.length > 0) {
        setSelectedInvestigations(investigationIds);
        console.log("Set selected investigations:", investigationIds);
      }
    } else {
      setInvestigationItems([
        {
          displayValue: "",
          date: getToday(),
          investigationId: null,
        },
      ]);
      setSelectedInvestigations([]);
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateCode("");
    setInvestigationType(investigationTypes[0]?.id || "");
    setInvestigationItems([
      {
        displayValue: "",
        date: getToday(),
        investigationId: null,
      },
    ]);
    setSelectedInvestigations([]);
    setSelectedTemplateId("");
    setActiveRowIndex(null);
    setPendingTemplateToLoad(null);
  };

  const handleAddInvestigationItem = () => {
    setInvestigationItems((prev) => [
      ...prev,
      {
        displayValue: "",
        date: getToday(),
        investigationId: null,
      },
    ]);
  };

  const handleRemoveInvestigationItem = (index) => {
    const itemToRemove = investigationItems[index];

    // Remove from selectedInvestigations
    if (itemToRemove.investigationId) {
      setSelectedInvestigations((prev) =>
        prev.filter((id) => id !== itemToRemove.investigationId),
      );
    }

    let newItems = investigationItems.filter((_, i) => i !== index);

    if (newItems.length === 0) {
      newItems = [
        {
          displayValue: "",
          date: getToday(),
          investigationId: null,
        },
      ];
    }

    setInvestigationItems(newItems);
  };

  const handleRowChange = (index, field, value) => {
    const newItems = [...investigationItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvestigationItems(newItems);
  };

  const handleInvestigationSelect = (index, investigation) => {
    const investigationIdAlreadyInOtherRow = selectedInvestigations.some(
      (id) =>
        id === investigation.investigationId &&
        investigationItems[index]?.investigationId !==
          investigation.investigationId,
    );

    if (investigationIdAlreadyInOtherRow) {
      showPopup("This investigation is already added to the template", "error");
      return;
    }

    const newItems = [...investigationItems];
    const existingItem = newItems.find(
      (item) => item.investigationId === investigation.investigationId,
    );
    const existingTemplateInvestigationId = existingItem
      ? existingItem.templateInvestigationId
      : null;

    newItems[index] = {
      ...newItems[index],
      displayValue: investigation.investigationName,
      name: investigation.investigationName,
      investigationId: investigation.investigationId,
      templateInvestigationId: existingTemplateInvestigationId,
    };
    setInvestigationItems(newItems);

    setSelectedInvestigations((prev) => {
      const oldId = investigationItems[index]?.investigationId;
      let updated = prev.filter((id) => id !== oldId);
      updated = [...updated, investigation.investigationId];
      return updated;
    });

    setActiveRowIndex(null);
  };

  const isTemplateNameDuplicate = () => {
    if (templateType === "edit") return false;
    return templates.some(
      (template) =>
        template.opdTemplateName.toLowerCase() ===
        templateName.trim().toLowerCase(),
    );
  };

  const isTemplateCodeDuplicate = () => {
    if (templateType === "edit") return false;
    return templates.some(
      (template) =>
        template.opdTemplateCode.toLowerCase() ===
        templateCode.trim().toLowerCase(),
    );
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateCode.trim()) {
      showPopup("Please fill in template name and code", "error");
      return;
    }

    if (selectedInvestigations.length === 0) {
      showPopup("Please add at least one investigation", "error");
      return;
    }

    const uniqueInvestigations = [...new Set(selectedInvestigations)];
    if (uniqueInvestigations.length !== selectedInvestigations.length) {
      showPopup(
        "Duplicate investigations found. Please remove duplicates before saving.",
        "error",
      );
      return;
    }

    try {
      setLoading(true);

      if (templateType === "create") {
        if (isTemplateNameDuplicate()) {
          showPopup(
            "Template name already exists. Please use a different name.",
            "error",
          );
          return;
        }
        if (isTemplateCodeDuplicate()) {
          showPopup(
            "Template code already exists. Please use a different code.",
            "error",
          );
          return;
        }
      }

      if (templateType === "create") {
        const requestData = {
          opdTemplateName: templateName.trim(),
          opdTemplateCode: templateCode.trim(),
          investigationRequestList: selectedInvestigations.map((invId) => ({
            templateInvestigationId: null,
            investigationId: invId,
          })),
          treatments: [],
        };

        const response = await postRequest(
          `${OPD_TEMPLATE}/create-opdTemplate`,
          requestData,
        );

        if (response && response.status === 200) {
          showPopup("Template created successfully!", "success");
          resetForm();
          if (onTemplateSaved) {
            onTemplateSaved(response.response);
          }
        } else {
          throw new Error(response?.message || "Failed to save template");
        }
      } else if (templateType === "edit") {
        const templateId = selectedTemplate
          ? selectedTemplate.templateId
          : selectedTemplateId;
        if (!templateId) {
          showPopup("Please select a template to update", "error");
          return;
        }

        const currentTemplate =
          selectedTemplate || templates.find((t) => t.templateId == templateId);

        if (!currentTemplate) {
          showPopup("Template not found", "error");
          return;
        }

        // Build the investigations list with proper templateInvestigationId
        const opdTempInvest = [];
        const deletedTempIvs = [];
        // Check which investigation items to keep/delete
        if (
          currentTemplate.investigationResponseList &&
          currentTemplate.investigationResponseList.length > 0
        ) {
          currentTemplate.investigationResponseList.forEach((existingItem) => {
            const isStillPresent = selectedInvestigations.includes(
              existingItem.investigationId,
            );

            if (isStillPresent) {
              // Keep existing investigation
              opdTempInvest.push({
                templateInvestigationId: existingItem.templateInvestigationId,
                investigationId: existingItem.investigationId,
              });
            } else {
              // Mark for deletion
              deletedTempIvs.push(existingItem.templateInvestigationId);
            }
          });
        }

        // Add new investigations that don't have templateInvestigationId yet
        selectedInvestigations.forEach((invId) => {
          const alreadyExists = opdTempInvest.some(
            (item) => item.investigationId === invId,
          );

          if (!alreadyExists) {
            opdTempInvest.push({
              templateInvestigationId: null,
              investigationId: invId,
            });
          }
        });
        const requestData = {
          templateId: parseInt(templateId),
          opdTempInvest: opdTempInvest,
          deletedTempIvs: deletedTempIvs,
        };

        console.log("Update Request Data:", requestData);

        const response = await putRequest(
          `${OPD_TEMPLATE_UPDATE_INVESTIGATIONS_TEMPLATE}/${templateId}`,
          requestData,
        );

        if (response && response.status === 200) {
          showPopup("Template updated successfully!", "success");
          resetForm();
          fetchTemplates();
          if (onTemplateSaved) {
            onTemplateSaved(response.response);
          }
        } else {
          throw new Error(response?.message || "Failed to update template");
        }
      }
    } catch (error) {
      console.error("Error saving template:", error);
      if (
        error.response?.data?.message?.includes("duplicate") ||
        error.message?.includes("duplicate") ||
        error.response?.data?.message?.includes("already exists")
      ) {
        showPopup(
          "Template name or code already exists. Please use different values.",
          "error",
        );
      } else {
        showPopup(
          `Failed to ${templateType === "create" ? "create" : "update"} template: ${error.message}`,
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetTemplate = () => {
    resetForm();
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const handleCloseModal = () => {
    if (popupMessage) {
      setPopupMessage(null);
    }
    onClose();
  };

  if (!show) return null;
  //   debugger
  //   console.log( loading ||
  //                   !templateName.trim() ||
  //                   !templateCode.trim() ||
  //                   selectedInvestigations.length === 0 ||
  //                   (templateType === "create" &&
  //                     (isTemplateNameDuplicate() || isTemplateCodeDuplicate())) ||
  //                   (templateType === "edit" &&
  //                     !selectedTemplateId &&
  //                     !selectedTemplate));

  return (
    <div
      className="modal fade show d-block"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1050,
      }}
    >
      <div
        className="modal-dialog"
        style={{
          margin: "0 auto",
          position: "fixed",
          top: "50%",
          left: "55%",
          transform: "translate(-50%, -50%)",
          width: "70%",
          maxWidth: "900px",
          height: "auto",
          maxHeight: "80vh",
        }}
      >
        <div
          className="modal-content"
          style={{
            height: "auto",
            maxHeight: "80vh",
            overflow: "hidden",
            borderRadius: "8px",
            border: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            className="modal-header"
            style={{
              backgroundColor: "#2c7da0",
              color: "white",
              borderBottom: "1px solid #245e7a",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <h5 className="modal-title fw-bold fs-6">
              {templateType === "create" ? "CREATE" : "EDIT"} INVESTIGATION
              TEMPLATE
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleCloseModal}
              style={{ margin: 0 }}
            ></button>
          </div>

          <div
            className="modal-body"
            style={{
              padding: "1.5rem",
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {loading && <LoadingScreen />}

            {/* Template Selection Dropdown */}
            {templateType === "edit" && !selectedTemplate && (
              <div className="mb-4">
                <label className="form-label fw-bold small mb-1">
                  SELECT TEMPLATE *
                </label>
                <select
                  className="form-control form-control-sm"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{ borderRadius: "4px" }}
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option
                      key={template.templateId}
                      value={template.templateId}
                    >
                      {template.opdTemplateName} ({template.opdTemplateCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Template Name and Code */}
            <div className="row mb-4">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold small mb-1">
                  TEMPLATE NAME *
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${
                    templateType === "create" && isTemplateNameDuplicate()
                      ? "is-invalid"
                      : ""
                  }`}
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  style={{ borderRadius: "4px" }}
                />
                {templateType === "create" && isTemplateNameDuplicate() && (
                  <div className="text-danger small mt-1">
                    Template name already exists
                  </div>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold small mb-1">
                  TEMPLATE CODE *
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${
                    templateType === "create" && isTemplateCodeDuplicate()
                      ? "is-invalid"
                      : ""
                  }`}
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  placeholder="Enter template code"
                  style={{ borderRadius: "4px" }}
                />
                {templateType === "create" && isTemplateCodeDuplicate() && (
                  <div className="text-danger small mt-1">
                    Template code already exists
                  </div>
                )}
              </div>
            </div>

            {/* Investigation Type Radio Buttons */}
            <div className="row mb-4">
              <div className="col-12">
                <label className="form-label fw-bold small mb-2">
                  INVESTIGATION TYPE
                </label>
                <div className="d-flex gap-3 flex-wrap">
                  {investigationTypes.length > 0 ? (
                    investigationTypes.map((type) => (
                      <div key={type.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="investigationType"
                          id={`inv-type-${type.id}`}
                          value={type.id}
                          checked={investigationType === type.id}
                          onChange={() => {
                            setInvestigationType(type.id);
                            if (type.name === "Laboratory") {
                              setLabFlag("y");
                              setRadioFlag("n");
                            } else if (type.name === "Radiology") {
                              setRadioFlag("y");
                              setLabFlag("n");
                            } else {
                              setLabFlag("n");
                              setRadioFlag("n");
                            }
                          }}
                        />
                        <label
                          className="form-check-label fw-bold ms-1"
                          htmlFor={`inv-type-${type.id}`}
                        >
                          {type.name.toUpperCase()}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted small">
                      Loading investigation types...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Investigation Items Table */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold small mb-0">
                    INVESTIGATION ITEMS
                  </label>
                  <small className="text-muted">
                    {selectedInvestigations.length} item(s) selected
                  </small>
                </div>
                <div
                  className="table-responsive"
                  style={{ overflow: "visible" }}
                >
                  <table
                    className="table table-bordered table-sm"
                    style={{ marginBottom: 0 }}
                  >
                    <thead className="table-light">
                      <tr>
                        <th
                          style={{
                            width: "60%",
                            padding: "8px",
                            fontSize: "0.875rem",
                          }}
                        >
                          Investigation
                        </th>
                        <th
                          style={{
                            width: "25%",
                            padding: "8px",
                            fontSize: "0.875rem",
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            width: "7.5%",
                            padding: "8px",
                            fontSize: "0.875rem",
                          }}
                          className="text-center"
                        >
                          Add
                        </th>
                        <th
                          style={{
                            width: "7.5%",
                            padding: "8px",
                            fontSize: "0.875rem",
                          }}
                          className="text-center"
                        >
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {investigationItems.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: "6px" }}>
                            <div
                              className="position-relative w-100"
                              ref={dropdownInvestigationRef}
                            >
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search Investigation..."
                                value={
                                  investigationItems[index].name ||
                                  investigationSearch[index] ||
                                  ""
                                }
                                onChange={(e) =>
                                  handleInvestigationSearch(
                                    e.target.value,
                                    index,
                                  )
                                }
                                onClick={() => {
                                  loadFirstInvestigationPage(index);
                                  setOpenInvestigationDropdown(index);
                                }}
                                onBlur={() => {
                                  setTimeout(
                                    () => setOpenInvestigationDropdown(null),
                                    200,
                                  );
                                }}
                                autoComplete="off"
                              />

                              {openInvestigationDropdown === index && (
                                <div
                                  className="border rounded mt-1 bg-white position-absolute w-100"
                                  style={{
                                    maxHeight: "220px",
                                    zIndex: 9999,
                                    overflowY: "auto",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  }}
                                  onScroll={(e) => {
                                    if (
                                      e.target.scrollHeight -
                                        e.target.scrollTop ===
                                      e.target.clientHeight
                                    ) {
                                      loadMoreInvestigations();
                                    }
                                  }}
                                >
                                  {investigationDropdown.length > 0 ? (
                                    investigationDropdown.map((inv) => (
                                      <div
                                        key={inv.investigationId}
                                        className="p-2"
                                        style={{
                                          cursor: "pointer",
                                          borderBottom: "1px solid #eee",
                                          padding: "8px",
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.backgroundColor =
                                            "#f8f9fa")
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.backgroundColor =
                                            "white")
                                        }
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          updateInvestigation(inv, index);
                                        }}
                                      >
                                        <strong>{inv.investigationName}</strong>
                                        <div className="text-muted small">
                                          {inv.mainChargeCodeName} •{" "}
                                          {inv.subChargeCodeName}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-2 text-muted">
                                      No results found
                                    </div>
                                  )}
                                  {!investigationLastPage && (
                                    <div className="text-center p-2 text-primary small">
                                      Loading...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "6px" }}>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={item.date}
                              onChange={(e) =>
                                handleRowChange(index, "date", e.target.value)
                              }
                            />
                          </td>
                          <td className="text-center align-middle">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={handleAddInvestigationItem}
                            >
                              +
                            </button>
                          </td>
                          <td className="text-center align-middle">
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                handleRemoveInvestigationItem(index)
                              }
                              disabled={
                                investigationItems.length === 1 &&
                                !investigationItems[0].displayValue &&
                                !investigationItems[0].investigationId
                              }
                            >
                              −
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#f8f9fa",
              borderRadius: "0 0 8px 8px",
            }}
          >
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary btn-sm px-3"
                onClick={handleSaveTemplate}
                disabled={isSaveButtonDisabled()}
                style={{
                  borderRadius: "4px",
                  backgroundColor: "#2c7da0",
                  border: "none",
                }}
              >
                {loading
                  ? "SAVING..."
                  : templateType === "create"
                    ? "SAVE"
                    : "UPDATE"}
              </button>
              <button
                className="btn btn-secondary btn-sm px-3"
                onClick={handleResetTemplate}
                disabled={loading}
              >
                RESET
              </button>
              <button
                className="btn btn-secondary btn-sm px-3"
                onClick={handleCloseModal}
                disabled={loading}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      </div>

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

export default InvestigationModal;

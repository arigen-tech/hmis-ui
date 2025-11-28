import { useState, useEffect } from "react"
import { getRequest, putRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"

const ResultValidation = () => {
  const [resultList, setResultList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [confirmationPopup, setConfirmationPopup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [masterValidate, setMasterValidate] = useState(false)
  const [masterReject, setMasterReject] = useState(false)
  const itemsPerPage = 5

  // Fetch unvalidated results data
  useEffect(() => {
    fetchUnvalidatedResults()
  }, [])

  const fetchUnvalidatedResults = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/unvalidated`);

      if (data.status === 200 && data.response) {
        const formattedData = formatValidationData(data.response);
        setResultList(formattedData);
      } else {
        console.error('Error fetching unvalidated results:', data.message);
        showPopup('Failed to load unvalidated results', 'error')
      }
    } catch (error) {
      console.error('Error fetching unvalidated results:', error);
      showPopup('Error fetching unvalidated results', 'error')
    } finally {
      setLoading(false);
    }
  };

  const formatValidationData = (apiData) => {
    return apiData.map((item, index) => ({
      id: index + 1,
      diag_no:item.diagNo||'',
      resultEntryHeaderId: item.resultEntryHeaderId || item.id,
      result_date: formatDate(item.resultDate),
      result_time: formatTime(item.resultTime),
      patient_name: item.patientName || '',
      relation: item.relation || '',
      department: item.mainChargeCodeName || '',
      doctor_name: item.doctorName||'',
      modality: item.subChargeCodeName || '',
      priority: item.priority||'',
      age: item.patientAge || '',
      gender: item.patientGender || '',
      clinical_notes: "",
      validated_by: item.validatedBy || '',
      result_entered_by:item.resultEnteredBy||'',
      patientId: item.patientId || 0,
      mobile_no: item.patientPhnNum || '',

      investigations: item.resultEntryInvestigationResponses ? item.resultEntryInvestigationResponses.map((inv, invIndex) => {
        const hasSubTests = inv.resultEntrySubInvestigationRes && inv.resultEntrySubInvestigationRes.length > 0;

        if (hasSubTests) {
          return {
            id: invIndex + 1,
            si_no: invIndex + 1,
            resultEntryDetailsId: inv.resultEntryDetailsId || inv.id,
            diag_no: inv.diagNo || '',
            investigation: inv.investigationName || '',
            sample: inv.sampleName || '',
            result: inv.result || "",
            units: inv.unit || '',
            normal_range: inv.normalValue || '',
            remarks: inv.remarks || "",
            reject: false,
            validate: false,
            comparisonType: inv.comparisonType || "",
            fixedId: inv.fixedId || null,
            fixedDropdownValues: inv.fixedDropdownValues || [],
            inRange: inv.inRange !== undefined ? inv.inRange : null, // Ensure inRange is properly mapped
            subTests: inv.resultEntrySubInvestigationRes.map((subTest, subIndex) => ({
              id: `${invIndex + 1}.${subIndex + 1}`,
              si_no: getSubTestNumber(invIndex + 1, subIndex, inv.resultEntrySubInvestigationRes.length),
              resultEntryDetailsId: subTest.resultEntryDetailsId || subTest.id,
              diag_no: "---",
              investigation: subTest.subInvestigationName || '',
              sample: subTest.sampleName || '',
              result: subTest.result || "",
              units: subTest.unit || '',
              normal_range: subTest.normalValue || '',
              remarks: subTest.remarks || "",
              reject: false,
              validate: false,
              comparisonType: subTest.comparisonType || "",
              fixedId: subTest.fixedId || null,
              fixedDropdownValues: subTest.fixedDropdownValues || [],
              inRange: subTest.inRange !== undefined ? subTest.inRange : null, // Ensure inRange is properly mapped
            }))
          };
        } else {
          return {
            id: invIndex + 1,
            si_no: invIndex + 1,
            resultEntryDetailsId: inv.resultEntryDetailsId || inv.id,
            diag_no: inv.diagNo || '',
            investigation: inv.investigationName || '',
            sample: inv.sampleName || '',
            result: inv.result || "",
            units: inv.unit || '',
            normal_range: inv.normalValue || '',
            remarks: inv.remarks || "",
            reject: false,
            validate: false,
            comparisonType: inv.comparisonType || "",
            inRange: inv.inRange !== undefined ? inv.inRange : null, // Ensure inRange is properly mapped
            fixedId: inv.fixedId || null,
            fixedDropdownValues: inv.fixedDropdownValues || [],
            subTests: []
          };
        }
      }) : []
    }))
  }

  // Helper functions for formatting
  const getSubTestNumber = (mainIndex, subIndex, totalSubTests) => {
    if (totalSubTests === 1) {
      return "";
    } else {
      return `${mainIndex}.${String.fromCharCode(97 + subIndex)}`;
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    try {
      if (typeof dateString === 'string') {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? new Date().toLocaleDateString('en-GB') : date.toLocaleDateString('en-GB');
      }
      return new Date().toLocaleDateString('en-GB');
    } catch (error) {
      return new Date().toLocaleDateString('en-GB');
    }
  }

  const formatTime = (timeValue) => {
    if (!timeValue) return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    try {
      if (typeof timeValue === 'string') {
        const timeParts = timeValue.split(':');
        if (timeParts.length >= 2) {
          return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
        }
      }
      return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
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

  // Get result text style based on inRange value
  const getResultTextStyle = (inRange) => {
    if (inRange === true) {
      return { fontWeight: 'bold', color: 'green' };
    } else if (inRange === false) {
      return { fontWeight: 'bold', color: 'red' };
    }
    return {}; // Default style for null or undefined
  }

  // Handle result change for main investigations with fixedId
  const handleResultChange = (investigationId, value, selectedFixedId = null) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          return {
            ...inv,
            result: value,
            fixedId: selectedFixedId !== undefined ? selectedFixedId : inv.fixedId
          }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  // Handle result change for sub-tests with fixedId
  const handleSubTestResultChange = (investigationId, subTestId, value, selectedFixedId = null) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedSubTests = inv.subTests.map((subTest) => {
            if (subTest.id === subTestId) {
              return {
                ...subTest,
                result: value,
                fixedId: selectedFixedId !== undefined ? selectedFixedId : subTest.fixedId
              }
            }
            return subTest
          })
          return { ...inv, subTests: updatedSubTests }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  // Render result input field with proper fixedId handling and inRange styling
  const renderResultInput = (test, isSubTest = false, investigationId = null) => {
    const resultStyle = getResultTextStyle(test.inRange);

    if (test.comparisonType === 'f' && test.fixedDropdownValues && test.fixedDropdownValues.length > 0) {
      // Find the currently selected option to display the correct value
      const selectedOption = test.fixedDropdownValues.find(opt => opt.fixedId === test.fixedId);
      const displayValue = selectedOption ? selectedOption.fixedValue : test.result;

      return (
        <div>
          <select
            className="form-select"
            value={test.fixedId || ""}
            onChange={(e) => {
              const selectedFixedId = e.target.value ? parseInt(e.target.value) : null;
              const selectedOption = test.fixedDropdownValues.find(opt => opt.fixedId === selectedFixedId);
              const resultValue = selectedOption ? selectedOption.fixedValue : "";

              if (isSubTest && investigationId) {
                handleSubTestResultChange(investigationId, test.id, resultValue, selectedFixedId);
              } else {
                handleResultChange(test.id, resultValue, selectedFixedId);
              }
            }}
            style={resultStyle}
          >
            <option value="">Select Result</option>
            {test.fixedDropdownValues.map((option) => (
              <option
                key={option.fixedId}
                value={option.fixedId}
              >
                {option.fixedValue}
              </option>
            ))}
          </select>
        </div>
      )
    } else {
      return (
        <input
          type="text"
          className="form-control"
          value={test.result}
          onChange={(e) => {
            if (isSubTest && investigationId) {
              handleSubTestResultChange(investigationId, test.id, e.target.value, null);
            } else {
              handleResultChange(test.id, e.target.value, null);
            }
          }}
          placeholder="Enter result"
          style={resultStyle}
        />
      )
    }
  }

  // Render result display for read-only fields with inRange styling
  const renderResultDisplay = (test) => {
    const resultStyle = getResultTextStyle(test.inRange);

    return (
      <input
        type="text"
        className="form-control border-0 bg-transparent"
        value={test.result}
        readOnly
        style={resultStyle}
      />
    )
  }

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
    setCurrentPage(1)
  }

  const handleRowClick = (result) => {
    setSelectedResult(JSON.parse(JSON.stringify(result)))
    setShowDetailView(true)
    setMasterValidate(false)
    setMasterReject(false)
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedResult(null)
    setMasterValidate(false)
    setMasterReject(false)
  }

  const handleValidationChange = (investigationId, field, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedInv = { ...inv, [field]: value }

          if (field === 'validate' && value === true) {
            updatedInv.reject = false
          } else if (field === 'reject' && value === true) {
            updatedInv.validate = false
          }

          return updatedInv
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
      updateMasterCheckboxes(updatedInvestigations)
    }
  }

  const handleSubTestValidationChange = (investigationId, subTestId, field, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedSubTests = inv.subTests.map((subTest) => {
            if (subTest.id === subTestId) {
              const updatedSubTest = { ...subTest, [field]: value }

              if (field === 'validate' && value === true) {
                updatedSubTest.reject = false
              } else if (field === 'reject' && value === true) {
                updatedSubTest.validate = false
              }

              return updatedSubTest
            }
            return subTest
          })
          return { ...inv, subTests: updatedSubTests }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
      updateMasterCheckboxes(updatedInvestigations)
    }
  }

  const updateMasterCheckboxes = (investigations) => {
    if (!investigations || investigations.length === 0) {
      setMasterValidate(false)
      setMasterReject(false)
      return
    }

    const allTests = []
    investigations.forEach(inv => {
      if (inv.subTests.length === 0) {
        allTests.push(inv)
      } else {
        allTests.push(...inv.subTests)
      }
    })

    if (allTests.length === 0) {
      setMasterValidate(false)
      setMasterReject(false)
      return
    }

    const allValidated = allTests.every(test => test.validate === true)
    const allRejected = allTests.every(test => test.reject === true)

    setMasterValidate(allValidated)
    setMasterReject(allRejected)
  }

  const handleMasterValidateChange = (checked) => {
    if (selectedResult) {
      setMasterValidate(checked)
      setMasterReject(!checked)

      const updatedInvestigations = selectedResult.investigations.map(inv => ({
        ...inv,
        validate: checked,
        reject: !checked,
        subTests: inv.subTests.map(subTest => ({
          ...subTest,
          validate: checked,
          reject: !checked
        }))
      }))

      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  const handleMasterRejectChange = (checked) => {
    if (selectedResult) {
      setMasterReject(checked)
      setMasterValidate(!checked)

      const updatedInvestigations = selectedResult.investigations.map(inv => ({
        ...inv,
        validate: !checked,
        reject: checked,
        subTests: inv.subTests.map(subTest => ({
          ...subTest,
          validate: !checked,
          reject: checked
        }))
      }))

      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  const handleSubmit = async () => {
    if (!selectedResult) return;

    const hasProcessedInvestigation = selectedResult.investigations.some(inv =>
      inv.validate || inv.reject || inv.subTests.some(subTest => subTest.validate || subTest.reject)
    );

    if (!hasProcessedInvestigation) {
      showPopup("Please validate or reject at least one investigation before submitting.", "warning");
      return;
    }

    // Show first confirmation popup
    setConfirmationPopup({
      message: "Do you want to continue with validation?",
      onConfirm: async () => {
        // User confirmed - proceed with validation
        setConfirmationPopup(null);
        await processValidation();
      },
      onCancel: () => {
        // User cancelled - just close the popup
        setConfirmationPopup(null);
      },
      confirmText: "Yes",
      cancelText: "No",
      type: "primary"
    });
  };

  const processValidation = async () => {
    setLoading(true);

    try {
      const validationList = [];

      selectedResult.investigations.forEach(inv => {
        if (inv.subTests && inv.subTests.length > 0) {
          inv.subTests.forEach(subTest => {
            if (subTest.validate || subTest.reject) {
              validationList.push({
                resultEntryDetailsId: subTest.resultEntryDetailsId || subTest.id,
                result: subTest.result || "",
                remarks: subTest.remarks || "",
                validated: subTest.validate === true,
                fixedId: subTest.fixedId || null,
                comparisonType: subTest.comparisonType || ""
              });
            }
          });
        } else {
          if (inv.validate || inv.reject) {
            validationList.push({
              resultEntryDetailsId: inv.resultEntryDetailsId || inv.id,
              result: inv.result || "",
              remarks: inv.remarks || "",
              validated: inv.validate === true,
              fixedId: inv.fixedId || null,
              comparisonType: inv.comparisonType || ""
            });
          }
        }
      });

      if (validationList.length === 0) {
        showPopup("No investigations selected for validation.", "warning");
        setLoading(false);
        return;
      }

      const requestPayload = {
        resultEntryHeaderId: selectedResult.resultEntryHeaderId || selectedResult.id,
        validationList: validationList
      };

      console.log("Submitting validation request:", requestPayload);

      const response = await putRequest(`${LAB}/validate`, requestPayload);

      if (response.status === 200) {
        // Show success confirmation popup
        setConfirmationPopup({
          message: "Results validated successfully!",
          onConfirm: () => {
            // User confirmed success - proceed with cleanup
            setConfirmationPopup(null);
            handleValidationSuccess();
          },
          confirmText: "OK",
          type: "success"
        });
      } else {
        showPopup(response.message || "Failed to validate results", "error");
      }
    } catch (error) {
      console.error("Error submitting validation:", error);
      showPopup("Error submitting validation: " + (error.message || "Unknown error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleValidationSuccess = async () => {
    // Refresh the unvalidated results list
    await fetchUnvalidatedResults();
    setShowDetailView(false);
    setSelectedResult(null);
    setMasterValidate(false);
    setMasterReject(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Priority-1":
        return "bg-danger text-white"
      case "Priority-2":
        return "bg-warning text-dark"
      case "Priority-3":
        return "bg-success text-white"
      default:
        return "bg-secondary text-white"
    }
  }

  const filteredResultList = resultList.filter((item) => {
    const barCodeMatch =
      searchData.barCodeSearch === "" ||
      item.id.toString().includes(searchData.barCodeSearch.toLowerCase()) ||
      item.patient_name.toLowerCase().includes(searchData.barCodeSearch.toLowerCase())

    const patientNameMatch =
      searchData.patientName === "" || item.patient_name.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch =
      searchData.mobileNo === "" ||
      (item.mobile_no && item.mobile_no.includes(searchData.mobileNo))

    return barCodeMatch && patientNameMatch && mobileNoMatch
  })

  const filteredTotalPages = Math.ceil(filteredResultList.length / itemsPerPage) || 1
  const currentItems = filteredResultList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      showPopup("Please enter a valid page number.", "warning")
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

  // Detail View
  if (showDetailView && selectedResult) {
    return (
      <div className="content-wrapper">
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}

        {confirmationPopup && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {confirmationPopup.type === 'success' ? 'Success' : 'Confirmation'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={confirmationPopup.onCancel}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      {confirmationPopup.type === 'success' ? (
                        <i className="mdi mdi-check-circle-outline text-success" style={{ fontSize: '24px' }}></i>
                      ) : (
                        <i className="mdi mdi-alert-circle-outline text-warning" style={{ fontSize: '24px' }}></i>
                      )}
                    </div>
                    <div>
                      <p className="mb-0">{confirmationPopup.message}</p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {confirmationPopup.cancelText && (
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={confirmationPopup.onCancel}
                    >
                      {confirmationPopup.cancelText}
                    </button>
                  )}
                  <button 
                    type="button" 
                    className={`btn ${
                      confirmationPopup.type === 'success' ? 'btn-success' : 
                      confirmationPopup.type === 'warning' ? 'btn-warning' : 
                      confirmationPopup.type === 'danger' ? 'btn-danger' : 'btn-primary'
                    }`} 
                    onClick={confirmationPopup.onConfirm}
                  >
                    {confirmationPopup.confirmText || "Yes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2">RESULT VALIDATION</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.patient_name}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.mobile_no}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.relation}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                       <div className="col-md-4">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.age}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Gender</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.gender}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-12">
                        <label className="form-label fw-bold">Clinical Notes</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={selectedResult.clinical_notes}
                          readOnly
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">RESULT ENTRY DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Result Entry Date/Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedResult.result_date} - ${selectedResult.result_time}`}
                          readOnly
                        />
                      </div>
                    
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Result Entered By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.result_entered_by}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <h5 className="mb-3">INVESTIGATIONS</h5>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>SI No.</th>
                        <th>Diag No.</th>
                        <th>Investigation</th>
                        <th>Sample</th>
                        <th>Result</th>
                        <th>Units</th>
                        <th>Normal Range</th>
                        <th>Remarks</th>
                        <th className="text-center">
                          <div className="d-flex align-items-center">
                            <span className="me-2">Validate</span>
                            <div className="form-check mt-1">
                              <input
                                className="form-check-input border-primary"
                                type="checkbox"
                                checked={masterValidate}
                                onChange={(e) => handleMasterValidateChange(e.target.checked)}
                                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                              />
                            </div>
                          </div>
                        </th>
                        <th className="text-center">
                          <div className="d-flex align-items-center">
                            <span className="me-2">Reject</span>
                            <div className="form-check mt-1">
                              <input
                                className="form-check-input border-primary"
                                type="checkbox"
                                checked={masterReject}
                                onChange={(e) => handleMasterRejectChange(e.target.checked)}
                                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                              />
                            </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.investigations.map((investigation) => (
                        <>
                          {investigation.subTests.length === 0 ? (
                            <tr key={investigation.id}>
                              <td>{investigation.si_no}</td>
                              <td>{investigation.diag_no}</td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control bg-transparent"
                                  value={investigation.investigation}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control border-0 bg-transparent"
                                  value={investigation.sample}
                                  readOnly
                                />
                              </td>
                              <td>
                                {renderResultInput(investigation)}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control border-0 bg-transparent"
                                  value={investigation.units}
                                  readOnly
                                />
                              </td>
                              <td>
                                <textarea
                                  className="form-control border-0 bg-transparent"
                                  rows="1"
                                  value={investigation.normal_range}
                                  readOnly
                                ></textarea>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.remarks}
                                  onChange={(e) =>
                                    handleValidationChange(investigation.id, "remarks", e.target.value)
                                  }
                                  placeholder="Enter remarks"
                                />
                              </td>
                              <td className="text-center">
                                <div className="form-check d-flex justify-content-center">
                                  <input
                                    className="form-check-input border-primary"
                                    type="checkbox"
                                    checked={investigation.validate}
                                    onChange={(e) => handleValidationChange(investigation.id, "validate", e.target.checked)}
                                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                  />
                                </div>
                              </td>
                              <td className="text-center">
                                <div className="form-check d-flex justify-content-center">
                                  <input
                                    className="form-check-input border-primary"
                                    type="checkbox"
                                    checked={investigation.reject}
                                    onChange={(e) => handleValidationChange(investigation.id, "reject", e.target.checked)}
                                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <>
                              <tr key={investigation.id}>
                                <td>{investigation.si_no}</td>
                                <td>{investigation.diag_no}</td>
                                <td colSpan="8">
                                  <strong>{investigation.investigation}</strong>
                                </td>
                              </tr>
                              {/* In the sub-test row, fix the columns */}
                              {investigation.subTests.map((subTest) => (
                                <tr key={subTest.id}>
                                  <td>{subTest.si_no}</td>
                                  <td>{subTest.diag_no}</td>
                                  <td className="ps-4">
                                    <input
                                      type="text"
                                      className="form-control bg-transparent"
                                      value={subTest.investigation}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control border-0 bg-transparent"
                                      value={subTest.sample}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    {renderResultInput(subTest, true, investigation.id)}
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control border-0 bg-transparent"
                                      value={subTest.units}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <textarea
                                      className="form-control border-0 bg-transparent"
                                      rows="1"
                                      value={subTest.normal_range}
                                      readOnly
                                    ></textarea>
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.remarks}
                                      onChange={(e) =>
                                        handleSubTestValidationChange(investigation.id, subTest.id, "remarks", e.target.value)
                                      }
                                      placeholder="Enter remarks"
                                    />
                                  </td>
                                  <td className="text-center">
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input border-primary"
                                        type="checkbox"
                                        checked={subTest.validate}
                                        onChange={(e) => handleSubTestValidationChange(investigation.id, subTest.id, "validate", e.target.checked)}
                                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                      />
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input border-primary"
                                        type="checkbox"
                                        checked={subTest.reject}
                                        onChange={(e) => handleSubTestValidationChange(investigation.id, subTest.id, "reject", e.target.checked)}
                                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-end mt-4">
                  <button className="btn btn-success me-3" onClick={handleSubmit} disabled={loading}>
                    <i className="mdi mdi-check-circle"></i> VALIDATE
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> BACK TO LIST
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List View
  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">RESULT VALIDATION</h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  <div className="card mb-3">
                    <div className="card-header py-3 bg-light border-bottom-1">
                      <h6 className="mb-0 fw-bold">PATIENT SEARCH</h6>
                    </div>
                    <div className="card-body">
                      <form>
                        <div className="row g-4 align-items-end">
                          <div className="col-md-3">
                            <label className="form-label">Bar Code Search</label>
                            <input
                              type="text"
                              className="form-control"
                              id="barCodeSearch"
                              placeholder="Enter bar code"
                              value={searchData.barCodeSearch}
                              onChange={handleSearchChange}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Patient Name</label>
                            <input
                              type="text"
                              className="form-control"
                              id="patientName"
                              placeholder="Enter patient name"
                              value={searchData.patientName}
                              onChange={handleSearchChange}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Mobile No.</label>
                            <input
                              type="text"
                              className="form-control"
                              id="mobileNo"
                              placeholder="Enter mobile number"
                              value={searchData.mobileNo}
                              onChange={handleSearchChange}
                            />
                          </div>
                          <div className="col-md-3 d-flex">
                            <button type="button" className="btn btn-primary me-2">
                              <i className="fa fa-search"></i> Search
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setSearchData({
                                  barCodeSearch: "",
                                  patientName: "",
                                  mobileNo: "",
                                })
                              }}
                            >
                              <i className="mdi mdi-refresh"></i> Reset
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="d-flex mb-3">
                    <span className="badge bg-danger me-2">Priority-1</span>
                    <span className="badge bg-warning text-dark me-2">Priority-2</span>
                    <span className="badge bg-success">Priority-3</span>
                  </div>

                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Diag No.</th>
                          <th>Result Date/Time</th>
                          <th>Patient Name</th>
                          <th>Relation</th>
                          <th>Mobile No</th>
                          <th>Department Name</th>
                          <th>Doctor Name</th>
                          <th>Modality</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: "pointer" }}
                              className="table-row-hover"
                            >
                              <td>{item.diag_no}</td>
                              <td>{`${item.result_date} - ${item.result_time}`}</td>
                              <td>{item.patient_name}</td>
                              <td>{item.relation}</td>
                              <td>{item.mobile_no}</td>
                              <td>{item.department}</td>
                              <td>{item.doctor_name}</td>
                              <td>{item.modality}</td>
                              <td>
                                <span className={`badge ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              No results pending validation found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredResultList.length > 0 && (
                    <nav className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <span>
                          Page {currentPage} of {filteredTotalPages} | Total Records: {filteredResultList.length}
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
                          style={{ width: "120px" }}
                        />
                        <button className="btn btn-primary" onClick={handlePageNavigation}>
                          GO
                        </button>
                      </div>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultValidation
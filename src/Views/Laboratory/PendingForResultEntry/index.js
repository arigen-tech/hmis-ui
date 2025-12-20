import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { FETCH_AUTO_FILL_ERR_MSG, FETCH_RESULT_VALIDATE_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, RESULT_ENTRY_WARN_MSG, RESULT_SUBMIT_ERR_MSG, RESULT_SUBMIT_SUCC_MSG } from "../../../config/constants"

const PendingForResultEntry = () => {
  const [resultList, setResultList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const itemsPerPage = 5

  // Fetch pending result entry data
useEffect(() => {
  if (popupMessage === null) {
    fetchPendingResultEntries();
  }
}, [popupMessage]);


  const fetchPendingResultEntries = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/resultStatus`);

      console.log("Raw API Response:", data); // Debugging

      if (data.status === 200 && data.response) {
        console.log("First result item:", data.response[0]); // Debugging
        const formattedData = formatResultEntryData(data.response);
        setResultList(formattedData);
      } else {
        console.error('Error fetching pending result entries:', data.message);
        showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending result entries:', error);
      showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
    } finally {
      setLoading(false);
    }
  };

 const formatResultEntryData = (apiData) => {
  return apiData.map((item, index) => ({
    id: index + 1,
    order_date: formatDate(item.orderDate),
    order_time:formatTime(item.orderTime),
    order_no: item.orderNo || '',
    collection_date: formatDate(item.collectedDate),
    collection_time: formatTime(item.collectedTime),
    patient_name: item.patientName || '',
    relation: item.relation || '',
    department: item.department || '',
    doctor_name: item.doctorName || '',
    modality: item.subChargeCodeName || '',
    priority: '',
    age: item.patientAge || '',
    gender: item.patientGender || '',
    clinical_notes: item.clinicalNotes || '',
    collected_by: item.collectedBy || '',
    validated_by: item.validatedBy || '',
    validated_date:formatDate(item.validatedDate)||'',
    validated_time:formatTime(item.validatedTime)||'',
    patientId: item.patientId || 0,
    subChargeCodeId: item.subChargeCodeId || 0,
    mobile_no: item.patientPhoneNo || '',

    visitId:item.visitId,
    // NEW FIELDS FOR SUBMIT API
    relationId: item.relationId || 0,
    mainChargeCodeId: item.mainChargeCodeId || 0,
    sampleCollectionHeaderId: item.sampleCollectionHeaderId || 0,
    
    investigations: item.resultInvestigationResponseList ? item.resultInvestigationResponseList.map((inv, invIndex) => {
      const hasSubTests = inv.resultSubInvestigationResponseList && inv.resultSubInvestigationResponseList.length > 0;
      
      if (hasSubTests) {
        return {
          id: invIndex + 1,
          si_no: invIndex + 1,
          diag_no: inv.diagNo || '',
          investigation: inv.investigationName || '',
          sample: inv.sampleName || '',
          result: "",
          units: inv.unitName || '',
          normal_range: "",
          remarks: "",
          reject: false,
          investigationId: inv.investigationId || 0,
          // NEW FIELDS FOR SUBMIT API
          sampleCollectionDetailsId: inv.sampleCollectionDetailsId || 0,
          sampleId: inv.sampleId || 0,
          resultType: inv.resultType || 's',
          
          subTests: inv.resultSubInvestigationResponseList.map((subTest, subIndex) => ({
            id: `${invIndex + 1}.${subIndex + 1}`,
            si_no: getSubTestNumber(invIndex + 1, subIndex, inv.resultSubInvestigationResponseList.length),
            diag_no: "---",
            investigation: subTest.subInvestigationName || '',
            sample: subTest.sampleName || '',
            result: "",
            units: subTest.unit || '',
            // UPDATED: Use fixedValueExpectedResult for comparisonType 'f', otherwise use normalValue
            normal_range: subTest.comparisonType === 'f' ? (subTest.fixedValueExpectedResult || '') : (subTest.normalValue || ''),
            remarks: "",
            reject: false,
            subInvestigationId: subTest.subInvestigationId || 0,
            sampleId: subTest.sampleId || 0,
            resultType: subTest.resultType || 't',
            comparisonType: subTest.comparisonType || 't',
            dgFixedValueResponseList: subTest.dgFixedValueResponseList || [],
            normalId: subTest.normalId || null,
            // Store the fixedValueExpectedResult for reference
            fixedValueExpectedResult: subTest.fixedValueExpectedResult || null
          }))
        };
      } else {
        return {
          id: invIndex + 1,
          si_no: invIndex + 1,
          diag_no: inv.diagNo || '',
          investigation: inv.investigationName || '',
          sample: inv.sampleName || '',
          result: "",
          units: inv.unitName || '',
          normal_range: inv.normalValue || '',
          remarks: "",
          reject: false,
          investigationId: inv.investigationId || 0,
          // NEW FIELDS FOR SUBMIT API
          sampleCollectionDetailsId: inv.sampleCollectionDetailsId || 0,
          sampleId: inv.sampleId || 0,
          resultType: inv.resultType || 's',
          subTests: []
        };
      }
    }) : []
  }))
}

// Enhanced sub-test numbering function
const getSubTestNumber = (mainIndex, subIndex, totalSubTests) => {
  if (totalSubTests === 1) {
    return ""; // Blank for single sub-test
  } else {
    return `${mainIndex}.${getSubIndex(subIndex)}`; // Use a,b,c for 2-3 sub-tests
  } 
}


  // Function to convert number to a,b,c format
  const getSubIndex = (index) => {
    return String.fromCharCode(97 + index); // 97 is 'a' in ASCII
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    
    try {
      // Handle LocalDateTime string like "2025-10-30T12:26:04.85009"
      if (typeof dateString === 'string') {
        // Extract just the date part if it's a full datetime string
        const datePart = dateString.split('T')[0];
        const date = new Date(datePart);
        return isNaN(date.getTime()) ? new Date().toLocaleDateString('en-GB') : date.toLocaleDateString('en-GB');
      }
      return new Date().toLocaleDateString('en-GB');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return new Date().toLocaleDateString('en-GB');
    }
  }

  const formatTime = (timeValue) => {
    if (!timeValue) return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    try {
      // Handle LocalTime object or string
      if (typeof timeValue === 'string') {
        // If it's already a time string like "12:26:04.85009"
        const timeParts = timeValue.split(':');
        if (timeParts.length >= 2) {
          return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
        }
      } else if (timeValue && typeof timeValue === 'object') {
        // If it's a LocalTime object from Java
        const hours = String(timeValue.hour || 0).padStart(2, '0');
        const minutes = String(timeValue.minute || 0).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error, timeValue);
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

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
    setCurrentPage(1)
  }

  const handleRowClick = (result) => {
    setSelectedResult(result)
    setShowDetailView(true)
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedResult(null)
  }

  const handleInvestigationChange = (investigationId, field, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) =>
        inv.id === investigationId ? { ...inv, [field]: value } : inv
      )
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  const handleSubTestChange = (investigationId, subTestId, field, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          const updatedSubTests = inv.subTests.map((subTest) =>
            subTest.id === subTestId ? { ...subTest, [field]: value } : subTest
          )
          return { ...inv, subTests: updatedSubTests }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  // Render result input based on result type
const renderResultInput = (item, isSubTest = false, investigationId = null) => {
  const resultType = isSubTest ? item.resultType : null;
  const comparisonType = isSubTest ? item.comparisonType : null;

  if (isSubTest && comparisonType === 'f') {
    // Render dropdown for comparison type 'f' (fixed values) - use dgFixedValueResponseList
    const fixedValues = item.dgFixedValueResponseList || [];
    
    return (
      <select
        className="form-select"
        value={item.result || ""}
        onChange={(e) => {
          if (isSubTest && investigationId) {
            handleSubTestChange(investigationId, item.id, "result", e.target.value)
          } else if (!isSubTest) {
            handleInvestigationChange(item.id, "result", e.target.value)
          }
        }}
      >
        <option value="">Select Result</option>
        {fixedValues.map((fixedValue, index) => (
          <option key={index} value={fixedValue.fixedValue}>
            {fixedValue.fixedValue}
          </option>
        ))}
      </select>
    );
  } else if (isSubTest && resultType === 'r') {
    // Render dropdown for result type 'r' (radio/select)
    return (
      <select
        className="form-select"
        value={item.result || ""}
        onChange={(e) => {
          if (isSubTest && investigationId) {
            handleSubTestChange(investigationId, item.id, "result", e.target.value)
          } else if (!isSubTest) {
            handleInvestigationChange(item.id, "result", e.target.value)
          }
        }}
      >
        <option value="">Select Result</option>
        <option value="Positive">Positive</option>
        <option value="Negative">Negative</option>
        <option value="Reactive">Reactive</option>
        <option value="Non-Reactive">Non-Reactive</option>
        <option value="Present">Present</option>
        <option value="Absent">Absent</option>
      </select>
    );
  } else {
    // Render text input for other types (text/numeric)
    return (
      <input
        type="text"
        className="form-control"
        value={item.result}
        onChange={(e) => {
          if (isSubTest && investigationId) {
            handleSubTestChange(investigationId, item.id, "result", e.target.value)
          } else if (!isSubTest) {
            handleInvestigationChange(item.id, "result", e.target.value)
          }
        }}
      />
    );
  }
}

  const handleSubmit = async () => {
  if (selectedResult) {
    try {
      setLoading(true);

      // Prepare the request payload according to your API structure
      const requestPayload = {
        relationId: selectedResult.relationId,
        mainChargeCodeId: selectedResult.mainChargeCodeId,
        subChargeCodeId: selectedResult.subChargeCodeId,
        clinicalNotes: selectedResult.clinical_notes || "Clinical Notes",
        sampleCollectionHeaderId: selectedResult.sampleCollectionHeaderId,
        visitId:selectedResult.visitId,
        patientId: selectedResult.patientId, // Added patientId
        investigationList: selectedResult.investigations.map((inv) => {
          const resultEntryDetails = [];

          // Handle main investigation result
          if (!inv.reject && inv.result && inv.result.trim() !== "") {
            resultEntryDetails.push({
              result: inv.result,
              remarks: inv.remarks || "",
              sampleId: inv.sampleId,
              investigationId: inv.investigationId,
              subInvestigationId: null,
              resultType: inv.resultType || "s",
              comparisonType: inv.comparisonType || "n",
              fixedId: 0,
              normalId: 0,
              normalRange: inv.normal_range || "", // Added normalRange for main investigation
              fixedRange: null // Added fixedRange as null for now
            });
          }

          // Handle sub-investigations
          if (inv.subTests.length > 0) {
            const hasAnySubTestResult = inv.subTests.some(subTest => 
              !subTest.reject && subTest.result && subTest.result.trim() !== ""
            );

            // If any sub-test has result, include ALL sub-tests
            if (hasAnySubTestResult) {
              inv.subTests.forEach(subTest => {
                // For sub-tests with results
                if (!subTest.reject && subTest.result && subTest.result.trim() !== "") {
                  // Find the selected fixed value if comparisonType is 'f'
                  let fixedId = 0;
                  let normalId = 0;
                  
                  if (subTest.comparisonType === 'f' && subTest.dgFixedValueResponseList) {
                    const selectedFixedValue = subTest.dgFixedValueResponseList.find(
                      fixedValue => fixedValue.fixedValue === subTest.result
                    );
                    fixedId = selectedFixedValue ? selectedFixedValue.fixedId : 0;
                  } else if (subTest.comparisonType === 'n') {
                    // For normal type, you might need to get normalId from somewhere
                    // This depends on your data structure
                    normalId = subTest.normalId || 0;
                  }

                  resultEntryDetails.push({
                    result: subTest.result,
                    remarks: subTest.remarks || "",
                    sampleId: subTest.sampleId,
                    investigationId: inv.investigationId,
                    subInvestigationId: subTest.subInvestigationId,
                    resultType: subTest.resultType || "s",
                    comparisonType: subTest.comparisonType || "n",
                    fixedId: fixedId,
                    normalId: normalId,
                    normalRange: subTest.normal_range || "", // Added normalRange for sub-tests
                    fixedRange: null // Added fixedRange as null for now
                  });
                } 
                // For empty sub-tests (when at least one has result)
                else {
                  resultEntryDetails.push({
                    result: null,
                    remarks: null,
                    sampleId: subTest.sampleId,
                    investigationId: inv.investigationId,
                    subInvestigationId: subTest.subInvestigationId,
                    resultType: subTest.resultType || "s",
                    comparisonType: subTest.comparisonType || "n",
                    fixedId: 0,
                    normalId: 0,
                    normalRange: subTest.normal_range || "", // Added normalRange for empty sub-tests
                    fixedRange: null // Added fixedRange as null for now
                  });
                }
              });
            }
            // If no sub-tests have results but main investigation has result, still include sub-tests as null
            else if (!inv.reject && inv.result && inv.result.trim() !== "") {
              inv.subTests.forEach(subTest => {
                resultEntryDetails.push({
                  result: null,
                  remarks: null,
                  sampleId: subTest.sampleId,
                  investigationId: inv.investigationId,
                  subInvestigationId: subTest.subInvestigationId,
                  resultType: subTest.resultType || "s",
                  comparisonType: subTest.comparisonType || "n",
                  fixedId: 0,
                  normalId: 0,
                  normalRange: subTest.normal_range || "", // Added normalRange for null sub-tests
                  fixedRange: null // Added fixedRange as null for now
                });
              });
            }
          }

          // Only return investigation if it has any result entries
          return resultEntryDetails.length > 0 ? {
            investigationId: inv.investigationId,
            sampleCollectionDetailsId: inv.sampleCollectionDetailsId,
            resultEntryDetailsRequestList: resultEntryDetails
          } : null;
        }).filter(inv => inv !== null)
      };

      // Check if there are any investigations with results to submit
      if (requestPayload.investigationList.length === 0) {
        showPopup(RESULT_ENTRY_WARN_MSG, "warning");
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!requestPayload.relationId || !requestPayload.mainChargeCodeId || !requestPayload.subChargeCodeId || !requestPayload.sampleCollectionHeaderId || !requestPayload.patientId) {
        showPopup(FETCH_AUTO_FILL_ERR_MSG, "error");
        setLoading(false);
        return;
      }

      console.log("Submitting result entry payload:", JSON.stringify(requestPayload, null, 2));

      // Use your endpoint
      const response = await postRequest(`${LAB}/saveResultEntry`, requestPayload);

      if (response.status === 200) {
        showPopup(RESULT_SUBMIT_SUCC_MSG, "success");
        setShowDetailView(false);
        setSelectedResult(null);
      } else {
        throw new Error(response.message || "Failed to submit results");
      }
    } catch (error) {
      console.error('Error submitting results:', error);
      showPopup(error.message || RESULT_SUBMIT_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  }
};

  const handleReset = () => {
    if (selectedResult) {
      const originalResult = resultList.find((r) => r.id === selectedResult.id)
      setSelectedResult({ ...originalResult })
    }
  }

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
      item.order_no.toLowerCase().includes(searchData.barCodeSearch.toLowerCase()) ||
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
      showPopup(INVALID_PAGE_NO_WARN_MSG, "warning")
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
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2">RESULT ENTRY</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Collection Date */}
                {/* <div className="row mb-3">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Collection Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedResult.collection_date}
                      readOnly
                    />
                  </div>
                </div> */}

                {/* Patient Details */}
                <div className="card mb-4">
                  <div className="card-header  ">
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
                        <label className="form-label fw-bold">Mobile No</label>
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
                      
                      
                      <div className="col-md-4 mt-3">
                        <label className="form-label fw-bold">Age</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.age}
                          readOnly
                        />
                      </div>
                      <div className="col-md-4 mt-3">
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

                {/* Result Entry Details */}
                <div className="card mb-4">
                  <div className="card-header  ">
                    <h5 className="mb-0">SAMPLE COLLECTION DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-bold"> Collection Date/Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedResult.collection_date} - ${selectedResult.collection_time}`}
                          readOnly
                        />
                      </div>
                      {/* <div className="col-md-3">
                        <label className="form-label fw-bold">Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.collection_time}
                          readOnly
                        />
                      </div> */}
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Collected By
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.collected_by}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Validate Date/Time 
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedResult.validated_date} - ${selectedResult.validated_time}`}
                          // onChange={(e) => setSelectedResult({ ...selectedResult, validated_time: e.target.value })}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Validated By 
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.validated_by}
                          // onChange={(e) => setSelectedResult({ ...selectedResult, validated_by: e.target.value })}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investigations Table */}
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
                        <th>Reject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.investigations.map((investigation) => (
                        <>
                          {investigation.subTests.length === 0 ? (
                            // Main investigation without sub-tests
                            <tr key={investigation.id}>
                              <td>{investigation.si_no}</td>
                              <td>{investigation.diag_no}</td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.investigation}
                                  readOnly
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
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
                                  className="form-control"
                                  value={investigation.units}
                                  readOnly
                                />
                              </td>
                              <td>
                                <textarea
                                  className="form-control"
                                  rows="2"
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
                                    handleInvestigationChange(investigation.id, "remarks", e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <div className="form-check d-flex justify-content-center">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={investigation.reject}
                                    onChange={(e) =>
                                      handleInvestigationChange(investigation.id, "reject", e.target.checked)
                                    }
                                    style={{ width: "20px", height: "20px", border: "2px solid black" }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ) : (
                            // Investigation with sub-tests
                            <>
                              {/* Main investigation row (header) */}
                              <tr key={investigation.id}>
                                <td>{investigation.si_no}</td>
                                <td>{investigation.diag_no}</td>
                                <td colSpan="7">
                                  <strong>{investigation.investigation}</strong>
                                </td>
                              </tr>
                              {/* Sub-test rows */}
                              {investigation.subTests.map((subTest) => (
                                <tr key={subTest.id}>
                                  <td>{subTest.si_no}</td>
                                  <td>{subTest.diag_no}</td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.investigation}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
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
                                      className="form-control"
                                      value={subTest.units}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <textarea
                                      className="form-control"
                                      rows="2"
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
                                        handleSubTestChange(investigation.id, subTest.id, "remarks", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td>
                                    <div className="form-check d-flex justify-content-center">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={subTest.reject}
                                        onChange={(e) =>
                                          handleSubTestChange(investigation.id, subTest.id, "reject", e.target.checked)
                                        }
                                        style={{ width: "20px", height: "20px", border: "2px solid black" }}
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

                {/* Action Buttons */}
                <div className="text-end mt-4">
                  <button className="btn btn-primary me-3" onClick={handleSubmit} disabled={loading}>
                    <i className="mdi mdi-content-save"></i> SUBMIT
                  </button>
                  <button className="btn btn-secondary me-3" onClick={handleReset} disabled={loading}>
                    <i className="mdi mdi-refresh"></i> RESET
                  </button>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> BACK
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
              <h4 className="card-title p-2">PENDING FOR RESULT ENTRY</h4>
              {/* <button type="button" className="btn btn-success">
                <i className="mdi mdi-plus"></i> Generate Report
              </button> */}
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Patient Search Section */}
                  <div className="card mb-3">
                    <div className="card-header py-3   border-bottom-1">
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

                  {/* Priority Legend */}
                  <div className="d-flex mb-3">
                    <span className="badge bg-danger me-2">Priority-1</span>
                    <span className="badge bg-warning text-dark me-2">Priority-2</span>
                    <span className="badge bg-success">Priority-3</span>
                  </div>

                  {/* Table */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Order Date/Time</th>
                          <th>Order No.</th>
                          <th>Collection Date/Time</th>
                          {/* <th>Collection Time</th> */}
                          <th>Patient Name</th>
                          <th>Relation</th>
                          <th>Mobile No</th>
                          <th>Department Name</th>
                          {/* <th>Doctor Name</th> */}
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
                              <td>{`${item.order_date} - ${item.order_time}`}</td>
                              <td>{item.order_no}</td>
                              <td>{<td>{`${item.collection_date} - ${item.collection_time}`}</td>}</td>
                              {/* <td>{item.collection_time}</td> */}
                              <td>{item.patient_name}</td>
                              <td>{item.relation}</td>
                              <td>{item.mobile_no}</td>
                              <td>{item.department}</td>
                              {/* <td>{item.doctor_name}</td> */}
                              <td>{item.modality}</td>
                              <td>
                                <span className={`badge ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-4">
                              No pending result entries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
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

export default PendingForResultEntry
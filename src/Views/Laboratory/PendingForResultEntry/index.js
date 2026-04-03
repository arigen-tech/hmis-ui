import { useState, useEffect } from "react"
import { getRequest, postRequest } from "../../../service/apiService"
import { FIXED_VALUE_DROPDOWNS_END_URL, LAB, PENDING_INVESTIGATIONS_FOR_RESULT_ENTRY_END_URL, PENDING_SAMPLE_HEADERS_FOR_RESULT_ENTRY_END_URL, PENDING_SUB_INVESTIGATIONS_FOR_RESULT_ENTRY_END_URL, REQUEST_PARAM_AGE, REQUEST_PARAM_GENDER_CODE, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_INVESTIGATION_ID, REQUEST_PARAM_MOBILE_NO, REQUEST_PARAM_PAGE, REQUEST_PARAM_PATIENT_NAME, REQUEST_PARAM_SAMPLE_COLLECTION_HD_ID, REQUEST_PARAM_SIZE, REQUEST_PARAM_SUB_INVESTIGATION_ID, SAVE_RESULT_ENTRY_END_URL } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { FETCH_AUTO_FILL_ERR_MSG, FETCH_RESULT_VALIDATE_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, RESULT_ENTRY_WARN_MSG, RESULT_SUBMIT_ERR_MSG, RESULT_SUBMIT_SUCC_MSG } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const PendingForResultEntry = () => {
  const [resultList, setResultList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isShowingAll, setIsShowingAll] = useState(true)
  const [searchData, setSearchData] = useState({
    barCodeSearch: "",
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const hospitalId = sessionStorage.getItem("hospitalId")
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE

  // Fetch pending result entry headers on component mount
  useEffect(() => {
    fetchPendingResultHeaders()
  }, []) // Only run once on mount

  // Separate effect for page changes without loading screen
  useEffect(() => {
    if (!loading) { // Only fetch if initial load is complete
      fetchPendingResultHeadersForPageChange()
    }
  }, [currentPage])

  // API call for headers with search filters and pagination (with loading)
  const fetchPendingResultHeaders = async (isSearchAction = false) => {
    try {
      if (isSearchAction) {
        setIsSearching(true)
      } else {
        setLoading(true)
      }

      let url = `${PENDING_SAMPLE_HEADERS_FOR_RESULT_ENTRY_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      if (searchData.patientName) {
        url += `&${REQUEST_PARAM_PATIENT_NAME}=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&${REQUEST_PARAM_MOBILE_NO}=${encodeURIComponent(searchData.mobileNo)}`
      }

      const data = await getRequest(url);

      console.log("Headers API Response:", data);

      if (data.status === 200 && data.response) {
        const formattedData = formatHeaderData(data.response.content || []);
        setResultList(formattedData);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
        // Check if any search filters are applied
        const hasFilters = searchData.patientName || searchData.mobileNo
        setIsShowingAll(!hasFilters)
      } else {
        console.error('Error fetching pending result headers:', data.message);
        showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending result headers:', error);
      showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
    } finally {
      if (isSearchAction) {
        setIsSearching(false)
      } else {
        setLoading(false)
      }
    }
  };

  // New function for page changes without loading screen
  const fetchPendingResultHeadersForPageChange = async () => {
    try {
      let url = `${PENDING_SAMPLE_HEADERS_FOR_RESULT_ENTRY_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      if (searchData.patientName) {
        url += `&${REQUEST_PARAM_PATIENT_NAME}=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&${REQUEST_PARAM_MOBILE_NO}=${encodeURIComponent(searchData.mobileNo)}`
      }

      const data = await getRequest(url);

      console.log("Headers API Response:", data);

      if (data.status === 200 && data.response) {
        const formattedData = formatHeaderData(data.response.content || []);
        setResultList(formattedData);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
        // Check if any search filters are applied
        const hasFilters = searchData.patientName || searchData.mobileNo
        setIsShowingAll(!hasFilters)
      } else {
        console.error('Error fetching pending result headers:', data.message);
        showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending result headers:', error);
      showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
    }
  };

  // API call for investigations when row is clicked
  const fetchInvestigations = async (sampleCollectionHeaderId) => {
    try {
      const data = await getRequest(`${PENDING_INVESTIGATIONS_FOR_RESULT_ENTRY_END_URL}?${REQUEST_PARAM_SAMPLE_COLLECTION_HD_ID}=${sampleCollectionHeaderId}`);

      console.log("Investigations API Response:", data);

      if (data.status === 200 && data.response) {
        return data.response;
      } else {
        console.error('Error fetching investigations:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching investigations:', error);
      return [];
    }
  };

  // API call for sub-investigations
  const fetchSubInvestigations = async (investigationId, genderCode, age) => {
    try {
      const data = await getRequest(`${PENDING_SUB_INVESTIGATIONS_FOR_RESULT_ENTRY_END_URL}?${REQUEST_PARAM_INVESTIGATION_ID}=${investigationId}&${REQUEST_PARAM_GENDER_CODE}=${genderCode}&${REQUEST_PARAM_AGE}=${encodeURIComponent(age)}`);

      console.log("SubInvestigations API Response:", data);

      if (data.status === 200 && data.response) {
        return data.response;
      } else {
        console.error('Error fetching sub-investigations:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching sub-investigations:', error);
      return [];
    }
  };

  // API call for fixed values dropdown
  const fetchFixedValues = async (subInvestigationId) => {
    try {
      const data = await getRequest(`${FIXED_VALUE_DROPDOWNS_END_URL}?${REQUEST_PARAM_SUB_INVESTIGATION_ID}=${subInvestigationId}`);

      console.log("Fixed Values API Response:", data);

      if (data.status === 200 && data.response) {
        return data.response;
      } else {
        console.error('Error fetching fixed values:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching fixed values:', error);
      return [];
    }
  };

  const formatHeaderData = (apiData) => {
    return apiData.map((item, index) => ({
      id: index + 1,
      sampleCollectionHeaderId: item.sampleCollectionHeaderId,
      patient_name: item.patientName || '',
      mobile_no: item.mobileNumber || '',
      relation: item.relation || '',
      gender: item.patientGender || '',
      age: item.patientAge || '',
      order_date: formatDate(item.orderDate),
      order_time: formatTime(item.orderTime),
      collection_date: formatDate(item.collectedDate),
      collection_time: formatTime(item.collectedTime),
      order_no: item.orderNo || '',
      validated_date: formatDate(item.validatedDate),
      validated_time: formatTime(item.validatedTime),
      department: item.department || '',
      doctor_name: item.doctorName || '',
      modality: item.subChargeCodeName || '',
      collected_by: item.collectedBy || '',
      validated_by: item.validatedBy || '',
      clinical_notes: '',
      relationId: item.relationId || 0,
      mainChargeCodeId: item.mainChargeCodeId || 0,
      subChargeCodeId: item.subChargeCodeId || 0,
      visitId: item.visitId || 0,
      patientId: item.patientId || 0,
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');

    try {
      if (typeof dateString === 'string') {
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
      if (typeof timeValue === 'string') {
        const timeParts = timeValue.split('T')[1]?.split(':') || timeValue.split(':');
        if (timeParts.length >= 2) {
          return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
        }
      } else if (timeValue && typeof timeValue === 'object') {
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

  const showPopup = (message, type = "info", shouldRefreshData = false) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (shouldRefreshData) {
          fetchPendingResultHeaders()
        }
      },
    })
  }

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchPendingResultHeaders(true)
  }

  const handleShowAll = async () => {
    setSearchData({
      barCodeSearch: "",
      patientName: "",
      mobileNo: "",
    })
    setCurrentPage(1)
    setIsShowingAll(true)

    try {
      setLoading(true)

      let url = `${PENDING_SAMPLE_HEADERS_FOR_RESULT_ENTRY_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=0&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      const data = await getRequest(url);

      console.log("All Headers API Response:", data);

      if (data.status === 200 && data.response) {
        const formattedData = formatHeaderData(data.response.content || []);
        setResultList(formattedData);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
      } else {
        console.error('Error fetching pending result headers:', data.message);
        showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending result headers:', error);
      showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
    } finally {
      setLoading(false);
    }
  }

  const handleRowClick = async (result) => {
    try {
      // setLoading(true)

      // Fetch investigations for this sample
      const investigations = await fetchInvestigations(result.sampleCollectionHeaderId)

      // Process each investigation based on its type
      const processedInvestigations = await Promise.all(investigations.map(async (inv, index) => {
        if (inv.investigationType === 'm') {
          // Fetch sub-investigations for this main investigation
          const genderCode = result.gender ? result.gender.charAt(0).toUpperCase() : 'M';
          const subInvestigations = await fetchSubInvestigations(inv.investigationId, genderCode, result.age)

          // Process sub-investigations with fixed values if needed
          const processedSubTests = await Promise.all(subInvestigations.map(async (subTest, subIndex) => {
            let fixedValues = []

            // If comparisonType is 'f', fetch fixed values dropdown
            if (subTest.comparisonType === 'f') {
              fixedValues = await fetchFixedValues(subTest.subInvestigationId)
            }

            return {
              id: `${index + 1}.${subIndex + 1}`,
              si_no: subInvestigations.length === 1 ? "" : `${index + 1}.${String.fromCharCode(97 + subIndex)}`,
              subInvestigationId: subTest.subInvestigationId,
              investigation: subTest.subInvestigationName,
              sample: inv.sampleName,
              result: "",
              units: subTest.unitName || "",
              normal_range: subTest.normalValue || "",
              normalId: subTest.normalId || 0,
              remarks: "",
              reject: false,
              resultType: subTest.resultType || 't',
              comparisonType: subTest.comparisonType || 'n',
              fixedValues: fixedValues,
              generatedSampleId: inv.generatedSampleId || '',
              sampleId: inv.sampleId,
              fixedValueExpectedResult: subTest.fixedValueExpectedResult || null
            }
          }))

          return {
            id: index + 1,
            si_no: index + 1,
            investigationId: inv.investigationId,
            investigation: inv.investigationName,
            sample: inv.sampleName,
            result: "",
            units: inv.unitName || "",
            normal_range: inv.normalValue || "",
            remarks: "",
            reject: false,
            resultType: 'm',
            investigationType: 'm',
            sampleId: inv.sampleId,
            sampleCollectionDetailsId: inv.sampleCollectionDetailsId || 0,
            generatedSampleId: inv.generatedSampleId || '',
            subTests: processedSubTests
          }
        } else {
          // Single investigation (type 's')
          return {
            id: index + 1,
            si_no: index + 1,
            investigationId: inv.investigationId,
            investigation: inv.investigationName,
            sample: inv.sampleName,
            result: "",
            units: inv.unitName || "",
            normal_range: inv.normalValue || "",
            remarks: "",
            reject: false,
            resultType: 's',
            investigationType: 's',
            sampleId: inv.sampleId,
            sampleCollectionDetailsId: inv.sampleCollectionDetailsId || 0,
            generatedSampleId: inv.generatedSampleId || '',
            subTests: []
          }
        }
      }))

      const completeResultData = {
        ...result,
        investigations: processedInvestigations
      }

      setSelectedResult(completeResultData)
      setShowDetailView(true)
    } catch (error) {
      console.error('Error fetching result details:', error)
      showPopup(FETCH_RESULT_VALIDATE_ERR_MSG, 'error')
    }
    // finally {
    //   setLoading(false)
    // }
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

  // Render result input based on result type and comparison type
  const renderResultInput = (item, isSubTest = false, investigationId = null) => {
    if (isSubTest && item.comparisonType === 'f' && item.fixedValues && item.fixedValues.length > 0) {
      // Render dropdown for fixed values
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
          {item.fixedValues.map((fixedValue, index) => (
            <option key={index} value={fixedValue.fixedValue}>
              {fixedValue.fixedValue}
            </option>
          ))}
        </select>
      );
    } else if (isSubTest && item.resultType === 'r') {
      // Render dropdown for radio type results
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
      // Render text input
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

        // Prepare the request payload
        const requestPayload = {
          relationId: selectedResult.relationId,
          mainChargeCodeId: selectedResult.mainChargeCodeId,
          subChargeCodeId: selectedResult.subChargeCodeId,
          clinicalNotes: selectedResult.clinical_notes || "Clinical Notes",
          sampleCollectionHeaderId: selectedResult.sampleCollectionHeaderId,
          patientId: selectedResult.patientId,
          visitId: selectedResult.visitId,
          investigationList: []
        };

        // Process each investigation
        for (const inv of selectedResult.investigations) {
          const resultEntryDetails = [];

          if (inv.investigationType === 's') {
            // Single investigation - handle both accepted and rejected cases
            if (!inv.reject && inv.result && inv.result.trim() !== "") {
              // Accepted with result
              resultEntryDetails.push({
                result: inv.result,
                remarks: inv.remarks || "",
                sampleId: inv.sampleId,
                investigationId: inv.investigationId,
                subInvestigationId: null,
                resultType: inv.resultType || "s",
                comparisonType: "n",
                fixedId: 0,
                normalId: 0,
                normalRange: inv.normal_range || "",
                fixedValue: null
              });
            } else if (inv.reject) {
              // Rejected investigation - include with null result
              resultEntryDetails.push({
                result: null,
                remarks: inv.remarks || "Rejected",
                sampleId: inv.sampleId,
                investigationId: inv.investigationId,
                subInvestigationId: null,
                resultType: inv.resultType || "s",
                comparisonType: "n",
                fixedId: 0,
                normalId: 0,
                normalRange: inv.normal_range || "",
                fixedValue: null
              });
            }
          } else if (inv.investigationType === 'm') {
            // Main investigation with sub-tests
            const hasAnySubTestResult = inv.subTests.some(subTest =>
              !subTest.reject && subTest.result && subTest.result.trim() !== ""
            );

            if (hasAnySubTestResult) {
              for (const subTest of inv.subTests) {
                if (!subTest.reject && subTest.result && subTest.result.trim() !== "") {
                  // Sub-test with result
                  let fixedId = 0;
                  let normalId = 0;

                  if (subTest.comparisonType === 'f' && subTest.fixedValues) {
                    const selectedFixedValue = subTest.fixedValues.find(
                      fixedValue => fixedValue.fixedValue === subTest.result
                    );
                    fixedId = selectedFixedValue ? selectedFixedValue.fixedId : 0;
                  } else if (subTest.comparisonType === 'n') {
                    normalId = subTest.normalId || 0;
                  }

                  resultEntryDetails.push({
                    result: subTest.result,
                    remarks: subTest.remarks || "",
                    sampleId: inv.sampleId,
                    investigationId: inv.investigationId,
                    subInvestigationId: subTest.subInvestigationId,
                    resultType: subTest.resultType || "t",
                    comparisonType: subTest.comparisonType || "n",
                    fixedId: fixedId,
                    normalId: normalId,
                    normalRange: subTest.normal_range || "",
                    fixedValue: null
                  });
                } else if (subTest.reject) {
                  // Rejected sub-test
                  resultEntryDetails.push({
                    result: null,
                    remarks: subTest.remarks || "Rejected",
                    sampleId: inv.sampleId,
                    investigationId: inv.investigationId,
                    subInvestigationId: subTest.subInvestigationId,
                    resultType: subTest.resultType || "t",
                    comparisonType: subTest.comparisonType || "n",
                    fixedId: 0,
                    normalId: 0,
                    normalRange: subTest.normal_range || "",
                    fixedValue: null
                  });
                } else if (!subTest.reject && (!subTest.result || subTest.result.trim() === "")) {
                  // Empty sub-test (when some sub-tests have results)
                  resultEntryDetails.push({
                    result: null,
                    remarks: null,
                    sampleId: inv.sampleId,
                    investigationId: inv.investigationId,
                    subInvestigationId: subTest.subInvestigationId,
                    resultType: subTest.resultType || "t",
                    comparisonType: subTest.comparisonType || "n",
                    fixedId: 0,
                    normalId: 0,
                    normalRange: subTest.normal_range || "",
                    fixedValue: null
                  });
                }
              }
            }
          }

          // Only add if there are result entry details
          if (resultEntryDetails.length > 0) {
            requestPayload.investigationList.push({
              investigationId: inv.investigationId,
              sampleCollectionDetailsId: inv.sampleCollectionDetailsId || 0,
              resultEntryDetailsRequestList: resultEntryDetails
            });
          }
        }

        // Check if there are any investigations with results to submit
        if (requestPayload.investigationList.length === 0) {
          showPopup(RESULT_ENTRY_WARN_MSG, "warning");
          setLoading(false);
          return;
        }

        console.log("Submitting result entry payload:", JSON.stringify(requestPayload, null, 2));

        const response = await postRequest(`${SAVE_RESULT_ENTRY_END_URL}`, requestPayload);

        if (response.status === 200) {
          showPopup(RESULT_SUBMIT_SUCC_MSG, "success", true);
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
      // Refetch data to reset
      handleRowClick(selectedResult)
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
                {/* Patient Details */}
                <div className="card mb-4">
                  <div className="card-header">
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

                {/* Sample Collection Details */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">SAMPLE COLLECTION DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Collection Date/Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedResult.collection_date} - ${selectedResult.collection_time}`}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Collected By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.collected_by}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Validate Date/Time</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${selectedResult.validated_date} - ${selectedResult.validated_time}`}
                          readOnly
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Validated By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedResult.validated_by}
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
                        <th>Sample Id</th>
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
                            // Single investigation without sub-tests (type 's')
                            <tr key={investigation.id}>
                              <td>{investigation.si_no}</td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.generatedSampleId}
                                  style={{ width: "150px" }}
                                  readOnly
                                />
                              </td>
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
                                  style={{ width: "60px" }}
                                  readOnly
                                />
                              </td>
                              <td>
                                <textarea
                                  className="form-control"
                                  rows="2"
                                  value={investigation.normal_range}
                                  style={{ width: "120px" }}
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
                            // Main investigation with sub-tests (type 'm')
                            <>
                              {/* Main investigation row (header) - NO generatedSampleId */}
                              <tr key={investigation.id} className="table-secondary">
                                <td>{investigation.si_no}</td>
                                <td colSpan="8">
                                  <strong>{investigation.investigation}</strong>
                                </td>
                              </tr>
                              {/* Sub-test rows - show generatedSampleId here */}
                              {investigation.subTests.map((subTest) => (
                                <tr key={subTest.id}>
                                  <td>{subTest.si_no}</td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={subTest.generatedSampleId}
                                      style={{ width: "150px" }}
                                      readOnly
                                    />
                                  </td>
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
                                      style={{ width: "60px" }}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <textarea
                                      className="form-control"
                                      rows="2"
                                      value={subTest.normal_range}
                                      style={{ width: "120px" }}
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
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
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
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={searchData.mobileNo}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              handleSearchChange({
                                target: {
                                  id: "mobileNo",
                                  value
                                }
                              });
                            }}
                          />
                        </div>
                        <div className="col-md-3 d-flex">
                          <button
                            type="button"
                            className="btn btn-primary me-2"
                            onClick={handleSearch}
                            disabled={isSearching}
                          >
                            {isSearching ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Searching...
                              </>
                            ) : (
                              'Search'
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleShowAll}
                            disabled={isShowingAll}
                          >
                            <i className="mdi mdi-refresh"></i> Show All
                          </button>
                        </div>
                      </div>
                    </form>
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
                          <th>Order Date/Time</th>
                          <th>Order No.</th>
                          <th>Collection Date/Time</th>
                          <th>Patient Name</th>
                          <th>Age/Gender</th>
                          <th>Mobile No</th>
                          <th>Department Name</th>
                          <th>Modality</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultList.length > 0 ? (
                          resultList.map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => handleRowClick(item)}
                              style={{ cursor: "pointer" }}
                              className="table-row-hover"
                            >
                              <td>{`${item.order_date} - ${item.order_time}`}</td>
                              <td>{item.order_no}</td>
                              <td>{`${item.collection_date} - ${item.collection_time}`}</td>
                              <td>{item.patient_name}</td>
                              <td>{`${item.age}/${item.gender}`}</td>
                              <td>{item.mobile_no}</td>
                              <td>{item.department}</td>
                              <td>{item.modality}</td>
                              <td>
                                <span className={`badge ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              No pending result entries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
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
import { useState, useEffect } from "react"
import { useNavigate } from 'react-router-dom'
import { getRequest, putRequest } from "../../../service/apiService"
import { LAB, ALL_REPORTS, PENDING_SAMPLE_HEADERS_FOR_RESULT_VALIDATION_END_URL, REQUEST_PARAM_HOSPITAL_ID, PENDING_SUB_INVESTIGATIONS_FOR_RESULT_VALIDATION_END_URL, REQUEST_PARAM_RESULT_ENTRY_DT_ID, REQUEST_PARAM_INVESTIGATION_ID, FIXED_VALUE_DROPDOWNS_END_URL, REQUEST_PARAM_SUB_INVESTIGATION_ID, RESULT_VALIDATE_END_URL, REQUEST_PARAM_RESULT_ENTRY_HD_ID, PENDING_INVESTIGATIONS_FOR_RESULT_VALIDATION_END_URL, REQUEST_PARAM_PAGE, REQUEST_PARAM_SIZE } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"
import { FETCH_RESULT_ENTRY_ERR_MSG, INVALID_PAGE_NO_WARN_MSG, RESULT_ENTRY_WARN_MSG, RESULT_SELECT_WARN_MSG, RESULT_VALIDATE_ERR_MSG, RESULT_VALIDATE_SUCC_MSG, RESULT_VALIDATE_WARN_MSG } from "../../../config/constants"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { checkInRange, getResultTextStyle } from "../../../utils/rangeCheckService";

const ResultValidation = () => {
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
  const [confirmationPopup, setConfirmationPopup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [masterValidate, setMasterValidate] = useState(false)
  const [masterReject, setMasterReject] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE
  const navigate = useNavigate()
  const hospitalId = sessionStorage.getItem("hospitalId")

  // Fetch pending validation headers on component mount
  useEffect(() => {
    fetchPendingValidationHeaders()
  }, []) // Only run once on mount

  // Separate effect for page changes without loading screen
  useEffect(() => {
    if (!loading) { // Only fetch if initial load is complete
      fetchPendingValidationHeadersForPageChange()
    }
  }, [currentPage])

  // API call for headers with search filters and pagination (with loading)
  const fetchPendingValidationHeaders = async (isSearchAction = false) => {
    try {
      if (isSearchAction) {
        setIsSearching(true)
      } else {
        setLoading(true)
      }

      let url = `${PENDING_SAMPLE_HEADERS_FOR_RESULT_VALIDATION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      if (searchData.patientName) {
        url += `&patientName=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&patientMobileNumber=${encodeURIComponent(searchData.mobileNo)}`
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
        console.error('Error fetching pending validation headers:', data.message);
        showPopup(FETCH_RESULT_ENTRY_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending validation headers:', error);
      showPopup(FETCH_RESULT_ENTRY_ERR_MSG, 'error')
    } finally {
      if (isSearchAction) {
        setIsSearching(false)
      } else {
        setLoading(false)
      }
    }
  };

  // New function for page changes without loading screen
  const fetchPendingValidationHeadersForPageChange = async () => {
    try {
      let url = `${PENDING_SAMPLE_HEADERS_FOR_RESULT_VALIDATION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=${currentPage - 1}&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      if (searchData.patientName) {
        url += `&patientName=${encodeURIComponent(searchData.patientName)}`
      }
      if (searchData.mobileNo) {
        url += `&patientMobileNumber=${encodeURIComponent(searchData.mobileNo)}`
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
        console.error('Error fetching pending validation headers:', data.message);
        showPopup(FETCH_RESULT_ENTRY_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending validation headers:', error);
      showPopup(FETCH_RESULT_ENTRY_ERR_MSG, 'error')
    }
  };

  // API call for investigations when row is clicked
  const fetchInvestigations = async (resultEntryHeaderId) => {
    try {
      const data = await getRequest(`${PENDING_INVESTIGATIONS_FOR_RESULT_VALIDATION_END_URL}?${REQUEST_PARAM_RESULT_ENTRY_HD_ID}=${resultEntryHeaderId}`);

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
  const fetchSubInvestigations = async (resultEntryDetailId, investigationId) => {
    try {
      const data = await getRequest(`${PENDING_SUB_INVESTIGATIONS_FOR_RESULT_VALIDATION_END_URL}?${REQUEST_PARAM_RESULT_ENTRY_DT_ID}=${resultEntryDetailId}&${REQUEST_PARAM_INVESTIGATION_ID}=${investigationId}`);

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
      resultEntryHeaderId: item.resultEntryHeaderId,
      result_date: formatDate(item.resultDate),
      result_time: formatTime(item.resultTime),
      patient_name: item.patientName || '',
      relation: item.patientRelation || '',
      department: item.mainChargeCodeName || '',
      doctor_name: item.doctorName || '',
      modality: item.subChargeCodeName || '',
      priority: '',
      age: item.patientAge || '',
      gender: item.patientGender || '',
      clinical_notes: "",
      validated_by: item.validatedBy || '',
      result_entered_by: item.resultEnteredBy || '',
      patientId: 0,
      mobile_no: item.patientPhnNum || '',
      orderHdId: item.orderHdId || 0,
      orderNo: item.orderNo || '',
      investigations: []
    }))
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

  const renderResultInput = (test, isSubTest = false, investigationId = null) => {
    const resultStyle = getResultTextStyle(test.inRange);

    if (test.comparisonType === 'f' && test.fixedDropdownValues && test.fixedDropdownValues.length > 0) {
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
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchPendingValidationHeaders(true)
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

      let url = `${PENDING_SAMPLE_HEADERS_FOR_RESULT_VALIDATION_END_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_PAGE}=0&${REQUEST_PARAM_SIZE}=${itemsPerPage}`

      const data = await getRequest(url);

      console.log("All Headers API Response:", data);

      if (data.status === 200 && data.response) {
        const formattedData = formatHeaderData(data.response.content || []);
        setResultList(formattedData);
        setTotalPages(data.response.totalPages || 0);
        setTotalElements(data.response.totalElements || 0);
      } else {
        console.error('Error fetching pending validation headers:', data.message);
        showPopup(FETCH_RESULT_ENTRY_ERR_MSG, 'error')
      }
    } catch (error) {
      console.error('Error fetching pending validation headers:', error);
      showPopup(FETCH_RESULT_ENTRY_ERR_MSG, 'error')
    } finally {
      setLoading(false);
    }
  }

  const handleRowClick = async (result) => {
    try {

      // Fetch investigations for this result entry
      const investigations = await fetchInvestigations(result.resultEntryHeaderId)

      // Process each investigation based on its type
      const processedInvestigations = await Promise.all(investigations.map(async (inv, index) => {
        if (inv.investigationType === 'm') {
          // Fetch sub-investigations for this main investigation
          const subInvestigations = await fetchSubInvestigations(inv.resultEntryDetailsId, inv.investigationId)

          // Process sub-investigations with fixed values if needed
          const processedSubTests = await Promise.all(subInvestigations.map(async (subTest, subIndex) => {
            let fixedDropdownValues = []

            // If comparisonType is 'f', fetch fixed values dropdown
            if (subTest.comparisonType === 'f') {
              fixedDropdownValues = await fetchFixedValues(subTest.subInvestigationId)
            }

            // Calculate inRange for subTest
            const inRange = checkInRange(subTest.result, subTest.normalValue);

            return {
              id: `${index + 1}.${subIndex + 1}`,
              si_no: subInvestigations.length === 1 ? "" : `${index + 1}.${String.fromCharCode(97 + subIndex)}`,
              resultEntryDetailsId: subTest.resultEntryDetailsId || inv.resultEntryDetailsId,
              subInvestigationId: subTest.subInvestigationId,
              investigation: subTest.subInvestigationName,
              sample: inv.sampleName,
              result: subTest.result || "",
              units: subTest.unitName || "",
              normal_range: subTest.normalValue || "",
              remarks: subTest.remarks || "",
              reject: false,
              validate: true,
              comparisonType: subTest.comparisonType || "",
              fixedId: subTest.fixedId || null,
              fixedDropdownValues: fixedDropdownValues,
              generatedSampleId: subTest.generatedSampleId || inv.generatedSampleId || '',
              inRange: inRange
            }
          }))

          // Calculate inRange for main investigation
          const mainInRange = checkInRange(inv.result, inv.normalValue);

          return {
            id: index + 1,
            si_no: index + 1,
            resultEntryDetailsId: inv.resultEntryDetailsId,
            investigationId: inv.investigationId,
            investigation: inv.investigationName,
            sample: inv.sampleName,
            result: inv.result || "",
            units: inv.unit || '',
            normal_range: inv.normalValue || '',
            remarks: inv.remarks || "",
            reject: false,
            validate: true,
            comparisonType: inv.comparisonType || "",
            fixedId: inv.fixedId || null,
            fixedDropdownValues: inv.fixedDropdownValues || [],
            generatedSampleId: '', // Empty for main investigation (type 'm')
            inRange: mainInRange,
            subTests: processedSubTests
          }
        } else {
          // Single investigation (type 's')
          // Calculate inRange for single investigation
          const inRange = checkInRange(inv.result, inv.normalValue);

          return {
            id: index + 1,
            si_no: index + 1,
            resultEntryDetailsId: inv.resultEntryDetailsId,
            investigationId: inv.investigationId,
            investigation: inv.investigationName,
            sample: inv.sampleName,
            result: inv.result || "",
            units: inv.unit || '',
            normal_range: inv.normalValue || '',
            remarks: inv.remarks || "",
            reject: false,
            validate: true,
            comparisonType: inv.comparisonType || "",
            fixedId: inv.fixedId || null,
            fixedDropdownValues: inv.fixedDropdownValues || [],
            generatedSampleId: inv.generatedSampleId || '',
            inRange: inRange,
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
      setMasterValidate(true)
      setMasterReject(false)
    } catch (error) {
      console.error('Error fetching result details:', error)
      showPopup(FETCH_RESULT_ENTRY_ERR_MSG, 'error')
    }
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
      showPopup(RESULT_VALIDATE_WARN_MSG, "warning");
      return;
    }

    setLoading(true);

    try {
      const validationList = [];

      selectedResult.investigations.forEach(inv => {
        if (inv.subTests && inv.subTests.length > 0) {
          inv.subTests.forEach(subTest => {
            if (subTest.validate || subTest.reject) {
              validationList.push({
                resultEntryDetailsId: subTest.resultEntryDetailsId,
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
              resultEntryDetailsId: inv.resultEntryDetailsId,
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
        showPopup(RESULT_SELECT_WARN_MSG, "warning");
        setLoading(false);
        return;
      }

      const requestPayload = {
        resultEntryHeaderId: selectedResult.resultEntryHeaderId,
        validationList: validationList
      };

      console.log("Submitting validation request:", requestPayload);

      const response = await putRequest(`${RESULT_VALIDATE_END_URL}`, requestPayload);

      if (response.status === 200) {
        setConfirmationPopup({
          message: RESULT_VALIDATE_SUCC_MSG,
          onConfirm: onConfirmPrint,
          onCancel: () => {
            setConfirmationPopup(null);
            handleValidationSuccess();
          },
          confirmText: "Yes",
          cancelText: "No",
          type: "success"
        });
      } else {
        showPopup(RESULT_VALIDATE_ERR_MSG, "error");
      }
    } catch (error) {
      console.error("Error submitting validation:", error);
      showPopup(RESULT_VALIDATE_ERR_MSG, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleValidationSuccess = async () => {
    await fetchPendingValidationHeaders();
    setShowDetailView(false);
    setSelectedResult(null);
    setMasterValidate(false);
    setMasterReject(false);
  };

  const onConfirmPrint = () => {
    // Navigate to ViewDownload page with the selected result data
    navigate('/ViewDownwload', {
      state: {
        resultData: selectedResult,
        orderHdId: selectedResult.orderHdId
      }
    });
    setConfirmationPopup(null);
    handleValidationSuccess(); // This will refresh the list
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
                <div className="modal-footer justify-content-center">
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
                    className={`btn ${confirmationPopup.type === 'success' ? 'btn-success' :
                        confirmationPopup.type === 'warning' ? 'btn-warning' :
                          confirmationPopup.type === 'danger' ? 'btn-danger' : 'btn-primary'
                      }`}
                    onClick={() => { if (confirmationPopup.onConfirm) confirmationPopup.onConfirm(); }}
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
                  <div className="card-header">
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
                        <th>Sample Id</th>
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
                                  rows="3"
                                  value={investigation.normal_range}
                                  readOnly
                                ></textarea>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control bg-transparent"
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
                            // Main investigation with sub-tests (type 'm')
                            <>
                              {/* Main investigation row (header) - NO generatedSampleId */}
                              <tr key={investigation.id} className="table-secondary">
                                <td>{investigation.si_no}</td>
                                <td colSpan="9">
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
                                  <td className="ps-4">
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
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="mdi mdi-check-circle"></i> VALIDATE
                      </>
                    )}
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
                              const value = e.target.value.replace(/\D/g, ""); // allow only digits
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
                          <th>Result Date/Time</th>
                          <th>Patient Name</th>
                          <th>Age/Gender</th>
                          <th>Mobile No</th>
                          <th>Department Name</th>
                          <th>Doctor Name</th>
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
                              <td>{`${item.result_date} - ${item.result_time}`}</td>
                              <td>{item.patient_name}</td>
                              <td>{`${item.age} / ${item.gender}`}</td>
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
                            <td colSpan="8" className="text-center py-4">
                              No results pending validation found
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

export default ResultValidation
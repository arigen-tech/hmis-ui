import React, { useState, useEffect } from "react"
import { getRequest, putRequest } from "../../../service/apiService"
import { LAB } from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"
import Popup from "../../../Components/popup"

const UpdateResultValidation = () => {
  const [resultList, setResultList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: "",
  })
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [selectedResult, setSelectedResult] = useState(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const itemsPerPage = 5

  // Fetch update results data
  useEffect(() => {
    fetchUpdateResults()
  }, [])

  const fetchUpdateResults = async () => {
    try {
      setLoading(true);
      const data = await getRequest(`${LAB}/getUpdate`);

      if (data.status === 200 && data.response) {
        const formattedData = formatUpdateData(data.response);
        setResultList(formattedData);
      } else {
        console.error('Error fetching update results:', data.message);
        showPopup('Failed to load update results', 'error')
      }
    } catch (error) {
      console.error('Error fetching update results:', error);
      showPopup('Error fetching update results', 'error')
    } finally {
      setLoading(false);
    }
  };

  const formatUpdateData = (apiData) => {
    // Group by orderHdId to merge multiple headers
    const orderMap = new Map();

    // Sort API data by orderHdId and resultEntryHeaderId to maintain order
    const sortedApiData = [...apiData].sort((a, b) => {
      if (a.orderHdId !== b.orderHdId) {
        return a.orderHdId - b.orderHdId;
      }
      // Sort headers within the same order by resultEntryHeaderId
      const aHeaderId = a.resultEntryUpdateHeaderResponses?.[0]?.resultEntryHeaderId || 0;
      const bHeaderId = b.resultEntryUpdateHeaderResponses?.[0]?.resultEntryHeaderId || 0;
      return aHeaderId - bHeaderId;
    });

    sortedApiData.forEach((order) => {
      const orderHdId = order.orderHdId;
      
      if (!orderMap.has(orderHdId)) {
        // Create base order object
        orderMap.set(orderHdId, {
          id: orderHdId,
          orderHdId: orderHdId,
          order_date: formatDate(order.orderDate),
          order_no: order.orderNo,
          order_time: formatTime(order.orderTime),
          patient_name: order.patientName || '',
          relation: order.relation || '',
          age: order.patientAge || '',
          gender: order.patientGender || '',
          clinical_notes: "",
          mobile_no: order.patientPhnNum || '',
          patientId: order.patientId || 0,
          doctor_name: '',
          headers: [] // Store all headers for this order
        });
      }

      // Add all headers for this order
      const currentOrder = orderMap.get(orderHdId);
      if (order.resultEntryUpdateHeaderResponses) {
        // Sort headers by resultEntryHeaderId
        const sortedHeaders = [...order.resultEntryUpdateHeaderResponses].sort((a, b) => 
          a.resultEntryHeaderId - b.resultEntryHeaderId
        );

        sortedHeaders.forEach((header) => {
          const headerWithSortedInvestigations = {
            resultEntryHeaderId: header.resultEntryHeaderId,
            investigations: header.resultEntryUpdateInvestigationResponseList ? 
              // Sort investigations by resultEntryDetailsId to maintain order
              [...header.resultEntryUpdateInvestigationResponseList]
                .sort((a, b) => a.resultEntryDetailsId - b.resultEntryDetailsId)
                .map((inv, invIndex) => {
                  const hasSubTests = inv.entryUpdateSubInvestigationResponses && inv.entryUpdateSubInvestigationResponses.length > 0;

                  if (hasSubTests) {
                    // Sort sub-tests by resultEntryDetailsId
                    const sortedSubTests = [...inv.entryUpdateSubInvestigationResponses]
                      .sort((a, b) => a.resultEntryDetailsId - b.resultEntryDetailsId)
                      .map((subTest, subIndex) => ({
                        id: `${header.resultEntryHeaderId}-${inv.resultEntryDetailsId}-${subTest.resultEntryDetailsId}`,
                        original_si_no: getSubTestNumber(invIndex + 1, subIndex, inv.entryUpdateSubInvestigationResponses.length),
                        resultEntryDetailsId: subTest.resultEntryDetailsId,
                        diag_no: "---",
                        investigation: subTest.subInvestigationName || '',
                        sample: subTest.sampleName || '',
                        result: subTest.result || "",
                        units: subTest.unit || '',
                        normal_range: subTest.normalValue || '',
                        remarks: subTest.remarks || "",
                        inRange: subTest.inRange !== undefined ? subTest.inRange : null,
                        comparisonType: subTest.comparisonType || "",
                        fixedId: subTest.fixedId || null,
                        fixedDropdownValues: subTest.fixedDropdownValues || [],
                        headerId: header.resultEntryHeaderId,
                      }));

                    return {
                      id: `${header.resultEntryHeaderId}-${inv.resultEntryDetailsId}`,
                      original_si_no: invIndex + 1,
                      resultEntryDetailsId: inv.resultEntryDetailsId,
                      diag_no: inv.diagNo || '',
                      investigation: inv.investigationName || '',
                      sample: inv.sampleName || '',
                      result: inv.result || "",
                      units: inv.unit || '',
                      normal_range: inv.normalValue || '',
                      remarks: inv.remarks || "",
                      inRange: inv.inRange !== undefined ? inv.inRange : null,
                      comparisonType: inv.comparisonType || "",
                      fixedId: inv.fixedId || null,
                      fixedDropdownValues: inv.fixedDropdownValues || [],
                      headerId: header.resultEntryHeaderId,
                      subTests: sortedSubTests
                    };
                  } else {
                    return {
                      id: `${header.resultEntryHeaderId}-${inv.resultEntryDetailsId}`,
                      original_si_no: invIndex + 1,
                      resultEntryDetailsId: inv.resultEntryDetailsId,
                      diag_no: inv.diagNo || '',
                      investigation: inv.investigationName || '',
                      sample: inv.sampleName || '',
                      result: inv.result || "",
                      units: inv.unit || '',
                      normal_range: inv.normalValue || '',
                      remarks: inv.remarks || "",
                      inRange: inv.inRange !== undefined ? inv.inRange : null,
                      comparisonType: inv.comparisonType || "",
                      fixedId: inv.fixedId || null,
                      fixedDropdownValues: inv.fixedDropdownValues || [],
                      headerId: header.resultEntryHeaderId,
                      subTests: []
                    };
                  }
                }) : []
          };
          currentOrder.headers.push(headerWithSortedInvestigations);
        });
      }
    });

    // Convert map to array and flatten investigations for display
    return Array.from(orderMap.values()).map(order => ({
      ...order,
      // Sort headers by resultEntryHeaderId
      headers: order.headers.sort((a, b) => a.resultEntryHeaderId - b.resultEntryHeaderId),
      // For list view, we just need basic info
      investigationCount: order.headers.reduce((count, header) => 
        count + (header.investigations ? header.investigations.length : 0), 0
      ),
      headerCount: order.headers.length
    }));
  }

  // Helper functions for formatting
  const getSubTestNumber = (mainIndex, subIndex, totalSubTests) => {
    if (totalSubTests === 1) {
      return "";
    } else {
      return `${mainIndex}.${String.fromCharCode(97 + subIndex)}`;
    }
  }

  // UPDATED: Generate sequential serial numbers while preserving original order based on IDs
  const generateSequentialSerialNumbers = (investigations) => {
    let mainCounter = 1;
    let processedInvestigations = [];
    
    // Sort investigations by headerId and resultEntryDetailsId to maintain consistent order
    const sortedInvestigations = [...investigations].sort((a, b) => {
      // First sort by headerId
      if (a.headerId !== b.headerId) {
        return a.headerId - b.headerId;
      }
      // Then sort by resultEntryDetailsId within the same header
      return a.resultEntryDetailsId - b.resultEntryDetailsId;
    });

    sortedInvestigations.forEach((investigation) => {
      if (investigation.subTests && investigation.subTests.length === 0) {
        // Single investigation without sub-tests
        processedInvestigations.push({
          ...investigation,
          si_no: mainCounter.toString(),
          displayType: 'single'
        });
        mainCounter++;
      } else if (investigation.subTests && investigation.subTests.length > 0) {
        // Investigation with sub-tests
        // Add main investigation row
        processedInvestigations.push({
          ...investigation,
          si_no: mainCounter.toString(),
          displayType: 'main',
          isHeader: true
        });
        
        // Sort sub-tests by resultEntryDetailsId to maintain order
        const sortedSubTests = [...investigation.subTests].sort((a, b) => 
          a.resultEntryDetailsId - b.resultEntryDetailsId
        );
        
        // Add sub-tests with proper numbering
        sortedSubTests.forEach((subTest, subIndex) => {
          const subTestNumber = investigation.subTests.length === 1 ? 
            "" : 
            `${mainCounter}.${String.fromCharCode(97 + subIndex)}`;
          
          processedInvestigations.push({
            ...subTest,
            si_no: subTestNumber,
            displayType: 'subtest',
            parentId: investigation.id
          });
        });
        
        mainCounter++;
      } else {
        // Fallback for investigations without subTests property
        processedInvestigations.push({
          ...investigation,
          si_no: mainCounter.toString(),
          displayType: 'single'
        });
        mainCounter++;
      }
    });
    
    return processedInvestigations;
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

  // FIXED: Handle result change for main investigations
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

  // FIXED: Handle result change for sub-tests
  const handleSubTestResultChange = (subTestId, value, selectedFixedId = null) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.displayType === 'subtest' && inv.id === subTestId) {
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

  // FIXED: Handle remarks change for main investigations
  const handleRemarksChange = (investigationId, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.id === investigationId) {
          return {
            ...inv,
            remarks: value
          }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  // FIXED: Handle remarks change for sub-tests
  const handleSubTestRemarksChange = (subTestId, value) => {
    if (selectedResult) {
      const updatedInvestigations = selectedResult.investigations.map((inv) => {
        if (inv.displayType === 'subtest' && inv.id === subTestId) {
          return {
            ...inv,
            remarks: value
          }
        }
        return inv
      })
      setSelectedResult({ ...selectedResult, investigations: updatedInvestigations })
    }
  }

  // Render result input field with proper fixedId handling and inRange styling
  const renderResultInput = (test) => {
    const resultStyle = getResultTextStyle(test.inRange);

    if (test.comparisonType === 'f' && test.fixedDropdownValues && test.fixedDropdownValues.length > 0) {
      return (
        <div>
          <select
            className="form-select"
            value={test.fixedId || ""}
            onChange={(e) => {
              const selectedFixedId = e.target.value ? parseInt(e.target.value) : null;
              const selectedOption = test.fixedDropdownValues.find(opt => opt.fixedId === selectedFixedId);
              const resultValue = selectedOption ? selectedOption.fixedValue : "";

              if (test.displayType === 'subtest') {
                handleSubTestResultChange(test.id, resultValue, selectedFixedId);
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
            if (test.displayType === 'subtest') {
              handleSubTestResultChange(test.id, e.target.value, null);
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

  // Render remarks input field
  const renderRemarksInput = (test) => {
    return (
      <input
        type="text"
        className="form-control"
        value={test.remarks}
        onChange={(e) => {
          if (test.displayType === 'subtest') {
            handleSubTestRemarksChange(test.id, e.target.value);
          } else {
            handleRemarksChange(test.id, e.target.value);
          }
        }}
        placeholder="Enter remarks"
        style={{ padding: "2px 4px", fontSize: "0.875rem" }}
      />
    )
  }

  const handleSearchChange = (e) => {
    const { id, value } = e.target
    setSearchData((prevData) => ({ ...prevData, [id]: value }))
    setCurrentPage(1)
  }

  const handleRowClick = (result) => {
    // When clicking a row, combine all investigations from all headers
    const allInvestigations = result.headers.flatMap(header => header.investigations);
    
    // Generate sequential serial numbers for all investigations with consistent ordering based on IDs
    const investigationsWithSequentialNumbers = generateSequentialSerialNumbers(allInvestigations);
    
    setSelectedResult({
      ...result,
      investigations: investigationsWithSequentialNumbers
    });
    setShowDetailView(true);
  }

  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedResult(null)
  }

  // UPDATED: Handle Update based on your service implementation
  const handleUpdate = async () => {
    if (!selectedResult) return;

    setLoading(true);

    try {
      // Prepare update payload for all headers
      const updatePromises = selectedResult.headers.map(header => {
        const headerInvestigations = selectedResult.investigations.filter(inv => 
          inv.headerId === header.resultEntryHeaderId && inv.displayType !== 'main'
        );

        const resultUpdateDetailRequests = [];

        headerInvestigations.forEach(inv => {
          if (inv.displayType === 'subtest' || inv.displayType === 'single') {
            resultUpdateDetailRequests.push({
              resultEntryDetailsId: inv.resultEntryDetailsId,
              result: inv.result || "",
              remarks: inv.remarks || "",
              fixedId: inv.fixedId || null,
              comparisonType: inv.comparisonType || ""
            });
          }
        });

        // Sort detail requests by resultEntryDetailsId to maintain order
        const sortedDetailRequests = resultUpdateDetailRequests.sort((a, b) => 
          a.resultEntryDetailsId - b.resultEntryDetailsId
        );

        // Create payload according to your API structure
        const requestPayload = {
          orderHdId: selectedResult.orderHdId,
          resultEntryHeaderId: header.resultEntryHeaderId,
          resultUpdateDetailRequests: sortedDetailRequests
        };

        console.log("Submitting update request for header:", header.resultEntryHeaderId, requestPayload);

        // Call update API for each header
        return putRequest(`${LAB}/update`, requestPayload);
      });

      const responses = await Promise.all(updatePromises);
      const allSuccess = responses.every(response => response.status === 200);

      if (allSuccess) {
        showPopup("All results updated successfully!", "success");
        await fetchUpdateResults();
        setShowDetailView(false);
        setSelectedResult(null);
      } else {
        const errorMessages = responses
          .filter(response => response.status !== 200)
          .map(response => response.message)
          .join(', ');
        showPopup(`Some results failed to update: ${errorMessages}`, "error");
      }
    } catch (error) {
      console.error("Error submitting update:", error);
      showPopup("Error submitting update: " + (error.message || "Unknown error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (selectedResult) {
      const originalResult = resultList.find((r) => r.id === selectedResult.id)
      if (originalResult) {
        const allInvestigations = originalResult.headers.flatMap(header => header.investigations);
        const investigationsWithSequentialNumbers = generateSequentialSerialNumbers(allInvestigations);
        setSelectedResult({
          ...originalResult,
          investigations: investigationsWithSequentialNumbers
        });
      }
    }
  }

  const filteredResultList = resultList.filter((item) => {
    const patientNameMatch =
      searchData.patientName === "" || item.patient_name.toLowerCase().includes(searchData.patientName.toLowerCase())

    const mobileNoMatch = searchData.mobileNo === "" || (item.mobile_no && item.mobile_no.includes(searchData.mobileNo))

    return patientNameMatch && mobileNoMatch
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
          <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
        )}
        {loading && <LoadingScreen />}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="card-title p-2">UPDATE RESULT ENTRY</h4>
                  <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="mdi mdi-arrow-left"></i> Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Patient Details */}
                <div className="card mb-4">
                  <div className="card-header  ">
                    <h5 className="mb-0">PATIENT DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Patient Name</label>
                        <input type="text" className="form-control" value={selectedResult.patient_name} readOnly />
                      </div>

                       <div className="col-md-4">
                        <label className="form-label fw-bold">Mobile No.</label>
                        <input type="text" className="form-control" value={selectedResult.mobile_no} readOnly />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-bold">Relation</label>
                        <input type="text" className="form-control" value={selectedResult.relation} readOnly />
                      </div>
                     
                    </div>
                    <div className="row mt-3">

                       <div className="col-md-4">
                        <label className="form-label fw-bold">Age</label>
                        <input type="text" className="form-control" value={selectedResult.age} readOnly />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-bold">Gender</label>
                        <input type="text" className="form-control" value={selectedResult.gender} readOnly />
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

                {/* Order Details Section - ONLY THREE FIELDS */}
                <div className="card mb-4">
                  <div className="card-header  ">
                    <h5 className="mb-0">ORDER DETAILS</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order Date/Time</label>
                        <input type="text" className="form-control" value={`${selectedResult.order_date} - ${selectedResult.order_time}`} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Order Number</label>
                        <input type="text" className="form-control" value={selectedResult.order_no} readOnly />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investigations Table */}
                <div className="table-responsive" style={{ overflowX: "auto" }}>
                  <table 
                    className="table table-bordered table-hover" 
                    style={{ 
                      marginBottom: "0",
                      tableLayout: "fixed",
                      width: "100%",
                      minWidth: "800px"
                    }}
                  >
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "60px" }}>SI No.</th>
                        <th style={{ width: "80px" }}>Diag No.</th>
                        <th style={{ width: "200px" }}>Investigation</th>
                        <th style={{ width: "80px" }}>Sample</th>
                        <th style={{ width: "80px" }}>Result</th>
                        <th style={{ width: "60px" }}>Units</th>
                        <th style={{ width: "120px" }}>Normal Range</th>
                        <th style={{ width: "100px" }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.investigations.map((investigation, index) => (
                        <React.Fragment key={investigation.id}>
                          {investigation.displayType === 'main' ? (
                            // Main investigation header row
                            <tr>
                              <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                {investigation.si_no}
                              </td>
                              <td style={{ padding: "4px", textAlign: "center", width: "80px" }}>
                                {investigation.diag_no}
                              </td>
                              <td colSpan="6" style={{ padding: "4px" }}>
                                <strong>{investigation.investigation}</strong>
                              </td>
                            </tr>
                          ) : investigation.displayType === 'subtest' ? (
                            // Sub-test row
                            <tr>
                              <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                {investigation.si_no}
                              </td>
                              <td style={{ padding: "4px", textAlign: "center", width: "80px" }}>
                                {investigation.diag_no}
                              </td>
                              <td style={{ padding: "4px", width: "200px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.investigation}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "80px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.sample}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "80px" }}>
                                {renderResultInput(investigation)}
                              </td>
                              <td style={{ padding: "4px", width: "60px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.units}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "120px" }}>
                                <textarea
                                  className="form-control"
                                  rows="1"
                                  value={investigation.normal_range}
                                  readOnly
                                  style={{ 
                                    border: "none", 
                                    backgroundColor: "transparent", 
                                    padding: "2px 4px",
                                    resize: "none",
                                    height: "auto",
                                    minHeight: "34px"
                                  }}
                                ></textarea>
                              </td>
                              <td style={{ padding: "4px", width: "100px" }}>
                                {renderRemarksInput(investigation)}
                              </td>
                            </tr>
                          ) : (
                            // Single investigation without sub-tests
                            <tr>
                              <td style={{ padding: "4px", textAlign: "center", width: "60px" }}>
                                {investigation.si_no}
                              </td>
                              <td style={{ padding: "4px", textAlign: "center", width: "80px" }}>
                                {investigation.diag_no}
                              </td>
                              <td style={{ padding: "4px", width: "200px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.investigation}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "80px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.sample}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "80px" }}>
                                {renderResultInput(investigation)}
                              </td>
                              <td style={{ padding: "4px", width: "60px" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={investigation.units}
                                  readOnly
                                  style={{ border: "none", backgroundColor: "transparent", padding: "2px 4px" }}
                                />
                              </td>
                              <td style={{ padding: "4px", width: "120px" }}>
                                <textarea
                                  className="form-control"
                                  rows="1"
                                  value={investigation.normal_range}
                                  readOnly
                                  style={{ 
                                    border: "none", 
                                    backgroundColor: "transparent", 
                                    padding: "2px 4px",
                                    resize: "none",
                                    height: "auto",
                                    minHeight: "34px"
                                  }}
                                ></textarea>
                              </td>
                              <td style={{ padding: "4px", width: "100px" }}>
                                {renderRemarksInput(investigation)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="text-end mt-4">
                  <button className="btn btn-success me-3" onClick={handleUpdate} disabled={loading}>
                    <i className="mdi mdi-check-all"></i> UPDATE
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

  // List View (same as before)
  return (
    <div className="content-wrapper">
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">UPDATE RESULT ENTRY</h4>
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

                  {/* Table */}
                  <div className="table-responsive packagelist">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Order Date/Time</th>
                          <th>Order No.</th>
                          <th>Patient Name</th>
                          <th>Mobile No</th>
                          <th>Relation</th>
                          <th>Doctor Name</th>
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
                              <td>{item.patient_name}</td>
                              <td>{item.mobile_no}</td>
                              <td>{item.relation}</td>
                              <td>{item.doctor_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              No pending validation entries found
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

export default UpdateResultValidation
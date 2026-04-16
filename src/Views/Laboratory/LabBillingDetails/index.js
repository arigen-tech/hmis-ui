"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LoadingScreen from "../../../Components/Loading";
import {
  MAS_SERVICE_CATEGORY,
  PENDING_BILLINGS_BY_CATAGORY,
  LAB_SERVICE_CATAGORY,
  LAB_RADIO_BILLING_DETAILS,
} from "../../../config/apiConfig";
import { getRequest, postRequest } from "../../../service/apiService";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import {
  ERROR,
  INVALID_INVESTIGATION_ERROR,
  INVALID_INVESTIGATION_ID,
  INVALID_PATIENT_ID,
  PAYMENT_ERROR,
  REGISTRATION,
  REGISTRATION_ERR_MSG,
  REGISTRATION_SUCCESS_MSG,
  SELECT_INVESTIGATIONS_ERROR_MSG,
  UNEXPECTED_ERROR,
} from "../../../config/constants";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
};

const LabBillingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [patientList, setPatientList] = useState([]);
  const [filteredPatientList, setFilteredPatientList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: "",
    registrationNo: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [formData, setFormData] = useState({
    billingType: "",
    patientName: "",
    mobileNo: "",
    age: "",
    gender: "",
    relation: "",
    patientId: "",
    address: "",
    type: "investigation",
    rows: [],
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [checkedRows, setCheckedRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: true,
    gstPercent: 0,
  });

  const [gstConfigLoaded, setGstConfigLoaded] = useState(false);

  // Fetch pending lab billing list
  const fetchPendingLabBilling = async (page = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page,
        size: DEFAULT_ITEMS_PER_PAGE,
        patientName: searchData.patientName,
        mobileNo: searchData.mobileNo,
        registrationNo: searchData.registrationNo,
      });

      const response = await getRequest(
        `${PENDING_BILLINGS_BY_CATAGORY}/${LAB_SERVICE_CATAGORY}?${params}`,
      );
      if (response && response.response) {
        const mappedData = response.response.content.map((item) => {
          return {
            id: item.billingHeaderId,
            patientId: item.patientId,
            registrationNo: item.registrationNo,
            patientName: item.patientName || "N/A",
            mobileNo: item.mobileNo || "N/A",
            age: item.age || "N/A",
            gender: item.gender || "N/A",
            appointmentDate: item.appointmentDate,
            orderDate:item.orderDate,

            billingType: item.billingType || "Laboratory Services",
            amount: item.billAmount || 0,
            billingStatus: "Pending",

            fullData: item,
          };
        });

        setPatientList(mappedData);
        setFilteredPatientList(mappedData);
        setTotalElements(response.response.totalElements);
      }
    } catch (error) {
      console.error("Error fetching pending lab billing data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchGstConfiguration() {
    try {
      console.log("=== FETCHING GST CONFIGURATION ===");
      const data = await getRequest(
        `${MAS_SERVICE_CATEGORY}/getGstConfig/1?categoryCode=${LAB_SERVICE_CATAGORY}`,
      );
      console.log("GST API Response:", JSON.stringify(data, null, 2));

      if (
        data &&
        data.status === 200 &&
        data.response &&
        typeof data.response.gstApplicable !== "undefined"
      ) {
        const gstConfiguration = {
          gstApplicable: !!data.response.gstApplicable,
          gstPercent: Number(data.response.gstPercent) || 0,
        };
        console.log("Setting GST Configuration:", gstConfiguration);
        setGstConfig(gstConfiguration);
      } else {
        console.warn("Invalid GST API response, disabling GST:", data);
        setGstConfig({
          gstApplicable: false,
          gstPercent: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching GST configuration:", error);
      setGstConfig({
        gstApplicable: false,
        gstPercent: 0,
      });
    } finally {
      setGstConfigLoaded(true);
    }
  }

  useEffect(() => {
    fetchPendingLabBilling(currentPage - 1);
  }, [currentPage]);

  useEffect(() => {
    fetchGstConfiguration();
  }, []);

  const handleSearchChange = (e) => {
    const { id, value } = e.target;
    setSearchData((prev) => ({ ...prev, [id]: value }));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    // check if all fields are empty
    if (
      !searchData.patientName &&
      !searchData.mobileNo &&
      !searchData.registrationNo
    ) {
      // reload full data
      setIsSearchMode(false);
      fetchPendingLabBilling(0);
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      const filtered = patientList.filter((item) => {
        const patientNameMatch =
          searchData.patientName === "" ||
          item.patientName
            .toLowerCase()
            .includes(searchData.patientName.toLowerCase());

        const mobileNoMatch =
          searchData.mobileNo === "" ||
          item.mobileNo.includes(searchData.mobileNo);

        const registrationMatch =
          searchData.registrationNo === "" ||
          item.registrationNo.includes(searchData.registrationNo);

        return patientNameMatch && mobileNoMatch && registrationMatch;
      });

      setFilteredPatientList(filtered);
      setCurrentPage(1);
      setIsSearching(false);
      setIsSearchMode(true);
    }, 400);
  };

  const handleReset = () => {
    setSearchData({
      patientName: "",
      mobileNo: "",
      registrationNo: "",
    });

    setFilteredPatientList(patientList);
    setIsSearchMode(false); // return to API pagination
    setCurrentPage(1);
  };

  const handleRowClick = async (patient) => {
    console.log("Row clicked:", patient);

    try {
      setIsLoading(true);

      const billingHeaderId = patient.id;
      const response = await getRequest(
        `${LAB_RADIO_BILLING_DETAILS}/${billingHeaderId}?serviceCategoryCode=${LAB_SERVICE_CATAGORY}`,
      );
      console.log("Billing API response:", response);

      if (!response || !response.response) {
        console.error("Invalid API response");
        return;
      }

      const billingData = Array.isArray(response.response)
        ? response.response[0]
        : response.response;

      if (!billingData) {
        console.error("Billing data missing");
        return;
      }

      const details = billingData?.details || [];

      const formattedRows = details.map((item, index) => {
        const isPackage = item.packageId != null;

        return {
          id: item.id || index + 1,
          name:
            item.itemName || item.packageName || item.investigationName || "",
          date: item.orderDate
            ? item.orderDate.split("T")[0]
            : new Date().toISOString().split("T")[0],
          originalAmount: item.basePrice || item.tariff || 0,
          discountAmount: item.discount || 0,
          netAmount: item.amountAfterDiscount || item.netAmount || 0,
          type: isPackage ? "package" : "investigation",
          investigationId: item.investigationId,
          packageId: item.packageId,
          itemId: isPackage ? item.packageId : item.investigationId,
        };
      });

      setSelectedPatient({ fullData: billingData });

      setFormData({
        billingType: billingData.billingType || "",
        patientName: billingData.patientName || "",
        mobileNo: billingData.mobileNo || "",
        age: billingData.age || "",
        gender: billingData.gender || "",
        patientId: billingData.patientid || billingData.patientId,
        relation: billingData.relation || "",
        address: billingData.address || "",
        rows: formattedRows,
        type: "investigation",
      });

      setCheckedRows(new Array(formattedRows.length).fill(true));
      setIsFormValid(
        !!billingData.patientName &&
          !!billingData.mobileNo &&
          !!billingData.age &&
          !!billingData.gender,
      );

      console.log("isFormValid:", isFormValid);
      console.log("isLoading:", isLoading);
      console.log("gstConfigLoaded:", gstConfigLoaded);

      setShowPatientDetails(true);
    } catch (error) {
      console.error("Error fetching billing details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleBackToList = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    handleReset();
  };

  useEffect(() => {
    console.log("GST Config changed:", gstConfig);
  }, [gstConfig]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    const updatedFormData = { ...formData, [id]: value };
    setIsFormValid(
      !!updatedFormData.patientName &&
        !!updatedFormData.mobileNo &&
        !!updatedFormData.age &&
        !!updatedFormData.gender,
    );
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type,
    }));
  };

  const handleRowChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedRows = prev.rows.map((item, i) => {
        if (i !== index) return item;
        const updatedItem = { ...item, [field]: value };
        if (field === "originalAmount" || field === "discountAmount") {
          const original = Number(updatedItem.originalAmount) || 0;
          const discount = Number(updatedItem.discountAmount) || 0;
          updatedItem.netAmount = Math.max(0, original - discount).toFixed(2);
        }
        return updatedItem;
      });
      return { ...prev, rows: updatedRows };
    });
  };

  const addRow = (e, type = formData.type) => {
    e.preventDefault();
    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: Date.now(),
          name: "",
          date: new Date().toISOString().split("T")[0],
          originalAmount: 0,
          discountAmount: 0,
          netAmount: 0,
          type: type,
        },
      ],
    }));
    setCheckedRows((prev) => [...prev, true]);
  };

  const removeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }));
    setCheckedRows((prev) => prev.filter((_, i) => i !== index));
  };

  const isLastRowComplete = () => {
    if (formData.rows.length === 0) return true;
    const lastRow = formData.rows[formData.rows.length - 1];
    return (
      lastRow.name &&
      lastRow.name.trim() !== "" &&
      lastRow.date &&
      lastRow.date.trim() !== "" &&
      lastRow.originalAmount !== undefined &&
      lastRow.originalAmount !== "" &&
      !isNaN(lastRow.originalAmount) &&
      lastRow.discountAmount !== undefined &&
      lastRow.discountAmount !== "" &&
      !isNaN(lastRow.discountAmount)
    );
  };

  const calculatePaymentBreakdown = () => {
    console.log("=== CALCULATING PAYMENT BREAKDOWN ===");
    console.log("Current GST Config:", gstConfig);

    const checkedItems = formData.rows.filter((_, index) => checkedRows[index]);
    console.log("Checked Items:", checkedItems);

    const totalOriginalAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.originalAmount) || 0);
    }, 0);

    const totalDiscountAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.discountAmount) || 0);
    }, 0);

    const totalNetAmount = totalOriginalAmount - totalDiscountAmount;

    const totalGstAmount =
      gstConfig.gstApplicable && gstConfig.gstPercent > 0
        ? checkedItems.reduce((total, item) => {
            const itemOriginalAmount =
              Number.parseFloat(item.originalAmount) || 0;
            const itemDiscountAmount =
              Number.parseFloat(item.discountAmount) || 0;
            const itemNetAmount = itemOriginalAmount - itemDiscountAmount;
            const itemGstAmount = (itemNetAmount * gstConfig.gstPercent) / 100;
            console.log(
              `Item GST Calculation - Original: ${itemOriginalAmount}, Discount: ${itemDiscountAmount}, Net: ${itemNetAmount}, GST%: ${gstConfig.gstPercent}, GST Amount: ${itemGstAmount}`,
            );
            return total + itemGstAmount;
          }, 0)
        : 0;

    const finalAmount = totalNetAmount + totalGstAmount;

    const breakdown = {
      totalOriginalAmount: totalOriginalAmount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      totalNetAmount: totalNetAmount.toFixed(2),
      totalGstAmount: totalGstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      gstPercent: gstConfig.gstPercent || 0,
      gstApplicable: gstConfig.gstApplicable || false,
      itemCount: checkedItems.length,
    };

    console.log("Final Payment Breakdown:", breakdown);
    console.log("=== END PAYMENT BREAKDOWN ===");
    return breakdown;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsLoading(true);

      const hasCheckedItems = formData.rows.some(
        (row, index) => checkedRows[index],
      );
      if (!hasCheckedItems) {
        Swal.fire(ERROR, SELECT_INVESTIGATIONS_ERROR_MSG, "error");
        setIsLoading(false);
        return;
      }

      const invalidRow = formData.rows.find(
        (row, index) => checkedRows[index] && !row.itemId,
      );
      if (invalidRow) {
        Swal.fire(ERROR, INVALID_INVESTIGATION_ERROR, "error");
        setIsLoading(false);
        return;
      }

      const billingData = selectedPatient?.fullData;
      const isArray = Array.isArray(billingData);
      const data = isArray ? billingData[0] : billingData;

      console.log("=== SAVE - BILLING DATA ===");
      console.log("Original billing data:", data);
      console.log("Existing billinghdid:", data?.billinghdid);
      console.log("orderhdid:", data?.orderhdid);

      const patientId =
        formData.patientId || data?.patientid || data?.patientId;

      if (!patientId) {
        Swal.fire({
          title: ERROR,
          text: INVALID_PATIENT_ID,
          icon: "error",
          confirmButtonText: "Go Back",
        });
        setIsLoading(false);
        return;
      }

      let billingHeaderId =
        data?.billinghdid || data?.billingHeaderId || data?.billHeaderId;

      if (!billingHeaderId) {
        console.log(
          "❌ No existing billing header found. Checking if registration is needed...",
        );

        const itemsWithValidIds = formData.rows.filter(
          (row) =>
            row.itemId &&
            row.itemId !== null &&
            row.itemId !== undefined &&
            row.itemId !== 0,
        );

        if (itemsWithValidIds.length === 0) {
          Swal.fire({
            title: ERROR,
            text: INVALID_INVESTIGATION_ID,
            icon: "error",
            confirmButtonText: "OK",
          });
          setIsLoading(false);
          return;
        }

        try {
          const allItemsForRegistration = itemsWithValidIds.map((row) => {
            console.log(
              `Registration - Row: ${row.name}, ItemId: ${row.itemId}, Type: ${row.type}`,
            );

            return {
              id: Number(row.itemId),
              orderDate:
                row.date || new Date().toISOString().split("T")[0],
              checkStatus: true,
              actualAmount: Number.parseFloat(row.originalAmount) || 0,
              discountedAmount: Number.parseFloat(row.discountAmount) || 0,
              type: row.type === "investigation" ? "i" : "p",
            };
          });

          console.log("=== REGISTERING NEW BILLING HEADER ===");
          console.log("Items for registration:", allItemsForRegistration);

          let registrationResponse;


          console.log("=== REGISTRATION RESPONSE ===");
          console.log("Response:", registrationResponse);

          if (!registrationResponse || registrationResponse.status !== 200) {
            throw new Error(
              registrationResponse?.message || "Registration failed.",
            );
          }

          billingHeaderId =
            registrationResponse?.response?.billinghdId ||
            registrationResponse?.response?.billinghdid ||
            registrationResponse?.response?.billHeaderId ||
            registrationResponse?.response?.id;

          if (!billingHeaderId) {
            throw new Error("Billing Header ID not returned from registration");
          }

          console.log(
            "NEW Registration successful. Billing Header ID:",
            billingHeaderId,
          );

          await Swal.fire({
            title: REGISTRATION,
            text: `${REGISTRATION_SUCCESS_MSG} ${billingHeaderId}`,
            icon: "success",
            confirmButtonText: "Continue to Payment",
          });
        } catch (registrationError) {
          console.error("Registration error:", registrationError);
          Swal.fire(REGISTRATION_ERR_MSG, registrationError.message, "error");
          setIsLoading(false);
          return;
        }
      } else {
        console.log("USING EXISTING Billing Header ID:", billingHeaderId);
        console.log("SKIPPING REGISTRATION - Using existing billing header");
      }

      const totalFinalAmount = formData.rows
        .filter((row, index) => checkedRows[index])
        .reduce((total, row) => {
          return total + Number(row.netAmount || 0);
        }, 0);

      const selectedItemsForPayment = formData.rows
        .filter((row, index) => checkedRows[index] && row.itemId)
        .map((row) => ({
          id: Number(row.itemId),
          type: row.type === "investigation" ? "i" : "p",
        }));

      console.log("=== PAYMENT ITEMS ===");
      console.log("Selected items for payment:", selectedItemsForPayment);
      console.log("Total selected items:", selectedItemsForPayment.length);

      if (selectedItemsForPayment.length === 0) {
        Swal.fire(ERROR, PAYMENT_ERROR, "error");
        setIsLoading(false);
        return;
      }

      //Prepare payment data - ONLY payment update, no registration
      const paymentData = {
        billHeaderId: Number(billingHeaderId), // Use existing or newly created billing header
        amount: totalFinalAmount,
        mode: "cash",
        paymentReferenceNo: `PAY${Date.now()}`,
        investigationandPackegBillStatus: selectedItemsForPayment,
        isPaymentUpdate: true,
        shouldNotCreateNewBilling: true,
        useExistingBillingHeader: true,
        operationType: "payment_update_only",
      };

      console.log("=== PAYMENT DATA ===");
      console.log("Payment data to send:", paymentData);
      console.log(
        "Billing Header Source:",
        data?.billinghdid ? "EXISTING" : "NEW",
      );

      // Prepare labData for payment page
      const labData = {
        response: {
          billinghdId: billingHeaderId,
          billinghdid: billingHeaderId,
          billHeaderId: billingHeaderId,
          patientId: patientId,
          totalAmount: totalFinalAmount,
        },
      };

      // Final confirmation with clear billing header info
      Swal.fire({
        title: "Confirm Payment",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Proceed to Payment",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          console.log("=== NAVIGATING TO PAYMENT ===");
          console.log("Billing Header ID:", billingHeaderId);
          console.log("Was Registered:", !data?.billinghdid);

          navigate("/payment", {
            state: {
              amount: paymentBreakdown.finalAmount,
              patientId: patientId,
              labData: labData,
              paymentData: paymentData,
              investigationandPackegBillStatus: selectedItemsForPayment,
              paymentBreakdown: paymentBreakdown,
              billingHeaderId: billingHeaderId,
              billingType: LAB_SERVICE_CATAGORY,
              wasRegistered: !data?.billinghdid,
              originalOrderHdId: data?.orderhdid,
              originalBillingData: data,
              billingHeaderSource: data?.billinghdid
                ? "pending_api"
                : "new_registration",
            },
          });
        }
      });
    } catch (error) {
      console.error(" Error:", error);
      Swal.fire("Error!", error.message || UNEXPECTED_ERROR, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/PendingForBilling");
  };

  const paymentBreakdown = useMemo(() => {
    return calculatePaymentBreakdown();
  }, [formData.rows, checkedRows, gstConfig]);
  const currentItems = filteredPatientList;

  if (isLoading && !showPatientDetails) {
    return <LoadingScreen />;
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Lab Billing</h4>
              {showPatientDetails && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleBackToList}
                >
                  <i className="mdi mdi-arrow-left"></i> Back to List
                </button>
              )}
            </div>

            <div className="card-body">
              {/* Search Section - Only visible when not showing patient details */}
              {!showPatientDetails && (
                <>
                  <div className="mb-4">
                    <div className="card-body">
                      <div className="row g-4 align-items-end">
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">
                            Patient Name
                          </label>
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
                          <label className="form-label fw-semibold">
                            Mobile No.
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNo"
                            placeholder="Enter Mobile number"
                            value={searchData.mobileNo}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">
                            Registration No.
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="registrationNo"
                            placeholder="Enter Registration number"
                            value={searchData.registrationNo}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-3">
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary flex-fill"
                              onClick={handleSearch}
                              disabled={isSearching}
                            >
                              {isSearching ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  Searching...
                                </>
                              ) : (
                                <>
                                  <i className="mdi mdi-magnify"></i> Search
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary flex-fill"
                              onClick={handleReset}
                            >
                              Show All
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      <strong>Error:</strong> {error}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={fetchPendingLabBilling}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {!error && filteredPatientList.length === 0 && (
                    <div className="alert alert-info" role="alert">
                      <i className="mdi mdi-information"></i> No pending lab
                      billing records found.
                    </div>
                  )}

                  {filteredPatientList.length > 0 && (
                    <div className="table-responsive packagelist">
                      <table className="table table-bordered table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Registration No</th>
                            <th>Patient Name</th>
                            <th>Mobile No.</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Billing Type</th>
                            <th>Order Date</th>
                            <th>Appointment Date</th>
                            <th>Amount</th>
                            <th>Billing Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((item) => (
                            <tr
                              key={item.id}
                              onClick={() => handleRowClick(item)}
                              role="button"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  handleRowClick(item);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <td>{item.registrationNo}</td>
                              <td>{item.patientName}</td>
                              <td>{item.mobileNo}</td>
                              <td>{item.age}</td>
                              <td>{item.gender}</td>
                              <td>
                                <span className="badge bg-info">
                                  {item.billingType}
                                </span>
                              </td>
                              <td>{formatDateTime(item.orderDate)}</td>
                              <td>{formatDateTime(item.appointmentDate)}</td>
                              <td>
                                ₹
                                {typeof item.amount === "number"
                                  ? item.amount.toFixed(2)
                                  : item.amount}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-warning btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(item);
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    border: "none",
                                    background: "transparent",
                                    color: "#ff6b35",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {item.billingStatus}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {filteredPatientList.length > 0 && (
                    <Pagination
                      totalItems={
                        isSearchMode
                          ? filteredPatientList.length
                          : totalElements
                      }
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}

              {/* Patient Details Section - Shows only when a patient is selected */}
              {showPatientDetails && selectedPatient && (
                <form className="forms row" onSubmit={handleSave}>
                  {/* Patient Details Section */}
                  <div className="col-12 mt-4">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="mdi mdi-account"></i> Patient Details
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="form-group col-md-4 mt-3">
                            <label>
                              Patient Name{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="patientName"
                              placeholder="Patient Name"
                              onChange={handleInputChange}
                              value={formData.patientName}
                              required
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-4 mt-3">
                            <label>
                              Age <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="age"
                              placeholder="Age"
                              onChange={handleInputChange}
                              value={formData.age}
                              required
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-4 mt-3">
                            <label>
                              Mobile No. <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="mobileNo"
                              placeholder="Mobile Number"
                              onChange={handleInputChange}
                              value={formData.mobileNo}
                              required
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-4 mt-3">
                            <label>
                              Gender <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="gender"
                              placeholder="gender"
                              onChange={handleInputChange}
                              value={formData.gender}
                              required
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-4 mt-3">
                            <label>Relation</label>
                            <input
                              type="text"
                              className="form-control"
                              id="relation"
                              placeholder="Relation"
                              onChange={handleInputChange}
                              value={formData.relation}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-4 mt-3">
                            <label>Patient ID</label>
                            <input
                              type="text"
                              className="form-control"
                              id="patientId"
                              placeholder="Patient ID"
                              onChange={handleInputChange}
                              value={formData.patientId}
                              readOnly
                            />
                          </div>
                          <div className="form-group col-md-12 mt-3">
                            <label>Address</label>
                            <textarea
                              className="form-control"
                              id="address"
                              placeholder="Address"
                              onChange={handleInputChange}
                              value={formData.address}
                              rows="2"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lab Investigation/Package Details */}
                  <div className="col-12 mt-4">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="mdi mdi-test-tube"></i>{" "}
                          Investigation or Package Details
                        </h5>
                      </div>
                      <div className="card-body">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>
                                {formData.type === "investigation"
                                  ? "Investigation Name"
                                  : "Package Name"}
                              </th>
                              <th>Date</th>
                              <th>Original Amount</th>
                              <th>Discount Amount</th>
                              <th>Net Amount</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.rows.map((row, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <input
                                      type="checkbox"
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        border: "2px solid black",
                                      }}
                                      className="form-check-input"
                                      checked={checkedRows[index] || false}
                                      onChange={(e) => {
                                        const updated = [...checkedRows];
                                        updated[index] = e.target.checked;
                                        setCheckedRows(updated);
                                      }}
                                    />
                                    <div className="dropdown-search-container position-relative flex-grow-1">
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={row.name}
                                        autoComplete="off"
                                        placeholder={
                                          formData.type === "investigation"
                                            ? "Investigation Name"
                                            : "Package Name"
                                        }
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={row.date}
                                    disabled
                                    onChange={(e) =>
                                      handleRowChange(
                                        index,
                                        "date",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.originalAmount}
                                    disabled
                                    onChange={(e) =>
                                      handleRowChange(
                                        index,
                                        "originalAmount",
                                        e.target.value,
                                      )
                                    }
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={row.discountAmount}
                                    disabled
                                    onChange={(e) =>
                                      handleRowChange(
                                        index,
                                        "discountAmount",
                                        e.target.value,
                                      )
                                    }
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td>
                                  <div className="font-weight-bold text-success">
                                    ₹{row.netAmount || "0.00"}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-item-center gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-danger"
                                      onClick={() => removeRow(index)}
                                      disabled={formData.rows.length === 1||row.type === "investigation"||row.type === "package"}
                                    >
                                      <i className="icofont-close"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Payment Summary Section */}
                  {gstConfigLoaded && (
                    <div className="col-12 mt-4">
                      <div
                        className="card shadow mb-3"
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }}
                      >
                        <div
                          className="card-header py-3 text-white"
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="p-2 bg-white rounded"
                              style={{ opacity: 0.9 }}
                            >
                              <i className="fa fa-calculator text-primary"></i>
                            </div>
                            <div>
                              <h5 className="mb-0 fw-bold text-white">
                                Payment Summary
                              </h5>
                              <small
                                className="text-white"
                                style={{ opacity: 0.8 }}
                              >
                                {paymentBreakdown.itemCount} item
                                {paymentBreakdown.itemCount !== 1
                                  ? "s"
                                  : ""}{" "}
                                selected
                              </small>
                            </div>
                          </div>
                        </div>
                        <div className="card-body text-white">
                          {/* Summary Cards Grid */}
                          <div className="row g-3 mb-4">
                            {/* Total Original Amount Card */}
                            <div className="col-md-3">
                              <div
                                className="card h-100"
                                style={{
                                  background: "rgba(255,255,255,0.15)",
                                  border: "1px solid rgba(255,255,255,0.2)",
                                }}
                              >
                                <div className="card-body text-center">
                                  <div className="mb-2">
                                    <i
                                      className="fa fa-receipt fa-2x text-white"
                                      style={{ opacity: 0.8 }}
                                    ></i>
                                  </div>
                                  <h6 className="card-title text-white mb-1">
                                    Total Amount
                                  </h6>
                                  <h4 className="text-white fw-bold">
                                    ₹{paymentBreakdown.totalOriginalAmount}
                                  </h4>
                                </div>
                              </div>
                            </div>
                            {/* Discount Card */}
                            <div className="col-md-3">
                              <div
                                className="card h-100"
                                style={{
                                  background: "rgba(40,167,69,0.2)",
                                  border: "1px solid rgba(40,167,69,0.3)",
                                }}
                              >
                                <div className="card-body text-center">
                                  <div className="mb-2">
                                    <i className="fa fa-percent fa-2x text-success"></i>
                                  </div>
                                  <h6 className="card-title text-white mb-1">
                                    Total Discount
                                  </h6>
                                  <h4 className="text-success fw-bold">
                                    ₹{paymentBreakdown.totalDiscountAmount}
                                  </h4>
                                </div>
                              </div>
                            </div>
                            {/* Tax Card - only show if GST is applicable */}
                            {paymentBreakdown.gstApplicable && (
                              <div className="col-md-3">
                                <div
                                  className="card h-100"
                                  style={{
                                    background: "rgba(255,193,7,0.2)",
                                    border: "1px solid rgba(255,193,7,0.3)",
                                  }}
                                >
                                  <div className="card-body text-center">
                                    <div className="mb-2">
                                      <i className="fa fa-file-invoice fa-2x text-warning"></i>
                                    </div>
                                    <h6 className="card-title text-white mb-1">
                                      Tax ({paymentBreakdown.gstPercent}% GST)
                                    </h6>
                                    <h4 className="text-warning fw-bold">
                                      ₹{paymentBreakdown.totalGstAmount}
                                    </h4>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Final Amount Card */}
                            <div className="col-md-3">
                              <div
                                className="card h-100"
                                style={{
                                  background:
                                    "linear-gradient(45deg, #28a745, #20c997)",
                                  border: "none",
                                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                                }}
                              >
                                <div className="card-body text-center">
                                  <div className="mb-2">
                                    <i className="fa fa-credit-card fa-2x text-white"></i>
                                  </div>
                                  <h6 className="card-title text-white mb-1">
                                    Final Amount
                                  </h6>
                                  <h4 className="text-white fw-bold">
                                    ₹{paymentBreakdown.finalAmount}
                                  </h4>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Detailed Breakdown */}
                          <div
                            className="card"
                            style={{
                              background: "rgba(255,255,255,0.95)",
                              border: "none",
                            }}
                          >
                            <div className="card-body">
                              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                                <i className="fa fa-list-alt text-primary"></i>
                                Payment Breakdown
                              </h6>
                              <div className="row">
                                <div className="col-md-8">
                                  <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span className="text-muted">
                                      Subtotal ({paymentBreakdown.itemCount}{" "}
                                      items)
                                    </span>
                                    <span className="fw-medium text-dark">
                                      ₹{paymentBreakdown.totalOriginalAmount}
                                    </span>
                                  </div>
                                  {Number(
                                    paymentBreakdown.totalDiscountAmount,
                                  ) > 0 && (
                                    <div className="d-flex justify-content-between py-2 border-bottom">
                                      <span className="text-success">
                                        Discount Applied
                                      </span>
                                      <span className="fw-medium text-success">
                                        -₹{paymentBreakdown.totalDiscountAmount}
                                      </span>
                                    </div>
                                  )}
                                  <div className="d-flex justify-content-between py-2 border-bottom">
                                    <span className="text-muted">
                                      Amount after Discount
                                    </span>
                                    <span className="fw-medium text-dark">
                                      ₹{paymentBreakdown.totalNetAmount}
                                    </span>
                                  </div>
                                  {paymentBreakdown.gstApplicable && (
                                    <div className="d-flex justify-content-between py-2 border-bottom">
                                      <span className="text-muted">
                                        GST ({paymentBreakdown.gstPercent}%)
                                      </span>
                                      <span className="fw-medium text-warning">
                                        +₹{paymentBreakdown.totalGstAmount}
                                      </span>
                                    </div>
                                  )}
                                  <div className="d-flex justify-content-between py-3 border-top">
                                    <span className="h5 fw-bold text-dark">
                                      Total Payable
                                    </span>
                                    <span className="h4 fw-bold text-primary">
                                      ₹{paymentBreakdown.finalAmount}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="d-flex flex-wrap gap-2">
                                    <span className="badge bg-secondary px-3 py-2">
                                      {paymentBreakdown.itemCount} Items
                                      Selected
                                    </span>
                                    {Number(
                                      paymentBreakdown.totalDiscountAmount,
                                    ) > 0 && (
                                      <span className="badge bg-success px-3 py-2">
                                        Discount Applied
                                      </span>
                                    )}
                                    {paymentBreakdown.gstApplicable && (
                                      <span className="badge bg-info px-3 py-2">
                                        GST Included
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={!isFormValid || isLoading || !gstConfigLoaded}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-credit-card me-1"></i>
                          Pay Now - ₹{paymentBreakdown.finalAmount}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleBackToList}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabBillingDetails;

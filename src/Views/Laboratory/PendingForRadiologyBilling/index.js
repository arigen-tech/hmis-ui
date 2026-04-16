import { useState, useRef, useEffect, useMemo } from "react";
import placeholderImage from "../../../assets/images/placeholder.jpg";
import { useNavigate } from "react-router-dom";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import { getRequest, postRequest } from "../../../service/apiService";

import {
  ADD_ROW_WARNING,
  INVALID_DATE_TEXT,
  IMAGE_UPLOAD_SUCC_MSG,
  IMAGE_UPLOAD_FAIL_MSG,
  UNEXPECTED_ERROR,
  IMAGE_TITLE,
  IMAGE_TEXT,
  DUPLICATE_PACKAGE_WARN_MSG,
  DUPLICATE_INV_INCLUDE_PACKAGE,
  DUPLICATE_INV_PACKAGE_WARN_MSG,
  COMMON_INV_IN_PACKAGES,
  DUPLICATE_PACKAGE_WRT_INV,
} from "../../../config/constants";
import {
  PENDING_BILLINGS_BY_CATAGORY,
  LAB_RADIO_BILLING_DETAILS,
  LAB_SERVICE_CATAGORY,
  RADIOLOGY_SERVICE_CATAGORY,
  MAS_SERVICE_CATEGORY,
} from "../../../config/apiConfig";
import Swal from "sweetalert2";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
};

const PendingForRadiologyBilling = () => {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageURL, setImageURL] = useState("");
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [investigationItems, setInvestigationItems] = useState([]);
  const [packageItems, setPackageItems] = useState([]);
  const [popupMessage, setPopupMessage] = useState(null);
  const [patientList, setPatientList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: "",
    registrationNo: "",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [gstConfigLoaded, setGstConfigLoaded] = useState(false);

  const navigate = useNavigate();

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: true,
    gstPercent: 18,
  });

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

  const [image, setImage] = useState(placeholderImage);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let stream = null;

  const [checkedRows, setCheckedRows] = useState([true]);

  useEffect(() => {
    fetchPendingRadiologyBilling(currentPage);
  }, [currentPage]);

  const fetchPendingRadiologyBilling = async (
    page = 0,
    showFullLoader = true,
  ) => {
    try {
      if (showFullLoader) setIsLoading(true);

      const params = new URLSearchParams({
        page,
        size: DEFAULT_ITEMS_PER_PAGE,
        patientName: searchData.patientName,
        mobileNo: searchData.mobileNo,
        registrationNo: searchData.registrationNo,
      });

      const response = await getRequest(
        `${PENDING_BILLINGS_BY_CATAGORY}/${RADIOLOGY_SERVICE_CATAGORY}?${params}`,
      );

      if (response && response.response) {
        const mappedData = response.response.content.map((item) => ({
          id: item.billingHeaderId,
          patientId: item.patientId,
          registrationNo: item.registrationNo,
          patientName: item.patientName || "N/A",
          mobileNo: item.mobileNo || "N/A",
          age: item.age || "N/A",
          gender: item.gender || "N/A",
          appointmentDate: item.appointmentDate,
          orderDate:item.orderDate,
          billingType: item.billingType || "Radiology Services",
          amount: item.billAmount || 0,
          billingStatus: "Pending",
          fullData: item,
        }));

        setPatientList(mappedData);
        setTotalElements(response.response.totalElements);
      }
    } catch (error) {
      console.error("Error fetching pending billing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGstConfiguration();
  }, []);

  async function fetchGstConfiguration() {
    try {
      const data = await getRequest(
        `${MAS_SERVICE_CATEGORY}/getGstConfig/1?categoryCode=${RADIOLOGY_SERVICE_CATAGORY}`,
      );

      if (data?.status === 200 && data?.response) {
        setGstConfig({
          gstApplicable: !!data.response.gstApplicable,
          gstPercent: Number(data.response.gstPercent) || 0,
        });
      } else {
        setGstConfig({ gstApplicable: false, gstPercent: 0 });
      }
    } catch {
      setGstConfig({ gstApplicable: false, gstPercent: 0 });
    } finally {
      setGstConfigLoaded(true);
    }
  }

  const handleSearchChange = (e) => {
    const { id, value } = e.target;

    setSearchData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    setCurrentPage(0);
    try {
      await fetchPendingRadiologyBilling(0, false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowClick = async (patient) => {
    try {
      setIsLoading(true);
      const billingHeaderId = patient.id;

      const response = await getRequest(
        `${LAB_RADIO_BILLING_DETAILS}/${billingHeaderId}?serviceCategoryCode=${RADIOLOGY_SERVICE_CATAGORY}`,
      );

      if (!response || !response.response) return;

      const billingData = Array.isArray(response.response)
        ? response.response[0]
        : response.response;

      const details = billingData?.details || [];
      const billingHeaderIds = billingData?.billingHeaderIds || [];

      const formattedRows = details.map((item, index) => {
        const isPackage = item.packageId != null;

        const investigationDate = item.orderDate
          ? item.orderDate.split("T")[0]
          : new Date().toISOString().split("T")[0];

        console.log("API Date:", item.orderDate);
        console.log("Mapped Date:", investigationDate);
        console.log("-------------------------- " + investigationDate);
        return {
          id: item.id || index + 1,
          name:
            item.itemName || item.packageName || item.investigationName || "",
          date: investigationDate,
          originalAmount: item.basePrice || item.tariff || 0,
          discountAmount: item.discount || 0,
          netAmount: item.amountAfterDiscount || item.netAmount || 0,
          type: isPackage ? "package" : "investigation",
          investigationId: item.investigationId,
          packageId: item.packageId,
          itemId: isPackage ? item.packageId : item.investigationId,
        };
      });

      const defaultType = formattedRows.some(
        (row) => row.investigationId != null,
      )
        ? "investigation"
        : formattedRows.some((row) => row.packageId != null)
          ? "package"
          : "investigation";

      setSelectedPatient({
        fullData: billingData,
        billingHeaderIds: billingHeaderIds,
      });

      setFormData({
        billingType: billingData.billingType || "",
        patientName: billingData.patientName || "",
        mobileNo: billingData.mobileNo || "",
        age: billingData.age || "",
        gender: billingData.gender || "",
        relation: billingData.relation || "",
        patientId: billingData.patientid || billingData.patientId,
        address: billingData.address || "",
        rows: formattedRows,
        type: defaultType,
      });

      setCheckedRows(new Array(formattedRows.length).fill(true));
      setShowPatientDetails(true);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    handleReset();
  };

  const showPopup = (
    message,
    type = "info",
    shouldRefreshData = false,
    onCloseCallback = null,
  ) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (shouldRefreshData) {
        }
        if (onCloseCallback) {
          onCloseCallback();
        }
      },
    });
  };

  const showConfirmationPopup = (title, text, imageUrl, onConfirm) => {
    const confirmUpload = () => {
      onConfirm();
      setPopupMessage(null);
    };

    setPopupMessage({
      message: (
        <div>
          <h5>{title}</h5>
          <p>{text}</p>
          {imageUrl && (
            <div className="text-center my-3">
              <img
                src={imageUrl}
                alt="Preview"
                style={{
                  maxWidth: "200px",
                  maxHeight: "150px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}
          <div className="d-flex justify-content-center gap-2 mt-3">
            <button className="btn btn-primary" onClick={confirmUpload}>
              Yes, Upload
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setPopupMessage(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      type: "custom",
      onClose: () => setPopupMessage(null),
    });
  };

  const isInvestigationInSelectedPackages = (investigationId, date) => {
    return formData.rows.some((row, index) => {
      if (!checkedRows[index]) return false;
      if (row.type === "package" && row.investigationIds && row.date === date) {
        return row.investigationIds.includes(investigationId);
      }
      return false;
    });
  };

  const isPackageAlreadySelected = (packageId, date) => {
    return formData.rows.some((row, index) => {
      if (!checkedRows[index]) return false;
      return (
        row.type === "package" && row.itemId === packageId && row.date === date
      );
    });
  };

  const isInvestigationAlreadySelected = (investigationId, date) => {
    return formData.rows.some((row, index) => {
      if (!checkedRows[index]) return false;
      return (
        row.type === "investigation" &&
        row.itemId === investigationId &&
        row.date === date
      );
    });
  };

  const getInvestigationIdsFromPackage = async (packageId, packageName) => {
    const packageData = packageItems.find(
      (pkg) => pkg.packageId === packageId || pkg.packName === packageName,
    );
    return packageData?.investigationIds || [];
  };

  const startCamera = async () => {
    try {
      setIsCameraOn(true);
      setTimeout(async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          showPopup(
            "Could not access camera. Please check permissions.",
            "error",
          );
          setIsCameraOn(false);
        }
      }, 100);
    } catch (error) {
      console.error("Error starting camera:", error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      setImage(imageData);
      stopCamera();
      confirmUpload(imageData);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
    }
  };

  const clearPhoto = () => {
    setImage(placeholderImage);
  };

  const confirmUpload = (imageData) => {
    showConfirmationPopup(IMAGE_TITLE, IMAGE_TEXT, imageData, () => {
      uploadImage(imageData);
    });
  };

  const uploadImage = async (base64Image) => {
    setLoading(true);
    try {
      // Mock successful upload
      setTimeout(() => {
        const mockPath = "/uploads/patient-photo.png";
        setImageURL(mockPath);
        console.log("Uploaded Image URL:", mockPath);
        showPopup(IMAGE_UPLOAD_SUCC_MSG, "success");
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      showPopup(UNEXPECTED_ERROR, "error");
      setLoading(false);
    }
  };

  function calculateDOBFromAge(age) {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return new Date(birthYear, today.getMonth(), today.getDate())
      .toISOString()
      .split("T")[0];
  }

  function calculateAgeFromDOB(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years}Y ${months}M ${days}D`;
  }

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    if (name === "dob") {
      updatedFormData.age = calculateAgeFromDOB(value);
    } else if (name === "age") {
      updatedFormData.dob = calculateDOBFromAge(value);
    }

    setFormData(updatedFormData);

    let error = "";
    if (name === "firstName" && !value.trim()) {
      error = "First Name is required.";
    }
    if (name === "gender" && !value) {
      error = "Gender is required.";
    }
    if (name === "relation" && !value) {
      error = "Relation is required.";
    }
    if (name === "dob" && !value) {
      error = "Date of Birth is required.";
    }
    if (name === "email") {
      if (!value.trim()) {
        error = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Invalid email format.";
      }
    }
    if (name === "mobileNo") {
      if (!value.trim()) {
        error = "Mobile number is required.";
      } else if (!/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits.";
      }
    }
    if (name === "pinCode") {
      if (value && !/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits.";
      }
    }
    if (name === "nokPinCode") {
      if (value && !/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits.";
      }
    }
    if (name === "nokMobile") {
      if (value && !/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits.";
      }
    }
    if (name === "emergencyMobile") {
      if (value && !/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits.";
      }
    }
    if (name === "age") {
      if (value !== "" && (isNaN(value) || Number(value) < 0)) {
        error = "Age can not be negative.";
      }
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type,
    }));
  };

  const handleDateChange = (index, selectedDate) => {
    const today = new Date().toISOString().split("T")[0];

    if (selectedDate < today) {
      showPopup(INVALID_DATE_TEXT, "warning");
      return;
    }

    const currentRow = formData.rows[index];
    let hasDuplicate = false;

    if (currentRow.itemId) {
      if (currentRow.type === "package") {
        hasDuplicate = formData.rows.some((row, i) => {
          if (i === index || !checkedRows[i]) return false;
          return (
            row.type === "package" &&
            row.itemId === currentRow.itemId &&
            row.date === selectedDate
          );
        });
      } else if (currentRow.type === "investigation") {
        hasDuplicate = formData.rows.some((row, i) => {
          if (i === index || !checkedRows[i]) return false;
          if (row.type === "package" && row.investigationIds) {
            return (
              row.investigationIds.includes(currentRow.itemId) &&
              row.date === selectedDate
            );
          }
          return (
            row.type === "investigation" &&
            row.itemId === currentRow.itemId &&
            row.date === selectedDate
          );
        });
      }
    }

    if (hasDuplicate) {
      showPopup("Duplicate item found for this date!", "warning");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) => {
        if (i === index) {
          return { ...row, date: selectedDate };
        }
        return row;
      }),
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

  const addRow = (e, type) => {
    e.preventDefault();
    const lastRow = formData.rows[formData.rows.length - 1];

    if (!lastRow.name) {
      showPopup(ADD_ROW_WARNING, "warning");
      return;
    }

    if (lastRow.type === "package" && lastRow.itemId && lastRow.date) {
      const isDuplicatePackage = formData.rows.slice(0, -1).some((row, i) => {
        if (!checkedRows[i]) return false;
        return (
          row.type === "package" &&
          row.itemId === lastRow.itemId &&
          row.date === lastRow.date
        );
      });

      if (isDuplicatePackage) {
        showPopup(DUPLICATE_PACKAGE_WARN_MSG, "warning");
        handleRowChange(formData.rows.length - 1, "name", "");
        handleRowChange(formData.rows.length - 1, "itemId", undefined);
        handleRowChange(
          formData.rows.length - 1,
          "date",
          new Date().toISOString().split("T")[0],
        );
        return;
      }
    } else if (
      lastRow.type === "investigation" &&
      lastRow.itemId &&
      lastRow.date
    ) {
      const isDuplicateInvestigation = formData.rows
        .slice(0, -1)
        .some((row, i) => {
          if (!checkedRows[i]) return false;
          if (row.type === "package" && row.investigationIds) {
            return (
              row.investigationIds.includes(lastRow.itemId) &&
              row.date === lastRow.date
            );
          }
          return (
            row.type === "investigation" &&
            row.itemId === lastRow.itemId &&
            row.date === lastRow.date
          );
        });

      if (isDuplicateInvestigation) {
        showPopup(DUPLICATE_INV_INCLUDE_PACKAGE, "warning");
        handleRowChange(formData.rows.length - 1, "name", "");
        handleRowChange(formData.rows.length - 1, "itemId", undefined);
        handleRowChange(
          formData.rows.length - 1,
          "date",
          new Date().toISOString().split("T")[0],
        );
        return;
      }
    }

    const defaultDate = new Date().toISOString().split("T")[0];

    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: Date.now(),
          name: "",
          date: defaultDate,
          originalAmount: 0,
          discountAmount: 0,
          netAmount: 0,
          type: type,
          investigationIds: type === "package" ? [] : undefined,
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

  async function fetchPackagePrice(packName) {
    const packageData = packageItems.find((pkg) => pkg.packName === packName);
    return packageData || null;
  }

  const validateForm = () => {
    const requiredFields = [
      "firstName",
      "gender",
      "relation",
      "dob",
      "email",
      "mobileNo",
    ];
    let valid = true;
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] =
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
        valid = false;
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
      valid = false;
    }

    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits.";
      valid = false;
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin Code must be exactly 6 digits.";
      valid = false;
    }

    if (formData.nokPinCode && !/^\d{6}$/.test(formData.nokPinCode)) {
      newErrors.nokPinCode = "Pin Code must be exactly 6 digits.";
      valid = false;
    }

    if (formData.rows.length === 0) {
      newErrors.rows = `At least one ${formData.type} is required.`;
      valid = false;
    }

    formData.rows.forEach((row, index) => {
      if (!row.name || row.name.trim() === "") {
        newErrors[`row_${index}_name`] =
          `Row ${index + 1}: Investigation/Package name is required.`;
        valid = false;
      }
      if (!row.date || row.date.trim() === "") {
        newErrors[`row_${index}_date`] = `Row ${index + 1}: Date is required.`;
        valid = false;
      }
    });

    if (!formData.paymentMode) {
      newErrors.paymentMode = "Payment mode is required.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const hasChecked = formData.rows.some((_, i) => checkedRows[i]);
      if (!hasChecked) {
        Swal.fire("Error", "Select at least one item", "error");
        return;
      }

      const billingData = selectedPatient?.fullData;
      const data = Array.isArray(billingData) ? billingData[0] : billingData;

      const patientId = formData.patientId;

      if (!patientId) {
        Swal.fire("Error", "Invalid Patient ID", "error");
        return;
      }

      let billingHeaderId = data?.billinghdid || data?.billingHeaderId;
      const billingHeaderIds = selectedPatient?.billingHeaderIds || [];
      // 👉 Registration if not exists
      if (!billingHeaderId) {
        const items = formData.rows
          .filter((row, i) => checkedRows[i] && row.itemId)
          .map((row) => ({
            id: Number(row.itemId),
            orderDate: row.date,
            actualAmount: Number(row.originalAmount),
            discountedAmount: Number(row.discountAmount),
            type: row.type === "investigation" ? "i" : "p",
          }));

        const res = await postRequest("/billing/processRadiologyPayment", {
          patientId,
          labInvestigationReq: items,
        });

        billingHeaderId = res?.response?.billinghdId || res?.response?.id;
      }

      const totalFinalAmount = Number(paymentBreakdown.finalAmount);

      const selectedItems = formData.rows
        .filter((row, i) => checkedRows[i] && row.itemId)
        .map((row) => ({
          id: Number(row.itemId),
          type: row.type === "investigation" ? "i" : "p",
        }));

      const paymentData = {
        billHeaderId: billingHeaderId,
        amount: totalFinalAmount,
        mode: "cash",
        paymentReferenceNo: `PAY${Date.now()}`,
        investigationandPackegBillStatus: selectedItems,
      };

      Swal.fire({
        title: "Confirm Payment",
        icon: "question",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/payment", {
            state: {
              amount: totalFinalAmount,
              patientId,
              billingHeaderId,
              paymentData,
              paymentBreakdown,
              billingType: RADIOLOGY_SERVICE_CATAGORY,
              billingHeaderIds,
            },
          });
        }
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchData({
      patientName: "",
      mobileNo: "",
      registrationNo: "",
    });
    fetchPendingRadiologyBilling(currentPage);
  };

  const handleDetailsReset = () => {
    handleReset();
    setShowPatientDetails(false);
    setSelectedPatient(null);
  };

  const paymentBreakdown = useMemo(() => {
    const checkedItems = formData.rows.filter((_, i) => checkedRows[i]);

    const totalOriginalAmount = checkedItems.reduce(
      (sum, item) => sum + Number(item.originalAmount || 0),
      0,
    );

    const totalDiscountAmount = checkedItems.reduce(
      (sum, item) => sum + Number(item.discountAmount || 0),
      0,
    );

    const totalNetAmount = totalOriginalAmount - totalDiscountAmount;

    const totalGstAmount =
      gstConfig.gstApplicable && gstConfig.gstPercent > 0
        ? checkedItems.reduce((sum, item) => {
            const net =
              Number(item.originalAmount || 0) -
              Number(item.discountAmount || 0);
            return sum + (net * gstConfig.gstPercent) / 100;
          }, 0)
        : 0;

    const finalAmount = totalNetAmount + totalGstAmount;

    return {
      totalOriginalAmount: totalOriginalAmount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      totalNetAmount: totalNetAmount.toFixed(2),
      totalGstAmount: totalGstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      gstPercent: gstConfig.gstPercent,
      gstApplicable: gstConfig.gstApplicable,
      itemCount: checkedItems.length,
    };
  }, [formData.rows, checkedRows, gstConfig]);

  const isAnyRowSelected = checkedRows.some((val) => val === true);

  if (isLoading && !showPatientDetails) {
    return <LoadingScreen />;
  }
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
              <h4 className="card-title p-2">Radiology Billing</h4>
              {showPatientDetails && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleBackToList}
                >
                  <i className="icofont-arrow-left me-1"></i> Back to List
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
                              disabled={searchLoading}
                            >
                              {searchLoading ? (
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
                                  <i className="icofont-search me-1"></i> Search
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

                  {/* Pending List Table */}
                  {patientList.length > 0 ? (
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
                          {patientList.map((item) => (
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
                                  aria-label={`Open ${item.patientName} billing details`}
                                >
                                  {item.billingStatus}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-info" role="alert">
                      <i className="mdi mdi-information"></i> No pending
                      radiology billing records found.
                    </div>
                  )}

                  {/* Pagination */}
                  {patientList.length > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage + 1}
                      onPageChange={(page) => handlePageChange(page - 1)}
                    />
                  )}
                </>
              )}

              {/* Patient Details Sections - Shows only when a patient is selected */}
              {showPatientDetails && selectedPatient && (
                <>
                  {/* Patient Personal Details */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header py-3 border-bottom-1">
                          <h6 className="mb-0 fw-bold">Personal Details</h6>
                        </div>
                        <div className="card-body">
                          <form>
                            <div className="row g-3">
                              <div className="col-md-12">
                                <div className="row">
                                  <div className="form-group col-md-4 mt-3">
                                    <label>Patient Name</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={formData.patientName}
                                      readOnly
                                    />
                                  </div>

                                  <div className="form-group col-md-4 mt-3">
                                    <label>Age</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={formData.age}
                                      readOnly
                                    />
                                  </div>

                                  <div className="form-group col-md-4 mt-3">
                                    <label>Mobile No.</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={formData.mobileNo}
                                      readOnly
                                    />
                                  </div>

                                  <div className="form-group col-md-4 mt-3">
                                    <label>Gender</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={formData.gender}
                                      readOnly
                                    />
                                  </div>

                                  <div className="form-group col-md-4 mt-3">
                                    <label>Relation</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={formData.relation}
                                      readOnly
                                    />
                                  </div>

                                  <div className="form-group col-md-4 mt-3">
                                    <label>Patient ID</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={formData.patientId}
                                      readOnly
                                    />
                                  </div>

                                  <div className="form-group col-md-12 mt-3">
                                    <label>Address</label>
                                    <textarea
                                      className="form-control"
                                      value={formData.address}
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lab Investigation/Package Details */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-header border-bottom-1 py-3">
                          <h6 className="fw-bold mb-0">
                            Investigation or Package Details
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                          </div>

                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>
                                  {formData.type === "investigation"
                                    ? "Investigation Name"
                                    : "Package Name"}{" "}
                                  <span className="text-danger">*</span>
                                </th>
                                <th>
                                  Date <span className="text-danger">*</span>
                                </th>
                                <th>
                                  Original Amount{" "}
                                  <span className="text-danger">*</span>
                                </th>
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
                                          autoComplete="on"
                                          disabled
                                          placeholder={
                                            formData.type === "investigation"
                                              ? "Investigation Name"
                                              : "Package Name"
                                          }
                                          onChange={(e) => {
                                            handleRowChange(
                                              index,
                                              "name",
                                              e.target.value,
                                            );
                                            if (e.target.value.trim() !== "") {
                                              setActiveRowIndex(index);
                                            } else {
                                              setActiveRowIndex(null);
                                            }
                                          }}
                                          onFocus={() => {
                                            if (row.name.trim() !== "") {
                                              setActiveRowIndex(index);
                                            }
                                          }}
                                          onBlur={() =>
                                            setTimeout(
                                              () => setActiveRowIndex(null),
                                              200,
                                            )
                                          }
                                        />
                                        {activeRowIndex === index &&
                                          row.name.trim() !== "" && (
                                            <ul
                                              className="list-group position-absolute w-100 mt-1"
                                              style={{
                                                zIndex: 1000,
                                                maxHeight: "200px",
                                                overflowY: "auto",
                                                backgroundColor: "#fff",
                                                border: "1px solid #ccc",
                                              }}
                                            >
                                              {formData.type === "investigation"
                                                ? investigationItems
                                                    .filter((item) =>
                                                      item.investigationName
                                                        .toLowerCase()
                                                        .includes(
                                                          row.name.toLowerCase(),
                                                        ),
                                                    )
                                                    .map((item, i) => {
                                                      const hasDiscount =
                                                        item.disc &&
                                                        item.disc > 0;
                                                      const displayPrice =
                                                        item.price || 0;
                                                      const discountAmount =
                                                        hasDiscount
                                                          ? item.disc
                                                          : 0;
                                                      const finalPrice =
                                                        hasDiscount
                                                          ? displayPrice -
                                                            discountAmount
                                                          : displayPrice;

                                                      return (
                                                        <li
                                                          key={i}
                                                          className="list-group-item list-group-item-action"
                                                          
                                                          style={{
                                                            backgroundColor:
                                                              "#e3e8e6",
                                                            cursor: "pointer",
                                                          }}
                                                          onClick={() => {
                                                            const currentRowDate =
                                                              row.date ||
                                                              new Date()
                                                                .toISOString()
                                                                .split("T")[0];

                                                            if (
                                                              isInvestigationInSelectedPackages(
                                                                item.investigationId,
                                                                currentRowDate,
                                                              )
                                                            ) {
                                                              showPopup(
                                                                DUPLICATE_INV_INCLUDE_PACKAGE,
                                                                "warning",
                                                              );
                                                              return;
                                                            }

                                                            if (
                                                              isInvestigationAlreadySelected(
                                                                item.investigationId,
                                                                currentRowDate,
                                                              )
                                                            ) {
                                                              showPopup(
                                                                DUPLICATE_INV_INCLUDE_PACKAGE,
                                                                "warning",
                                                              );
                                                              return;
                                                            }
                                                            if (
                                                              item.price ===
                                                                null ||
                                                              item.price ===
                                                                0 ||
                                                              item.price === "0"
                                                            ) {
                                                              showPopup(
                                                                "Price not configured for this investigation",
                                                                "warning",
                                                              );
                                                            } else {
                                                              const hasDiscount =
                                                                item.disc &&
                                                                item.disc > 0;
                                                              const displayPrice =
                                                                item.price || 0;
                                                              const discountAmount =
                                                                hasDiscount
                                                                  ? item.disc
                                                                  : 0;
                                                              const finalPrice =
                                                                hasDiscount
                                                                  ? displayPrice -
                                                                    discountAmount
                                                                  : displayPrice;

                                                              handleRowChange(
                                                                index,
                                                                "name",
                                                                item.investigationName,
                                                              );
                                                              handleRowChange(
                                                                index,
                                                                "itemId",
                                                                item.investigationId,
                                                              );
                                                              handleRowChange(
                                                                index,
                                                                "originalAmount",
                                                                displayPrice,
                                                              );
                                                              handleRowChange(
                                                                index,
                                                                "discountAmount",
                                                                discountAmount,
                                                              );
                                                              handleRowChange(
                                                                index,
                                                                "netAmount",
                                                                finalPrice,
                                                              );
                                                              handleRowChange(
                                                                index,
                                                                "type",
                                                                formData.type,
                                                              );
                                                              setActiveRowIndex(
                                                                null,
                                                              );
                                                            }
                                                          }}
                                                        >
                                                          <div>
                                                            <strong>
                                                              {
                                                                item.investigationName
                                                              }
                                                            </strong>
                                                            <div className="d-flex justify-content-between">
                                                              <span>
                                                                {item.price ===
                                                                null
                                                                  ? "Price not configured"
                                                                  : `₹${finalPrice.toFixed(2)}`}
                                                              </span>
                                                              {hasDiscount && (
                                                                <span className="text-success">
                                                                  (Discount: ₹
                                                                  {discountAmount.toFixed(
                                                                    2,
                                                                  )}
                                                                  )
                                                                </span>
                                                              )}
                                                            </div>
                                                            {item.investigationType && (
                                                              <small className="text-muted">
                                                                Type:{" "}
                                                                {
                                                                  item.investigationType
                                                                }
                                                              </small>
                                                            )}
                                                          </div>
                                                        </li>
                                                      );
                                                    })
                                                : packageItems
                                                    .filter((item) =>
                                                      item.packName
                                                        .toLowerCase()
                                                        .includes(
                                                          row.name.toLowerCase(),
                                                        ),
                                                    )
                                                    .map((item, i) => (
                                                      <li
                                                        key={i}
                                                        className="list-group-item list-group-item-action"
                                                        disabled
                                                        style={{
                                                          backgroundColor:
                                                            "#e3e8e6",
                                                          cursor: "pointer",
                                                        }}
                                                        onClick={async () => {
                                                          const currentRowDate =
                                                            row.date ||
                                                            new Date()
                                                              .toISOString()
                                                              .split("T")[0];

                                                          // Check for duplicate package
                                                          if (
                                                            isPackageAlreadySelected(
                                                              item.packageId,
                                                              currentRowDate,
                                                            )
                                                          ) {
                                                            showPopup(
                                                              DUPLICATE_PACKAGE_WARN_MSG,
                                                              "warning",
                                                            );
                                                            return;
                                                          }

                                                          const priceDetails =
                                                            await fetchPackagePrice(
                                                              item.packName,
                                                            );
                                                          if (
                                                            !priceDetails ||
                                                            !priceDetails.actualCost
                                                          ) {
                                                            showPopup(
                                                              "Price not configured for this package",
                                                              "warning",
                                                            );
                                                            return;
                                                          }

                                                          const investigationIds =
                                                            await getInvestigationIdsFromPackage(
                                                              item.packageId,
                                                              item.packName,
                                                            );

                                                          // Check if investigations in this package are already selected individually FOR THE SAME DATE
                                                          const alreadySelectedInvestigations =
                                                            [];
                                                          investigationIds.forEach(
                                                            (invId) => {
                                                              if (
                                                                isInvestigationAlreadySelected(
                                                                  invId,
                                                                  currentRowDate,
                                                                )
                                                              ) {
                                                                const invItem =
                                                                  investigationItems.find(
                                                                    (inv) =>
                                                                      inv.investigationId ===
                                                                      invId,
                                                                  );
                                                                if (invItem) {
                                                                  alreadySelectedInvestigations.push(
                                                                    invItem.investigationName,
                                                                  );
                                                                }
                                                              }
                                                            },
                                                          );

                                                          if (
                                                            alreadySelectedInvestigations.length >
                                                            0
                                                          ) {
                                                            showPopup(
                                                              `${DUPLICATE_PACKAGE_WRT_INV}\n\nDuplicate investigations: ${alreadySelectedInvestigations.join(", ")}`,
                                                              "warning",
                                                            );
                                                            return;
                                                          }

                                                          // Check if investigations in this package are already in other packages FOR THE SAME DATE
                                                          const alreadyInOtherPackage =
                                                            [];
                                                          investigationIds.forEach(
                                                            (invId) => {
                                                              if (
                                                                isInvestigationInSelectedPackages(
                                                                  invId,
                                                                  currentRowDate,
                                                                )
                                                              ) {
                                                                const containingPackage =
                                                                  formData.rows.find(
                                                                    (
                                                                      row,
                                                                      idx,
                                                                    ) =>
                                                                      checkedRows[
                                                                        idx
                                                                      ] &&
                                                                      row.type ===
                                                                        "package" &&
                                                                      row.investigationIds &&
                                                                      row.investigationIds.includes(
                                                                        invId,
                                                                      ) &&
                                                                      row.date ===
                                                                        currentRowDate,
                                                                  );
                                                                if (
                                                                  containingPackage
                                                                ) {
                                                                  const invItem =
                                                                    investigationItems.find(
                                                                      (inv) =>
                                                                        inv.investigationId ===
                                                                        invId,
                                                                    );
                                                                  if (invItem) {
                                                                    alreadyInOtherPackage.push(
                                                                      `${invItem.investigationName} (in package: ${containingPackage.name})`,
                                                                    );
                                                                  }
                                                                }
                                                              }
                                                            },
                                                          );

                                                          if (
                                                            alreadyInOtherPackage.length >
                                                            0
                                                          ) {
                                                            showPopup(
                                                              `${COMMON_INV_IN_PACKAGES}\n\nInvestigations already in packages: ${alreadyInOtherPackage.join(", ")}`,
                                                              "warning",
                                                            );
                                                            return;
                                                          }

                                                          handleRowChange(
                                                            index,
                                                            "name",
                                                            item.packName,
                                                          );
                                                          handleRowChange(
                                                            index,
                                                            "itemId",
                                                            item.packageId ||
                                                              priceDetails.packId,
                                                          );
                                                          handleRowChange(
                                                            index,
                                                            "originalAmount",
                                                            priceDetails.baseCost ||
                                                              priceDetails.actualCost,
                                                          );
                                                          handleRowChange(
                                                            index,
                                                            "discountAmount",
                                                            priceDetails.disc ||
                                                              0,
                                                          );
                                                          handleRowChange(
                                                            index,
                                                            "netAmount",
                                                            priceDetails.actualCost,
                                                          );
                                                          handleRowChange(
                                                            index,
                                                            "type",
                                                            formData.type,
                                                          );
                                                          handleRowChange(
                                                            index,
                                                            "investigationIds",
                                                            investigationIds,
                                                          );
                                                          setActiveRowIndex(
                                                            null,
                                                          );
                                                        }}
                                                      >
                                                        <div>
                                                          <strong>
                                                            {item.packName}
                                                          </strong>
                                                          <div className="d-flex justify-content-between">
                                                            <span>
                                                              ₹
                                                              {item.actualCost.toFixed(
                                                                2,
                                                              )}
                                                            </span>
                                                          </div>
                                                        </div>
                                                      </li>
                                                    ))}
                                            </ul>
                                          )}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <input
                                      type="date"
                                      className="form-control"
                                      value={row.date || ""}
                                      disabled
                                      onChange={(e) =>
                                        handleDateChange(index, e.target.value)
                                      }
                                      min={
                                        new Date().toISOString().split("T")[0]
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
                                      <div className="form-check form-check-muted m-0"></div>
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

                          <div className="d-flex justify-content-between align-items-center">
                            {/* <button
                              type="button"
                              className="btn btn-success"
                              onClick={(e) => addRow(e, formData.type)}
                            >
                              Add{" "}
                              {formData.type === "investigation"
                                ? "Investigation"
                                : "Package"}{" "}
                              +
                            </button> */}

                            <div className="d-flex">
                              <input
                                type="text"
                                className="form-control me-2"
                                placeholder="Enter Coupon Code"
                                style={{ width: "200px" }}
                              />
                              <button
                                type="button"
                                className="btn btn-primary me-2"
                              >
                                <i className="icofont-ticket me-1"></i> Apply
                                Coupon
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Payment Summary Section */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
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
                          <div className="row g-3 mb-4">
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
                  </div>

                  {/* Submit and Reset Buttons */}
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="card shadow mb-3">
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">
                              {/* Right side */}
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={!isAnyRowSelected}
                                title={
                                  !isAnyRowSelected
                                    ? "Select at least one item"
                                    : ""
                                }
                              >
                                Pay Now - ₹{paymentBreakdown.finalAmount}
                              </button>

                              {/* Left side */}
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleDetailsReset}
                              >
                                Show All
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingForRadiologyBilling;

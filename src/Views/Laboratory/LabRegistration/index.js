import { useState, useRef, useEffect } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"
import { getRequest, postRequest } from "../../../service/apiService"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import {
  API_HOST,
  MAS_COUNTRY,
  MAS_GENDER,
  MAS_RELATION,
  MAS_STATE,
  PATIENT_IMAGE_UPLOAD,
  MAS_DISTRICT,
  MAS_INVESTIGATION,
  INVESTIGATION_PACKAGE_Mapping,
  MAS_SERVICE_CATEGORY,
  MAS_PACKAGE_INVESTIGATION
} from "../../../config/apiConfig"
import LoadingScreen from "../../../Components/Loading"


const LabRegistration = () => {
  useEffect(() => {
    // Fetching initial data
    fetchGenderData()
    fetchRelationData()
    fetchCountryData()
    fetchGstConfiguration() // Add this line
  }, [])

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [genderData, setGenderData] = useState([])
  const [imageURL, setImageURL] = useState("")
  const [relationData, setRelationData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [stateData, setStateData] = useState([])
  const [nokStateData, setNokStateData] = useState([])
  const [districtData, setDistrictData] = useState([])
  const [nokDistrictData, setNokDistrictData] = useState([])
  const [activeRowIndex, setActiveRowIndex] = useState(null)
  const [investigationItems, setInvestigationItems] = useState([])
  const [packageItems, setPackageItems] = useState([])

  const [isDuplicatePatient, setIsDuplicatePatient] = useState(false);

  const navigate = useNavigate()

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: true,
    gstPercent: 0, // default fallback
  })

  const [formData, setFormData] = useState({
    // Personal details
    imageurl: undefined,
    firstName: undefined,
    middleName: undefined,
    lastName: undefined,
    mobileNo: undefined,
    gender: undefined,
    relation: undefined,
    dob: undefined,
    age: undefined,
    email: undefined,
    // Patient address
    address1: undefined,
    address2: undefined,
    country: undefined,
    state: undefined,
    district: undefined,
    city: undefined,
    pinCode: undefined,
    // NOK details
    nokFirstName: undefined,
    nokMiddleName: undefined,
    nokLastName: undefined,
    nokEmail: undefined,
    nokMobile: undefined,
    nokAddress1: undefined,
    nokAddress2: undefined,
    nokCountry: undefined,
    nokState: undefined,
    nokDistrict: undefined,
    nokCity: undefined,
    nokPinCode: undefined,
    // Emergency contact
    emergencyFirstName: undefined,
    emergencyLastName: undefined,
    emergencyMobile: undefined,
    // Lab specific fields
    type: "investigation",
    rows: [
      {
        id: 1,
        name: "",
        date: new Date().toISOString().split('T')[0], // Initialize with today's date
        originalAmount: 0,
        discountAmount: 0,
        netAmount: 0,
        type: "investigation",
      },
    ],
    paymentMode: "",
  })

  const [image, setImage] = useState(placeholderImage)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  let stream = null

  const [checkedRows, setCheckedRows] = useState([true])

  // Add this useEffect to synchronize dates when new rows are added
  useEffect(() => {
    // If there's at least one row with a date, ensure all rows have the same date
    const rowsWithDates = formData.rows.filter(row => row.date);
    if (rowsWithDates.length > 0) {
      const firstDate = rowsWithDates[0].date;
      const today = new Date().toISOString().split('T')[0];
      
      // Ensure the date is not in the past
      const validDate = firstDate >= today ? firstDate : today;
      
      // Check if any row has a different date
      const hasDifferentDate = formData.rows.some(row => row.date && row.date !== validDate);
      
      if (hasDifferentDate) {
        setFormData(prev => ({
          ...prev,
          rows: prev.rows.map(row => ({
            ...row,
            date: validDate
          }))
        }));
      }
    }
  }, [formData.rows.length]);

  // Enhanced payment calculation function - FIXED
  const calculatePaymentBreakdown = () => {
    console.log("=== CALCULATING PAYMENT BREAKDOWN ===")
    console.log("Current GST Config:", gstConfig)

    const checkedItems = formData.rows.filter((_, index) => checkedRows[index])
    console.log("Checked Items:", checkedItems)

    const totalOriginalAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.originalAmount) || 0)
    }, 0)

    const totalDiscountAmount = checkedItems.reduce((total, item) => {
      return total + (Number.parseFloat(item.discountAmount) || 0)
    }, 0)

    const totalNetAmount = totalOriginalAmount - totalDiscountAmount

    // Fix: Calculate GST on each item's net amount individually, then sum up
    // This matches the backend logic exactly
    const totalGstAmount = checkedItems.reduce((total, item) => {
      const itemOriginalAmount = Number.parseFloat(item.originalAmount) || 0
      const itemDiscountAmount = Number.parseFloat(item.discountAmount) || 0
      const itemNetAmount = itemOriginalAmount - itemDiscountAmount

      // Calculate GST on this item's net amount (after discount)
      const itemGstAmount = gstConfig.gstApplicable ? (itemNetAmount * gstConfig.gstPercent) / 100 : 0
      console.log(
        `Item GST Calculation - Original: ${itemOriginalAmount}, Discount: ${itemDiscountAmount}, Net: ${itemNetAmount}, GST%: ${gstConfig.gstPercent}, GST Amount: ${itemGstAmount}`,
      )
      return total + itemGstAmount
    }, 0)

    const finalAmount = totalNetAmount + totalGstAmount

    const breakdown = {
      // Properties expected by your UI component
      totalOriginalAmount: totalOriginalAmount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      totalNetAmount: totalNetAmount.toFixed(2),
      totalGstAmount: totalGstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      gstPercent: gstConfig.gstPercent,
      gstApplicable: gstConfig.gstApplicable,
      itemCount: checkedItems.length,
      // Legacy properties (if needed elsewhere in your code)
      totalAmount: totalOriginalAmount.toFixed(2),
      baseAmountAfterDiscount: totalNetAmount.toFixed(2),
      taxAmount: totalGstAmount.toFixed(2),
      finalPaymentAmount: finalAmount.toFixed(2),
    }

    console.log("Final Payment Breakdown:", breakdown)
    console.log("=== END PAYMENT BREAKDOWN ===")

    return breakdown
  }

  const startCamera = async () => {
    try {
      setIsCameraOn(true)
      setTimeout(async () => {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext("2d")
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL("image/png")
      setImage(imageData)
      stopCamera()
      confirmUpload(imageData)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      setIsCameraOn(false)
    }
  }

  const clearPhoto = () => {
    setImage(placeholderImage)
  }

  const confirmUpload = (imageData) => {
    Swal.fire({
      title: "Confirm Upload",
      text: "Do you want to upload this photo?",
      imageUrl: imageData,
      imageWidth: 200,
      imageHeight: 150,
      showCancelButton: true,
      confirmButtonText: "Yes, Upload",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        uploadImage(imageData)
      }
    })
  }

  const uploadImage = async (base64Image) => {
    setLoading(true);
    try {
      const blob = await fetch(base64Image).then((res) => res.blob())
      const formData1 = new FormData()
      formData1.append("file", blob, "photo.png")

      const response = await fetch(`${API_HOST}${PATIENT_IMAGE_UPLOAD}`, {
        method: "POST",
        body: formData1,
      })

      const data = await response.json()
      if (response.status === 200 && data.response) {
        const extractedPath = data.response
        setImageURL(extractedPath)
        console.log("Uploaded Image URL:", extractedPath)
        Swal.fire("Success!", "Image uploaded successfully!", "success")
      } else {
        Swal.fire("Error!", "Failed to upload image!", "error")
      }
    } catch (error) {
      console.error("Upload error:", error)
      Swal.fire("Error!", "Something went wrong!", "error")
    } finally {
      setLoading(false);
    }
  }

  function calculateDOBFromAge(age) {
    const today = new Date()
    const birthYear = today.getFullYear() - age
    return new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split("T")[0]
  }

  function calculateAgeFromDOB(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    // Adjust if the day difference is negative
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    // Adjust if the month difference is negative
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years}Y ${months}M ${days}D`;
  }

  const handleChange = async (e) => {
    const { name, value } = e.target
    const updatedFormData = { ...formData, [name]: value }

    if (name === "dob") {
      updatedFormData.age = calculateAgeFromDOB(value)
    } else if (name === "age") {
      updatedFormData.dob = calculateDOBFromAge(value)
    }

    setFormData(updatedFormData)

    let error = ""
    if (name === "firstName" && !value.trim()) {
      error = "First Name is required."
    }
    if (name === "gender" && !value) {
      error = "Gender is required."
    }
    if (name === "relation" && !value) {
      error = "Relation is required."
    }
    if (name === "dob" && !value) {
      error = "Date of Birth is required."
    }
    if (name === "email") {
      if (!value.trim()) {
        error = "Email is required."
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Invalid email format."
      }
    }
    if (name === "mobileNo") {
      if (!value.trim()) {
        error = "Mobile number is required."
      } else if (!/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits."
      }
    }
    if (name === "pinCode") {
      if (!/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits."
      }
    }
    if (name === "nokPinCode") {
      if (!/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits."
      }
    }
    if (name === "nokMobile") {
      if (!/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits."
      }
    }
    if (name === "emergencyMobile") {
      if (!/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits."
      }
    }
    if (name === "age") {
      if (value !== "" && (isNaN(value) || Number(value) < 0)) {
        error = "Age can not be negative."
      }
    }

    if (name === "gender" && value) {
      const investigationData = await fetchInvestigationDetails(Number(value))
      setInvestigationItems(investigationData)
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors }
      if (error) {
        newErrors[name] = error
      } else {
        delete newErrors[name]
      }
      return newErrors
    })
  }

  const handleAddChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type: type
    }))
    if (type === "package") {
      fetchPackageInvestigationDetails(1)
    }
  }

  // Function to handle date changes with validation
  const handleDateChange = (index, selectedDate) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Validate that date is not in the past
    if (selectedDate < today) {
      Swal.fire({
        title: 'Invalid Date',
        text: 'Cannot select past dates. Please select today or a future date.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    // Update all rows with the selected date
    setFormData(prev => ({
      ...prev,
      rows: prev.rows.map((row, i) => ({
        ...row,
        date: selectedDate
      }))
    }));
  }

  const handleRowChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedRows = prev.rows.map((item, i) => {
        if (i !== index) return item

        const updatedItem = { ...item, [field]: value }

        if (field === "originalAmount" || field === "discountAmount") {
          const original = Number(updatedItem.originalAmount) || 0
          const discount = Number(updatedItem.discountAmount) || 0
          updatedItem.netAmount = Math.max(0, original - discount).toFixed(2)
        }

        return updatedItem
      })

      return { ...prev, rows: updatedRows }
    })
  }

  const addRow = (e, type) => {
    e.preventDefault();
    const lastRow = formData.rows[formData.rows.length - 1];
    
    // Check if previous row has name
    if (!lastRow.name) {
      Swal.fire("Missing Fields", "Please fill investigation/package name before adding new row.", "warning");
      return;
    }
    
    // Get the current synchronized date from existing rows
    const currentDate = formData.rows[0]?.date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const defaultDate = currentDate >= today ? currentDate : today;
    
    setFormData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: Date.now(),
          name: "",
          date: defaultDate, // Use the synchronized date
          originalAmount: 0,
          discountAmount: 0,
          netAmount: 0,
          type: type // ✅ captures fresh type from button click
        }
      ]
    }));
    setCheckedRows((prev) => [...prev, true]);
  };

  const removeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }))
    setCheckedRows((prev) => prev.filter((_, i) => i !== index))
  }

  const calculateTotalAmount = () => {
    return formData.rows
      .filter((_, index) => checkedRows[index])
      .reduce((total, item) => {
        return total + (Number.parseFloat(item.netAmount) || 0)
      }, 0)
      .toFixed(2)
  }

  // All your existing fetch functions
  async function fetchGenderData() {
    setLoading(true)
    try {
      const data = await getRequest(`${MAS_GENDER}/getAll/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setGenderData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setGenderData([])
      }
    } catch (error) {
      console.error("Error fetching gender data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRelationData() {
    setLoading(true)
    try {
      const data = await getRequest(`${MAS_RELATION}/getAll/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setRelationData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setRelationData([])
      }
    } catch (error) {
      console.error("Error fetching relation data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCountryData() {
    setLoading(true)
    try {
      const data = await getRequest(`${MAS_COUNTRY}/getAll/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setCountryData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setCountryData([])
      }
    } catch (error) {
      console.error("Error fetching country data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStates(value) {
    try {
      const data = await getRequest(`${MAS_STATE}/getByCountryId/${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setStateData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setStateData([])
      }
    } catch (error) {
      console.error("Error fetching state data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDistrict(value) {
    try {
      const data = await getRequest(`${MAS_DISTRICT}/getByState/${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setDistrictData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setDistrictData([])
      }
    } catch (error) {
      console.error("Error fetching district data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNokStates(value) {
    try {
      const data = await getRequest(`${MAS_STATE}/getByCountryId/${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokStateData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setNokStateData([])
      }
    } catch (error) {
      console.error("Error fetching NOK state data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNokDistrict(value) {
    try {
      const data = await getRequest(`${MAS_DISTRICT}/getByState/${value}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setNokDistrictData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setNokDistrictData([])
      }
    } catch (error) {
      console.error("Error fetching NOK district data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchInvestigationDetails(genderValue) {
    setLoading(true);
    try {
      const selectedGender = genderData.find((gender) => gender.id === Number(genderValue))
      if (!selectedGender) {
        console.error("No gender found with ID:", genderValue)
        return []
      }

      const genderApplicable = selectedGender.genderCode.toLowerCase()
      const data = await getRequest(`${MAS_INVESTIGATION}/price-details?genderApplicable=${genderApplicable}`)

      if (data.status === 200 && Array.isArray(data.response)) {
        return data.response
      } else {
        console.error("Unexpected API response format:", data)
        return []
      }
    } catch (error) {
      console.error("Error fetching investigation details:", error)
      return []
    } finally {
      setLoading(false);
    }
  }

  async function fetchPackageInvestigationDetails(flag) {
    // setLoading(true);
    try {
      const data = await getRequest(`${INVESTIGATION_PACKAGE_Mapping}/getAllPackageMap/${flag}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setPackageItems(data.response)
        return data.response
      } else {
        console.error("Unexpected API response format:", data)
        return []
      }
    } catch (error) {
      console.error("Error fetching package investigation details:", error)
      return []
    } finally {
      // setLoading(false);
    }
  }

  async function fetchPackagePrice(packName) {
    // setLoading(true);
    try {
      const data = await getRequest(`${MAS_PACKAGE_INVESTIGATION}/pricePack?packName=${packName}`)
      if (data.status === 200 && data.response) {
        return data.response
      } else {
        console.error("Unexpected API response format:", data)
        return null
      }
    } catch (error) {
      console.error("Error fetching package price:", error)
      return null
    } finally {
      // setLoading(false);
    }
  }

  async function fetchGstConfiguration() {
    setLoading(true);
    try {
      console.log("=== FETCHING GST CONFIGURATION ===");

      const data = await getRequest(`${MAS_SERVICE_CATEGORY}/getGstConfig/1`);

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
        console.warn("Invalid API response:", data);
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
      setLoading(false);
    }
  }

  async function checkDuplicatePatient(firstName, dob, gender, mobile, relation) {
    const params = new URLSearchParams({
      firstName,
      dob,
      gender,
      mobile,
      relation,
    }).toString();

    const result = await getRequest(`/patient/check-duplicate?${params}`);
    return result === true;
  }

  useEffect(() => {
    const { firstName, dob, gender, mobileNo, relation } = formData;

    if (firstName && dob && gender && mobileNo && relation) {
      const timer = setTimeout(async () => {
        try {
          const isDuplicate = await checkDuplicatePatient(firstName, dob, gender, mobileNo, relation);
          if (isDuplicate) {
            Swal.fire("Duplicate Found!", "A patient with these details already exists.", "warning");
            setIsDuplicatePatient(true);
          } else {
            setIsDuplicatePatient(false);
          }
        } catch (err) {
          console.error("Duplicate check failed:", err);
        }
      }, 800);

      return () => clearTimeout(timer);
    } else {
      // If any field is cleared, reset duplicate flag
      setIsDuplicatePatient(false);
    }
  }, [
    formData.firstName,
    formData.dob,
    formData.gender,
    formData.mobileNo,
    formData.relation
  ]);

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    console.log("GST Config changed:", gstConfig)
  }, [gstConfig])

  const validateForm = () => {
    const requiredFields = ["firstName", "gender", "relation", "dob", "email", "mobileNo"]
    let valid = true
    const newErrors = {}

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
        valid = false
      }
    })

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format."
      valid = false
    }

    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = "Mobile number must be exactly 10 digits."
      valid = false
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin Code must be exactly 6 digits."
      valid = false
    }

    if (formData.nokPinCode && !/^\d{6}$/.test(formData.nokPinCode)) {
      newErrors.nokPinCode = "Pin Code must be exactly 6 digits."
      valid = false
    }

    if (formData.rows.length === 0) {
      newErrors.rows = `At least one ${formData.type} is required.`
      valid = false
    }

    // Check if all rows have names and dates
    formData.rows.forEach((row, index) => {
      if (!row.name || row.name.trim() === "") {
        newErrors[`row_${index}_name`] = `Row ${index + 1}: Investigation/Package name is required.`
        valid = false
      }
      if (!row.date || row.date.trim() === "") {
        newErrors[`row_${index}_date`] = `Row ${index + 1}: Date is required.`
        valid = false
      }
    });

    if (!formData.paymentMode) {
      newErrors.paymentMode = "Payment mode is required."
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (shouldNavigateToPayment = false) => {
    console.log("handleSubmit called with shouldNavigateToPayment:", shouldNavigateToPayment);
    const isFormValid = shouldNavigateToPayment ? true : validateForm();
    console.log("Form validation result:", isFormValid);

    if (isDuplicatePatient) {
      Swal.fire("Duplicate Found!", "A patient with these details already exists. Please check your details.", "warning");
      return;
    }

    if (isFormValid) {
      console.log("Form validation passed, proceeding with registration...");
      try {
        setLoading(true);

        // ✅ Build patient object
        const patientRequest = {
          uhidNo: "",
          patientFn: formData.firstName,
          patientMn: formData.middleName || "",
          patientLn: formData.lastName || "",
          patientDob: formData.dob,
          patientAge: formData.age?.toString(),
          patientGenderId: formData.gender,
          patientEmailId: formData.email,
          patientMobileNumber: formData.mobileNo,
          patientImage: imageURL || "",
          fileName: "string",
          patientRelationId: formData.relation,
          patientAddress1: formData.address1 || "",
          patientAddress2: formData.address2 || "",
          patientCity: formData.city || "",
          patientPincode: formData.pinCode || "",
          patientDistrictId: formData.district,
          patientStateId: formData.state,
          patientCountryId: formData.country,
          emerFn: formData.emergencyFirstName || "",
          emerLn: formData.emergencyLastName || "",
          emerMobile: formData.emergencyMobile || "",
          nokFn: formData.nokFirstName || "",
          nokLn: formData.nokLastName || "",
          nokEmail: formData.nokEmail || "",
          nokMobileNumber: formData.nokMobile || "",
          nokAddress1: formData.nokAddress1 || "",
          nokAddress2: formData.nokAddress2 || "",
          nokCity: formData.nokCity || "",
          nokDistrictId: formData.nokDistrict,
          nokStateId: formData.nokState,
          nokCountryId: formData.nokCountry,
          nokPincode: formData.nokPinCode || "",
          patientStatus: "",
          regDate: new Date().toISOString().split("T")[0],
          lastChgBy: sessionStorage.getItem("username"),
          patientHospitalId: Number(sessionStorage.getItem("hospitalId")),
        };

        // ✅ Register patient
        const patientResult = await postRequest("/patient/register", { patient: patientRequest });
        const patientId = patientResult?.response?.patient?.id;
        if (!patientId) throw new Error(patientResult.message || "Patient registration failed");

        // ✅ Validate checked rows
        const hasCheckedItems = formData.rows.some((row, index) => checkedRows[index]);
        if (!hasCheckedItems) throw new Error("Please select at least one investigation or package.");

        // ✅ Check for any invalid rows with no itemId
        const invalidRow = formData.rows.find((row, index) => checkedRows[index] && !row.itemId);
        if (invalidRow) throw new Error("One or more selected rows have no valid investigation/package. Please select from dropdown.");

        // ✅ Calculate payment breakdown
        const paymentBreakdown = calculatePaymentBreakdown();
        const totalFinalAmount = parseFloat(paymentBreakdown.finalAmount);

        // ✅ Build final lab request - SEND ALL ITEMS (both checked and unchecked)
        const labData = {
          patientId: patientId,
          labInvestigationReq: [],
        };

        // Send ALL rows with their respective check status
        formData.rows.forEach((row, index) => {
          if (row.itemId) { // Only include rows that have valid itemId
            labData.labInvestigationReq.push({
              id: row.itemId,
              appointmentDate: row.date || new Date().toISOString().split('T')[0],
              checkStatus: checkedRows[index] || false, // Send actual check status
              actualAmount: parseFloat(row.originalAmount) || 0,
              discountedAmount: parseFloat(row.discountAmount) || 0,
              type: row.type === "investigation" ? "i" : "p",
            });
          }
        });

        console.log("FINAL LAB DATA:", labData);

        // ✅ Call backend
        const labResult = await postRequest("/lab/registration", labData);
        if (!labResult || labResult.status !== 200) {
          throw new Error(labResult?.message || "Lab registration failed.");
        }

        console.log("Lab registration successful:", labResult);

        if (shouldNavigateToPayment) {
          Swal.fire({
            title: "Success!",
            text: "Patient and Lab registered successfully! Redirecting to payment.",
            icon: "success",
            confirmButtonText: "OK, Proceed",
          }).then(() => {
            navigate("/payment", {
              state: {
                amount: totalFinalAmount,
                patientId,
                labData: labResult,
                selectedItems: {
                  // Only send checked items to payment page
                  investigations: labData.labInvestigationReq.filter((i) => i.type === "i" && i.checkStatus),
                  packages: labData.labInvestigationReq.filter((i) => i.type === "p" && i.checkStatus),
                },
                paymentBreakdown,
              },
            });
          });
        } else {
          Swal.fire("Success!", "Patient and Lab registered successfully!", "success").then(() => handleReset());
        }
      } catch (error) {
        console.error("Registration error:", error);
        Swal.fire("Error!", error.message || "Registration failed", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const isMobileNoMissing = !formData.mobileNo || formData.mobileNo.trim() === ""

  const handleReset = () => {
    setFormData({
      // Personal details
      imageurl: undefined,
      firstName: undefined,
      middleName: undefined,
      lastName: undefined,
      mobileNo: undefined,
      gender: undefined,
      relation: undefined,
      dob: undefined,
      age: undefined,
      email: undefined,
      // Patient address
      address1: undefined,
      address2: undefined,
      country: undefined,
      state: undefined,
      district: undefined,
      city: undefined,
      pinCode: undefined,
      // NOK details
      nokFirstName: undefined,
      nokMiddleName: undefined,
      nokLastName: undefined,
      nokEmail: undefined,
      nokMobile: undefined,
      nokAddress1: undefined,
      nokAddress2: undefined,
      nokCountry: undefined,
      nokState: undefined,
      nokDistrict: undefined,
      nokCity: undefined,
      nokPinCode: undefined,
      // Emergency contact
      emergencyFirstName: undefined,
      emergencyLastName: undefined,
      emergencyMobile: undefined,
      // Lab specific fields
      type: "investigation",
      rows: [
        {
          id: 1,
          name: "",
          date: new Date().toISOString().split('T')[0], // Reset to today's date
          originalAmount: 0,
          discountAmount: 0,
          netAmount: 0,
          type: "investigation",
        },
      ],
      paymentMode: "",
    })
    setErrors({})
    setImage(placeholderImage)
    setImageURL("")
  }

  const isAnyDateOrNameMissing = formData.rows.some(
    (row) => !row.date || row.date.trim() === "" || !row.name || row.name.trim() === "",
  )

  // Get payment breakdown for display
  const paymentBreakdown = calculatePaymentBreakdown()

  const getMissingMandatoryFields = () => {
    const missing = []
    if (!formData.mobileNo || formData.mobileNo.trim() === "") {
      missing.push("Mobile Number")
    }
    formData.rows.forEach((row, idx) => {
      if (!row.name || row.name.trim() === "") missing.push(`Row ${idx + 1}: Name`)
      if (!row.date || row.date.trim() === "") missing.push(`Row ${idx + 1}: Date`)
      if (row.originalAmount === undefined || row.originalAmount === "" || isNaN(row.originalAmount)) missing.push(`Row ${idx + 1}: Original Amount`)
    })
    return missing
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Lab Registration</h3>
            </div>
          </div>
        </div>

        {/* Patient Personal Details */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3   border-bottom-1">
                <h6 className="mb-0 fw-bold">Personal Details</h6>
              </div>
              <div className="card-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-9">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="firstName">
                            First Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                            id="firstName"
                            name="firstName"
                            value={formData.firstName || ""}
                            onChange={handleChange}
                            placeholder="Enter First Name"
                          />
                          {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="middleName">
                            Middle Name
                          </label>
                          <input
                            type="text"
                            id="middleName"
                            value={formData.middleName || ""}
                            name="middleName"
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Enter Middle Name"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="lastName">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            value={formData.lastName || ""}
                            name="lastName"
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Enter Last Name"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="mobileNo">
                            Mobile No.<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            id="mobileNo"
                            className={`form-control ${errors.mobileNo ? "is-invalid" : ""}`}
                            name="mobileNo"
                            value={formData.mobileNo || ""}
                            maxLength={10}
                            onChange={(e) => {
                              if (/^\d*$/.test(e.target.value)) {
                                handleChange(e)
                              }
                            }}
                            placeholder="Enter Mobile Number"
                          />
                          {errors.mobileNo && <div className="invalid-feedback">{errors.mobileNo}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="gender">
                            Gender <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                            id="gender"
                            name="gender"
                            value={formData.gender || ""}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            {genderData.map((gender) => (
                              <option key={gender.id} value={gender.id}>
                                {gender.genderName}
                              </option>
                            ))}
                          </select>
                          {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="relation">
                            Relation <span className="text-danger">*</span>
                          </label>
                          <select
                            className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                            id="relation"
                            name="relation"
                            value={formData.relation || ""}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            {relationData.map((relation) => (
                              <option key={relation.id} value={relation.id}>
                                {relation.relationName}
                              </option>
                            ))}
                          </select>
                          {errors.relation && <div className="invalid-feedback">{errors.relation}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="dob">
                            DOB <span className="text-danger">*</span>
                          </label>
                          <input
                            type="date"
                            id="dob"
                            name="dob"
                            className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                            value={formData.dob || ""}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={handleChange}
                            placeholder="Select Date of Birth"
                          />
                          {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="age">
                            Age
                          </label>
                          <input
                            type="text" // <<== NOT number!
                            id="age"
                            name="age"
                            className={`form-control ${errors.age ? "is-invalid" : ""}`}
                            value={formData.age || ""}
                            onChange={handleChange}
                            placeholder="Enter Age"
                          />

                          {errors.age && <div className="invalid-feedback">{errors.age}</div>}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label" htmlFor="email">
                            Email <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            value={formData.email || ""}
                            onChange={handleChange}
                            placeholder="Enter Email Address"
                          />
                          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <div className="card p-3 shadow">
                          {isCameraOn ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              className="d-block mx-auto"
                              style={{ width: "100%", height: "150px" }}
                            ></video>
                          ) : (
                            <img
                              src={image || "/default-profile.png"}
                              alt="Profile"
                              className="img-fluid border"
                              style={{ width: "100%", height: "150px" }}
                            />
                          )}
                          <canvas ref={canvasRef} width="300" height="150" style={{ display: "none" }}></canvas>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-primary me-2 mb-2"
                              onClick={startCamera}
                              disabled={isCameraOn}
                            >
                              Start Camera
                            </button>
                            {isCameraOn && (
                              <button type="button" className="btn btn-success me-2 mb-2" onClick={capturePhoto}>
                                Take Photo
                              </button>
                            )}
                            <button type="button" className="btn btn-danger mb-2" onClick={clearPhoto}>
                              Clear Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Patient address */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3   border-bottom-1">
                <h6 className="mb-0 fw-bold">Patient Address</h6>
              </div>
              <div className="card-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Address 1</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address1"
                        value={formData.address1 || ""}
                        onChange={handleChange}
                        placeholder="Enter Address 1"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 2</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address2"
                        value={formData.address2 || ""}
                        onChange={handleChange}
                        placeholder="Enter Address 2"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select
                        className="form-select"
                        name="country"
                        value={formData.country || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                          fetchStates(e.target.value)
                        }}
                      >
                        <option value="">Select Country</option>
                        {countryData.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.countryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <select
                        className="form-select"
                        name="state"
                        value={formData.state || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                          fetchDistrict(e.target.value)
                        }}
                      >
                        <option value="">Select State</option>
                        {stateData.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.stateName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <select
                        className="form-select"
                        name="district"
                        value={formData.district || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                        }}
                      >
                        <option value="">Select District</option>
                        {districtData.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.districtName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        name="city"
                        value={formData.city || ""}
                        onChange={handleChange}
                        placeholder="Enter City"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input
                        type="text"
                        className={`form-control ${errors.pinCode ? "is-invalid" : ""}`}
                        name="pinCode"
                        value={formData.pinCode || ""}
                        maxLength={6}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) {
                            handleChange(e)
                          }
                        }}
                        placeholder="Enter Pin Code"
                      />
                      {errors.pinCode && <div className="invalid-feedback">{errors.pinCode}</div>}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* NOK Details */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3   border-bottom-1">
                <h6 className="mb-0 fw-bold">NOK Details</h6>
              </div>
              <div className="card-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter First Name"
                        name="nokFirstName"
                        value={formData.nokFirstName || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Middle Name"
                        name="nokMiddleName"
                        value={formData.nokMiddleName || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Last Name"
                        name="nokLastName"
                        value={formData.nokLastName || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter Email"
                        name="nokEmail"
                        value={formData.nokEmail || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className={`form-control ${errors.nokMobile ? "is-invalid" : ""}`}
                        placeholder="Enter Mobile Number"
                        name="nokMobile"
                        value={formData.nokMobile || ""}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) {
                            handleChange(e)
                          }
                        }}
                      />
                      {errors.nokMobile && <div className="invalid-feedback">{errors.nokMobile}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 1</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Address 1"
                        name="nokAddress1"
                        value={formData.nokAddress1 || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Address 2</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Address 2"
                        name="nokAddress2"
                        value={formData.nokAddress2 || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <select
                        className="form-select"
                        name="nokCountry"
                        value={formData.nokCountry || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                          fetchNokStates(e.target.value)
                        }}
                      >
                        <option value="">Select Country</option>
                        {countryData.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.countryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <select
                        className="form-select"
                        name="nokState"
                        value={formData.nokState || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                          fetchNokDistrict(e.target.value)
                        }}
                      >
                        <option value="">Select State</option>
                        {nokStateData.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.stateName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <select
                        className="form-select"
                        name="nokDistrict"
                        value={formData.nokDistrict || ""}
                        onChange={(e) => {
                          handleAddChange(e)
                        }}
                      >
                        <option value="">Select District</option>
                        {nokDistrictData.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.districtName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter City"
                        name="nokCity"
                        value={formData.nokCity || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input
                        type="text"
                        className={`form-control ${errors.nokPinCode ? "is-invalid" : ""}`}
                        name="nokPinCode"
                        value={formData.nokPinCode || ""}
                        maxLength={6}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) {
                            handleChange(e)
                          }
                        }}
                        placeholder="Enter Pin Code"
                      />
                      {errors.nokPinCode && <div className="invalid-feedback">{errors.nokPinCode}</div>}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Details Section */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3   border-bottom-1">
                <h6 className="mb-0 fw-bold">Emergency Contact Details</h6>
              </div>
              <div className="card-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter First Name"
                        name="emergencyFirstName"
                        value={formData.emergencyFirstName || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Last Name"
                        name="emergencyLastName"
                        value={formData.emergencyLastName || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className={`form-control ${errors.emergencyMobile ? "is-invalid" : ""}`}
                        placeholder="Enter Mobile Number"
                        name="emergencyMobile"
                        value={formData.emergencyMobile || ""}
                        maxLength={10}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) {
                            handleChange(e)
                          }
                        }}
                      />
                      {errors.emergencyMobile && <div className="invalid-feedback">{errors.emergencyMobile}</div>}
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
              <div className="card-header   border-bottom-1 py-3">
                <h6 className="fw-bold mb-0">
                  {formData.type === "investigation" ? "Investigation Details" : "Package Details"}
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="investigation"
                      value="investigation"
                      checked={formData.type === "investigation"}
                      onChange={() => handleTypeChange("investigation")}
                    />
                    <label className="form-check-label" htmlFor="investigation">
                      Investigation
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="type"
                      id="package"
                      value="package"
                      checked={formData.type === "package"}
                      onChange={() => handleTypeChange("package")}
                    />
                    <label className="form-check-label" htmlFor="package">
                      Package
                    </label>
                  </div>
                </div>

                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>{formData.type === "investigation" ? "Investigation Name" : "Package Name"} <span className="text-danger">*</span></th>
                      <th>Date  <span className="text-danger">*</span></th>
                      <th>Original Amount  <span className="text-danger">*</span></th>
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
                              style={{ width: "20px", height: "20px", border: "2px solid black" }}
                              className="form-check-input"
                              checked={checkedRows[index] || false}
                              onChange={(e) => {
                                const updated = [...checkedRows]
                                updated[index] = e.target.checked
                                setCheckedRows(updated)
                              }}
                            />
                            <div className="dropdown-search-container position-relative flex-grow-1">
                              <input
                                type="text"
                                className="form-control"
                                value={row.name}
                                autoComplete="off"
                                placeholder={formData.type === "investigation" ? "Investigation Name" : "Package Name"}
                                onChange={(e) => {
                                  handleRowChange(index, "name", e.target.value)
                                  if (e.target.value.trim() !== "") {
                                    setActiveRowIndex(index)
                                  } else {
                                    setActiveRowIndex(null)
                                  }
                                }}
                                onFocus={() => {
                                  if (row.name.trim() !== "") {
                                    setActiveRowIndex(index)
                                  }
                                }}
                                onBlur={() => setTimeout(() => setActiveRowIndex(null), 200)}
                              />
                              {activeRowIndex === index && row.name.trim() !== "" && (
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
                                        item.investigationName.toLowerCase().includes(row.name.toLowerCase()),
                                      )
                                      .map((item, i) => {
                                        const hasDiscount = item.disc && item.disc > 0
                                        const displayPrice = item.price || 0
                                        const discountAmount = hasDiscount ? item.disc : 0
                                        const finalPrice = hasDiscount ? displayPrice - discountAmount : displayPrice

                                        return (
                                          <li
                                            key={i}
                                            className="list-group-item list-group-item-action"
                                            style={{ backgroundColor: "#e3e8e6", cursor: "pointer" }}
                                            onClick={() => {
                                              if (item.price === null || item.price === 0 || item.price === "0") {
                                                Swal.fire(
                                                  "Warning",
                                                  "Price has not been configured for this Investigation",
                                                  "warning"
                                                );
                                              } else {
                                                handleRowChange(index, "name", item.investigationName);
                                                handleRowChange(index, "itemId", item.investigationId);
                                                handleRowChange(index, "originalAmount", displayPrice);
                                                handleRowChange(index, "discountAmount", discountAmount);
                                                handleRowChange(index, "netAmount", finalPrice);
                                                handleRowChange(index, "type", formData.type); // ✅ FORCE type from radio!
                                                setActiveRowIndex(null);
                                              }
                                            }}
                                          >
                                            <div>
                                              <strong>{item.investigationName}</strong>
                                              <div className="d-flex justify-content-between">
                                                <span>
                                                  {item.price === null
                                                    ? "Price not configured"
                                                    : `₹${finalPrice.toFixed(2)}`}
                                                </span>
                                                {hasDiscount && (
                                                  <span className="text-success">
                                                    (Discount: ₹{discountAmount.toFixed(2)})
                                                  </span>
                                                )}
                                              </div>
                                              {item.investigationType && (
                                                <small className="text-muted">
                                                  Type: {item.investigationType}
                                                </small>
                                              )}
                                            </div>
                                          </li>
                                        )
                                      })
                                    : packageItems
                                      .filter((item) => item.packName.toLowerCase().includes(row.name.toLowerCase()))
                                      .map((item, i) => (
                                        <li
                                          key={i}
                                          className="list-group-item list-group-item-action"
                                          style={{ backgroundColor: "#e3e8e6", cursor: "pointer" }}
                                          onClick={async () => {
                                            const priceDetails = await fetchPackagePrice(item.packName);
                                            if (!priceDetails || !priceDetails.actualCost) {
                                              Swal.fire(
                                                "Warning",
                                                "Price has not been configured for this Package",
                                                "warning"
                                              );
                                            } else {
                                              handleRowChange(index, "name", item.packName);
                                              handleRowChange(index, "itemId", item.id || priceDetails.packId);
                                              handleRowChange(
                                                index,
                                                "originalAmount",
                                                priceDetails.baseCost || priceDetails.actualCost
                                              );
                                              handleRowChange(index, "discountAmount", priceDetails.disc || 0);
                                              handleRowChange(index, "netAmount", priceDetails.actualCost);
                                              handleRowChange(index, "type", formData.type); // ✅ FORCE type from radio!
                                              setActiveRowIndex(null);
                                            }
                                          }}
                                        >
                                          <div>
                                            <strong>{item.packName}</strong>
                                            <div className="d-flex justify-content-between">
                                              <span>₹{item.actualCost.toFixed(2)}</span>
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
                            value={row.date || new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleDateChange(index, e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={row.originalAmount}
                            onChange={(e) => handleRowChange(index, "originalAmount", e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={row.discountAmount}
                            onChange={(e) => handleRowChange(index, "discountAmount", e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <div className="font-weight-bold text-success">₹{row.netAmount || "0.00"}</div>
                        </td>
                        <td>
                          <div className="d-flex align-item-center gap-2">
                            <div className="form-check form-check-muted m-0"></div>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => removeRow(index)}
                              disabled={formData.rows.length === 1}
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
                  <button type="button" className="btn btn-success" onClick={(e) => addRow(e, formData.type)}>
                    Add {formData.type === "investigation" ? "Investigation" : "Package"} +
                  </button>

                  <div className="d-flex">
                    <input
                      type="text"
                      className="form-control me-2"
                      placeholder="Enter Coupon Code"
                      style={{ width: "200px" }}
                    />
                    <button type="button" className="btn btn-primary me-2">
                      <i className="icofont-ticket me-1"></i> Apply Coupon
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
              style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
            >
              <div
                className="card-header py-3 text-white"
                style={{ background: "rgba(255,255,255,0.1)", border: "none" }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-white rounded" style={{ opacity: 0.9 }}>
                    <i className="fa fa-calculator text-primary"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-white">Payment Summary</h5>
                    <small className="text-white" style={{ opacity: 0.8 }}>
                      {paymentBreakdown.itemCount} item{paymentBreakdown.itemCount !== 1 ? "s" : ""} selected
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
                      style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      <div className="card-body text-center">
                        <div className="mb-2">
                          <i className="fa fa-receipt fa-2x text-white" style={{ opacity: 0.8 }}></i>
                        </div>
                        <h6 className="card-title text-white mb-1">Total Amount</h6>
                        <h4 className="text-white fw-bold">₹{paymentBreakdown.totalOriginalAmount}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Discount Card */}
                  <div className="col-md-3">
                    <div
                      className="card h-100"
                      style={{ background: "rgba(40,167,69,0.2)", border: "1px solid rgba(40,167,69,0.3)" }}
                    >
                      <div className="card-body text-center">
                        <div className="mb-2">
                          <i className="fa fa-percent fa-2x text-success"></i>
                        </div>
                        <h6 className="card-title text-white mb-1">Total Discount</h6>
                        <h4 className="text-success fw-bold">₹{paymentBreakdown.totalDiscountAmount}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Tax Card - only show if GST is applicable */}
                  {paymentBreakdown.gstApplicable && (
                    <div className="col-md-3">
                      <div
                        className="card h-100"
                        style={{ background: "rgba(255,193,7,0.2)", border: "1px solid rgba(255,193,7,0.3)" }}
                      >
                        <div className="card-body text-center">
                          <div className="mb-2">
                            <i className="fa fa-file-invoice fa-2x text-warning"></i>
                          </div>
                          <h6 className="card-title text-white mb-1">Tax ({paymentBreakdown.gstPercent}% GST)</h6>
                          <h4 className="text-warning fw-bold">₹{paymentBreakdown.totalGstAmount}</h4>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final Amount Card */}
                  <div className="col-md-3">
                    <div
                      className="card h-100"
                      style={{
                        background: "linear-gradient(45deg, #28a745, #20c997)",
                        border: "none",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="card-body text-center">
                        <div className="mb-2">
                          <i className="fa fa-credit-card fa-2x text-white"></i>
                        </div>
                        <h6 className="card-title text-white mb-1">Final Amount</h6>
                        <h4 className="text-white fw-bold">₹{paymentBreakdown.finalAmount}</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="card" style={{ background: "rgba(255,255,255,0.95)", border: "none" }}>
                  <div className="card-body">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="fa fa-list-alt text-primary"></i>
                      Payment Breakdown
                    </h6>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <span className="text-muted">Subtotal ({paymentBreakdown.itemCount} items)</span>
                          <span className="fw-medium text-dark">₹{paymentBreakdown.totalOriginalAmount}</span>
                        </div>
                        {Number(paymentBreakdown.totalDiscountAmount) > 0 && (
                          <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-success">Discount Applied</span>
                            <span className="fw-medium text-success">-₹{paymentBreakdown.totalDiscountAmount}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <span className="text-muted">Amount after Discount</span>
                          <span className="fw-medium text-dark">₹{paymentBreakdown.totalNetAmount}</span>
                        </div>
                        {paymentBreakdown.gstApplicable && (
                          <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted">GST ({paymentBreakdown.gstPercent}%)</span>
                            <span className="fw-medium text-warning">+₹{paymentBreakdown.totalGstAmount}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between py-3 border-top">
                          <span className="h5 fw-bold text-dark">Total Payable</span>
                          <span className="h4 fw-bold text-primary">₹{paymentBreakdown.finalAmount}</span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="d-flex flex-wrap gap-2">
                          <span className="badge bg-secondary px-3 py-2">
                            {paymentBreakdown.itemCount} Items Selected
                          </span>
                          {Number(paymentBreakdown.totalDiscountAmount) > 0 && (
                            <span className="badge bg-success px-3 py-2">Discount Applied</span>
                          )}
                          {paymentBreakdown.gstApplicable && (
                            <span className="badge bg-info px-3 py-2">GST Included</span>
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
                  <div className="mt-4">
                    <button
                      type="button"
                      className="btn btn-primary me-2"
                      onClick={async () => {
                        const missingFields = getMissingMandatoryFields()
                        if (loading) return
                        if (missingFields.length > 0) {
                          Swal.fire(
                            "Missing Mandatory Fields",
                            "Please fill all mandatory fields before proceeding.",
                            "warning"
                          )
                          return
                        }
                        try {
                          console.log("Pay Now button clicked")
                          await handleSubmit(true)
                        } catch (error) {
                          console.error("Error in payment flow:", error)
                        }
                      }}
                    >
                      <i className="fa fa-credit-card me-1"></i>
                      {loading ? "Processing..." : `Pay Now - ₹${paymentBreakdown.finalAmount}`}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleReset}>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabRegistration
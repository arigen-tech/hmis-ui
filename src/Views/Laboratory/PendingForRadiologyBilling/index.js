import { useState, useRef, useEffect } from "react"
import placeholderImage from "../../../assets/images/placeholder.jpg"
import { useNavigate } from "react-router-dom"
import Popup from "../../../Components/popup" 
import LoadingScreen from "../../../Components/Loading"
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
} from "../../../config/constants"

const PendingForRadiologyBilling = () => {
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
  const [popupMessage, setPopupMessage] = useState(null)
  const [isDuplicatePatient, setIsDuplicatePatient] = useState(false)

  const navigate = useNavigate()

  const [gstConfig, setGstConfig] = useState({
    gstApplicable: true,
    gstPercent: 18,
  })

  const [formData, setFormData] = useState({
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
    address1: undefined,
    address2: undefined,
    country: undefined,
    state: undefined,
    district: undefined,
    city: undefined,
    pinCode: undefined,
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
    emergencyFirstName: undefined,
    emergencyLastName: undefined,
    emergencyMobile: undefined,
    type: "investigation",
    rows: [
      {
        id: 1,
        name: "",
        date: new Date().toISOString().split('T')[0],
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

  useEffect(() => {
    // Mock data initialization
    setGenderData([
      { id: 1, genderName: "Male", genderCode: "M" },
      { id: 2, genderName: "Female", genderCode: "F" },
      { id: 3, genderName: "Other", genderCode: "O" }
    ])
    
    setRelationData([
      { id: 1, relationName: "Self" },
      { id: 2, relationName: "Father" },
      { id: 3, relationName: "Mother" },
      { id: 4, relationName: "Spouse" },
      { id: 5, relationName: "Child" }
    ])
    
    setCountryData([
      { id: 1, countryName: "India" },
      { id: 2, countryName: "USA" },
      { id: 3, countryName: "UK" }
    ])
    
    setInvestigationItems([
      { 
        investigationId: 1, 
        investigationName: "Blood Test", 
        price: 500, 
        disc: 50,
        investigationType: "Pathology"
      },
      { 
        investigationId: 2, 
        investigationName: "X-Ray Chest", 
        price: 800, 
        disc: 0,
        investigationType: "Radiology"
      },
      { 
        investigationId: 3, 
        investigationName: "MRI Brain", 
        price: 5000, 
        disc: 500,
        investigationType: "Radiology"
      },
      { 
        investigationId: 4, 
        investigationName: "CT Scan Abdomen", 
        price: 4000, 
        disc: 400,
        investigationType: "Radiology"
      }
    ])
    
    setPackageItems([
      { 
        packageId: 1, 
        packName: "Basic Health Package", 
        actualCost: 2500,
        baseCost: 3000,
        disc: 500,
        investigationIds: [1, 2]
      },
      { 
        packageId: 2, 
        packName: "Comprehensive Health Package", 
        actualCost: 8000,
        baseCost: 10000,
        disc: 2000,
        investigationIds: [1, 2, 3, 4]
      },
      { 
        packageId: 3, 
        packName: "Cardiac Package", 
        actualCost: 3500,
        baseCost: 4000,
        disc: 500,
        investigationIds: [1, 3]
      }
    ])
    
    setGstConfig({
      gstApplicable: true,
      gstPercent: 18,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const { firstName, dob, gender, mobileNo, relation } = formData

    if (firstName && dob && gender && mobileNo && relation) {
      const timer = setTimeout(async () => {
        // Mock duplicate check - random result
        const isDuplicate = Math.random() > 0.7
        if (isDuplicate) {
          showPopup("Duplicate patient found!", "warning")
          setIsDuplicatePatient(true)
        } else {
          setIsDuplicatePatient(false)
        }
      }, 800)

      return () => clearTimeout(timer)
    } else {
      setIsDuplicatePatient(false)
    }
  }, [formData.firstName, formData.dob, formData.gender, formData.mobileNo, formData.relation])

  useEffect(() => {
    console.log("GST Config changed:", gstConfig)
  }, [gstConfig])

  const showPopup = (message, type = "info", shouldRefreshData = false, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
        if (shouldRefreshData) {
          // Handle any refresh logic if needed
        }
        if (onCloseCallback) {
          onCloseCallback()
        }
      }
    })
  }

  const showConfirmationPopup = (title, text, imageUrl, onConfirm) => {
    const confirmUpload = () => {
      onConfirm()
      setPopupMessage(null)
    }

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
                style={{ maxWidth: "200px", maxHeight: "150px", border: "1px solid #ddd" }}
              />
            </div>
          )}
          <div className="d-flex justify-content-center gap-2 mt-3">
            <button className="btn btn-primary" onClick={confirmUpload}>
              Yes, Upload
            </button>
            <button className="btn btn-secondary" onClick={() => setPopupMessage(null)}>
              Cancel
            </button>
          </div>
        </div>
      ),
      type: "custom",
      onClose: () => setPopupMessage(null)
    })
  }

  const isInvestigationInSelectedPackages = (investigationId, date) => {
    return formData.rows.some((row, index) => {
      if (!checkedRows[index]) return false
      if (row.type === "package" && row.investigationIds && row.date === date) {
        return row.investigationIds.includes(investigationId)
      }
      return false
    })
  }

  const isPackageAlreadySelected = (packageId, date) => {
    return formData.rows.some((row, index) => {
      if (!checkedRows[index]) return false
      return row.type === "package" && 
             row.itemId === packageId && 
             row.date === date
    })
  }

  const isInvestigationAlreadySelected = (investigationId, date) => {
    return formData.rows.some((row, index) => {
      if (!checkedRows[index]) return false
      return row.type === "investigation" &&
        row.itemId === investigationId &&
        row.date === date
    })
  }

  const getInvestigationIdsFromPackage = async (packageId, packageName) => {
    const packageData = packageItems.find(pkg =>
      pkg.packageId === packageId || pkg.packName === packageName
    )
    return packageData?.investigationIds || []
  }

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

    const totalGstAmount = checkedItems.reduce((total, item) => {
      const itemOriginalAmount = Number.parseFloat(item.originalAmount) || 0
      const itemDiscountAmount = Number.parseFloat(item.discountAmount) || 0
      const itemNetAmount = itemOriginalAmount - itemDiscountAmount

      const itemGstAmount = gstConfig.gstApplicable ? (itemNetAmount * gstConfig.gstPercent) / 100 : 0
      console.log(
        `Item GST Calculation - Original: ${itemOriginalAmount}, Discount: ${itemDiscountAmount}, Net: ${itemNetAmount}, GST%: ${gstConfig.gstPercent}, GST Amount: ${itemGstAmount}`,
      )
      return total + itemGstAmount
    }, 0)

    const finalAmount = totalNetAmount + totalGstAmount

    const breakdown = {
      totalOriginalAmount: totalOriginalAmount.toFixed(2),
      totalDiscountAmount: totalDiscountAmount.toFixed(2),
      totalNetAmount: totalNetAmount.toFixed(2),
      totalGstAmount: totalGstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      gstPercent: gstConfig.gstPercent,
      gstApplicable: gstConfig.gstApplicable,
      itemCount: checkedItems.length,
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
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        } catch (error) {
          console.error("Error accessing camera:", error)
          showPopup("Could not access camera. Please check permissions.", "error")
          setIsCameraOn(false)
        }
      }, 100)
    } catch (error) {
      console.error("Error starting camera:", error)
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
    showConfirmationPopup(IMAGE_TITLE, IMAGE_TEXT, imageData, () => {
      uploadImage(imageData)
    })
  }

  const uploadImage = async (base64Image) => {
    setLoading(true)
    try {
      // Mock successful upload
      setTimeout(() => {
        const mockPath = "/uploads/patient-photo.png"
        setImageURL(mockPath)
        console.log("Uploaded Image URL:", mockPath)
        showPopup(IMAGE_UPLOAD_SUCC_MSG, "success")
        setLoading(false)
      }, 1500)
    } catch (error) {
      console.error("Upload error:", error)
      showPopup(UNEXPECTED_ERROR, "error")
      setLoading(false)
    }
  }

  function calculateDOBFromAge(age) {
    const today = new Date()
    const birthYear = today.getFullYear() - age
    return new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split("T")[0]
  }

  function calculateAgeFromDOB(dob) {
    const birthDate = new Date(dob)
    const today = new Date()

    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    let days = today.getDate() - birthDate.getDate()

    if (days < 0) {
      months--
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    return `${years}Y ${months}M ${days}D`
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
      if (value && !/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits."
      }
    }
    if (name === "nokPinCode") {
      if (value && !/^\d{6}$/.test(value)) {
        error = "Pin Code must be exactly 6 digits."
      }
    }
    if (name === "nokMobile") {
      if (value && !/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits."
      }
    }
    if (name === "emergencyMobile") {
      if (value && !/^\d{10}$/.test(value)) {
        error = "Mobile number must be exactly 10 digits."
      }
    }
    if (name === "age") {
      if (value !== "" && (isNaN(value) || Number(value) < 0)) {
        error = "Age can not be negative."
      }
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
  }

  const handleDateChange = (index, selectedDate) => {
    const today = new Date().toISOString().split('T')[0]

    if (selectedDate < today) {
      showPopup(INVALID_DATE_TEXT, "warning")
      return
    }

    const currentRow = formData.rows[index]
    let hasDuplicate = false

    if (currentRow.itemId) {
      if (currentRow.type === "package") {
        hasDuplicate = formData.rows.some((row, i) => {
          if (i === index || !checkedRows[i]) return false
          return row.type === "package" &&
            row.itemId === currentRow.itemId &&
            row.date === selectedDate
        })
      } else if (currentRow.type === "investigation") {
        hasDuplicate = formData.rows.some((row, i) => {
          if (i === index || !checkedRows[i]) return false
          if (row.type === "package" && row.investigationIds) {
            return row.investigationIds.includes(currentRow.itemId) &&
              row.date === selectedDate
          }
          return row.type === "investigation" &&
            row.itemId === currentRow.itemId &&
            row.date === selectedDate
        })
      }
    }

    if (hasDuplicate) {
      showPopup("Duplicate item found for this date!", "warning")
      return
    }

    setFormData(prev => ({
      ...prev,
      rows: prev.rows.map((row, i) => {
        if (i === index) {
          return { ...row, date: selectedDate }
        }
        return row
      })
    }))
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
    e.preventDefault()
    const lastRow = formData.rows[formData.rows.length - 1]

    if (!lastRow.name) {
      showPopup(ADD_ROW_WARNING, "warning")
      return
    }

    if (lastRow.type === "package" && lastRow.itemId && lastRow.date) {
      const isDuplicatePackage = formData.rows.slice(0, -1).some((row, i) => {
        if (!checkedRows[i]) return false
        return row.type === "package" &&
          row.itemId === lastRow.itemId &&
          row.date === lastRow.date
      })

      if (isDuplicatePackage) {
        showPopup(
          DUPLICATE_PACKAGE_WARN_MSG,
          "warning"
        )
        handleRowChange(formData.rows.length - 1, "name", "")
        handleRowChange(formData.rows.length - 1, "itemId", undefined)
        handleRowChange(formData.rows.length - 1, "date", new Date().toISOString().split('T')[0])
        return
      }
    } else if (lastRow.type === "investigation" && lastRow.itemId && lastRow.date) {
      const isDuplicateInvestigation = formData.rows.slice(0, -1).some((row, i) => {
        if (!checkedRows[i]) return false
        if (row.type === "package" && row.investigationIds) {
          return row.investigationIds.includes(lastRow.itemId) &&
            row.date === lastRow.date
        }
        return row.type === "investigation" &&
          row.itemId === lastRow.itemId &&
          row.date === lastRow.date
      })

      if (isDuplicateInvestigation) {
        showPopup(
          DUPLICATE_INV_INCLUDE_PACKAGE,
          "warning"
        )
        handleRowChange(formData.rows.length - 1, "name", "")
        handleRowChange(formData.rows.length - 1, "itemId", undefined)
        handleRowChange(formData.rows.length - 1, "date", new Date().toISOString().split('T')[0])
        return
      }
    }

    const defaultDate = new Date().toISOString().split('T')[0]

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
          investigationIds: type === "package" ? [] : undefined
        }
      ]
    }))
    setCheckedRows((prev) => [...prev, true])
  }

  const removeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }))
    setCheckedRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function fetchStates(value) {
    // Mock state data based on country
    if (value === 1) { // India
      setStateData([
        { id: 1, stateName: "Maharashtra" },
        { id: 2, stateName: "Delhi" },
        { id: 3, stateName: "Karnataka" }
      ])
    } else {
      setStateData([])
    }
  }

  async function fetchDistrict(value) {
    // Mock district data based on state
    if (value === 1) { // Maharashtra
      setDistrictData([
        { id: 1, districtName: "Mumbai" },
        { id: 2, districtName: "Pune" },
        { id: 3, districtName: "Nagpur" }
      ])
    } else {
      setDistrictData([])
    }
  }

  async function fetchNokStates(value) {
    // Mock state data based on country
    if (value === 1) { // India
      setNokStateData([
        { id: 1, stateName: "Maharashtra" },
        { id: 2, stateName: "Delhi" },
        { id: 3, stateName: "Karnataka" }
      ])
    } else {
      setNokStateData([])
    }
  }

  async function fetchNokDistrict(value) {
    // Mock district data based on state
    if (value === 1) { // Maharashtra
      setNokDistrictData([
        { id: 1, districtName: "Mumbai" },
        { id: 2, districtName: "Pune" },
        { id: 3, districtName: "Nagpur" }
      ])
    } else {
      setNokDistrictData([])
    }
  }

  async function fetchPackagePrice(packName) {
    const packageData = packageItems.find(pkg => pkg.packName === packName)
    return packageData || null
  }

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

    formData.rows.forEach((row, index) => {
      if (!row.name || row.name.trim() === "") {
        newErrors[`row_${index}_name`] = `Row ${index + 1}: Investigation/Package name is required.`
        valid = false
      }
      if (!row.date || row.date.trim() === "") {
        newErrors[`row_${index}_date`] = `Row ${index + 1}: Date is required.`
        valid = false
      }
    })

    if (!formData.paymentMode) {
      newErrors.paymentMode = "Payment mode is required."
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (shouldNavigateToPayment = false) => {
    console.log("handleSubmit called with shouldNavigateToPayment:", shouldNavigateToPayment)
    const isFormValid = shouldNavigateToPayment ? true : validateForm()
    console.log("Form validation result:", isFormValid)

    if (isDuplicatePatient) {
      showPopup("Duplicate patient found!", "warning")
      return
    }

    if (isFormValid) {
      console.log("Form validation passed, proceeding with registration...")
      setLoading(true)

      setTimeout(() => {
        const selectedRows = formData.rows.filter((row, index) => checkedRows[index])
        const duplicateCheck = new Map()

        for (const row of selectedRows) {
          const key = `${row.type}_${row.itemId}_${row.date}`

          if (row.type === "package" && row.investigationIds) {
            for (const invId of row.investigationIds) {
              const invKey = `investigation_${invId}_${row.date}`
              if (duplicateCheck.has(invKey)) {
                showPopup(
                  DUPLICATE_INV_PACKAGE_WARN_MSG,
                  "Warning"
                )
                setLoading(false)
                return
              }
              duplicateCheck.set(invKey, row)
            }
          }

          if (duplicateCheck.has(key)) {
            showPopup(
              DUPLICATE_INV_PACKAGE_WARN_MSG,
              "Warning"
            )
            setLoading(false)
            return
          }
          duplicateCheck.set(key, row)
        }

        const paymentBreakdown = calculatePaymentBreakdown()
        const totalFinalAmount = parseFloat(paymentBreakdown.finalAmount)

        const patientId = Math.floor(Math.random() * 1000)

        if (shouldNavigateToPayment) {
          showPopup("Registration successful!", "success", false, () => {
            navigate("/payment", {
              state: {
                billingType: "Radiology Services",
                amount: totalFinalAmount,
                patientId,
                labData: { response: { patientId } },
                selectedItems: {
                  investigations: formData.rows.filter((i, idx) => i.type === "investigation" && i.itemId && checkedRows[idx]),
                  packages: formData.rows.filter((i, idx) => i.type === "package" && i.itemId && checkedRows[idx]),
                },
                paymentBreakdown,
              },
            })
          })
        } else {
          showPopup("Registration successful!", "success", false, () => handleReset())
        }
        setLoading(false)
      }, 1500)
    }
  }

  const handleReset = () => {
    setFormData({
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
      address1: undefined,
      address2: undefined,
      country: undefined,
      state: undefined,
      district: undefined,
      city: undefined,
      pinCode: undefined,
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
      emergencyFirstName: undefined,
      emergencyLastName: undefined,
      emergencyMobile: undefined,
      type: "investigation",
      rows: [
        {
          id: 1,
          name: "",
          date: new Date().toISOString().split('T')[0],
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
    setCheckedRows([true])
  }

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
    return <LoadingScreen />
  }

  const paymentBreakdown = calculatePaymentBreakdown()

  return (
    <div className="body d-flex py-3">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Pending for Radiology Billing</h3>
            </div>
          </div>
        </div>

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
                            type="text"
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
                                autoComplete="on"
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
                                              const currentRowDate = row.date || new Date().toISOString().split('T')[0]
                                              
                                              if (isInvestigationInSelectedPackages(item.investigationId, currentRowDate)) {
                                                showPopup(
                                                  DUPLICATE_INV_INCLUDE_PACKAGE,
                                                  "warning"
                                                )
                                                return
                                              }
                                              
                                              if (isInvestigationAlreadySelected(item.investigationId, currentRowDate)) {
                                                showPopup(
                                                  DUPLICATE_INV_INCLUDE_PACKAGE,
                                                  "warning"
                                                )
                                                return
                                              }
                                              if (item.price === null || item.price === 0 || item.price === "0") {
                                                showPopup("Price not configured for this investigation", "warning")
                                              } else {
                                                const hasDiscount = item.disc && item.disc > 0
                                                const displayPrice = item.price || 0
                                                const discountAmount = hasDiscount ? item.disc : 0
                                                const finalPrice = hasDiscount ? displayPrice - discountAmount : displayPrice

                                                handleRowChange(index, "name", item.investigationName)
                                                handleRowChange(index, "itemId", item.investigationId)
                                                handleRowChange(index, "originalAmount", displayPrice)
                                                handleRowChange(index, "discountAmount", discountAmount)
                                                handleRowChange(index, "netAmount", finalPrice)
                                                handleRowChange(index, "type", formData.type)
                                                setActiveRowIndex(null)
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
                                            const currentRowDate = row.date || new Date().toISOString().split('T')[0];
                                            
                                            // Check for duplicate package
                                            if (isPackageAlreadySelected(item.packageId, currentRowDate)) {
                                              showPopup(DUPLICATE_PACKAGE_WARN_MSG, "warning");
                                              return;
                                            }

                                            const priceDetails = await fetchPackagePrice(item.packName);
                                            if (!priceDetails || !priceDetails.actualCost) {
                                              showPopup("Price not configured for this package", "warning");
                                              return;
                                            }

                                            const investigationIds = await getInvestigationIdsFromPackage(item.packageId, item.packName);

                                            // Check if investigations in this package are already selected individually FOR THE SAME DATE
                                            const alreadySelectedInvestigations = [];
                                            investigationIds.forEach(invId => {
                                              if (isInvestigationAlreadySelected(invId, currentRowDate)) {
                                                const invItem = investigationItems.find(inv => inv.investigationId === invId);
                                                if (invItem) {
                                                  alreadySelectedInvestigations.push(invItem.investigationName);
                                                }
                                              }
                                            });

                                            if (alreadySelectedInvestigations.length > 0) {
                                              showPopup(
                                                `${DUPLICATE_PACKAGE_WRT_INV}\n\nDuplicate investigations: ${alreadySelectedInvestigations.join(', ')}`,
                                                "warning"
                                              );
                                              return;
                                            }

                                            // Check if investigations in this package are already in other packages FOR THE SAME DATE
                                            const alreadyInOtherPackage = [];
                                            investigationIds.forEach(invId => {
                                              if (isInvestigationInSelectedPackages(invId, currentRowDate)) {
                                                const containingPackage = formData.rows.find((row, idx) =>
                                                  checkedRows[idx] &&
                                                  row.type === "package" &&
                                                  row.investigationIds &&
                                                  row.investigationIds.includes(invId) &&
                                                  row.date === currentRowDate
                                                );
                                                if (containingPackage) {
                                                  const invItem = investigationItems.find(inv => inv.investigationId === invId);
                                                  if (invItem) {
                                                    alreadyInOtherPackage.push(`${invItem.investigationName} (in package: ${containingPackage.name})`);
                                                  }
                                                }
                                              }
                                            });

                                            if (alreadyInOtherPackage.length > 0) {
                                              showPopup(
                                                `${COMMON_INV_IN_PACKAGES}\n\nInvestigations already in packages: ${alreadyInOtherPackage.join(', ')}`,
                                                "warning"
                                              );
                                              return;
                                            }

                                            handleRowChange(index, "name", item.packName);
                                            handleRowChange(index, "itemId", item.packageId || priceDetails.packId);
                                            handleRowChange(index, "originalAmount", priceDetails.baseCost || priceDetails.actualCost);
                                            handleRowChange(index, "discountAmount", priceDetails.disc || 0);
                                            handleRowChange(index, "netAmount", priceDetails.actualCost);
                                            handleRowChange(index, "type", formData.type);
                                            handleRowChange(index, "investigationIds", investigationIds);
                                            setActiveRowIndex(null);
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
                <div className="row g-3 mb-4">
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
                          showPopup("Please fill all mandatory fields", "warning")
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

export default PendingForRadiologyBilling
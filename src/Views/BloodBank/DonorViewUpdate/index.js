import { useState, useEffect, useRef } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"

const DonorRegistrationViewUpdate = () => {
  const [currentView, setCurrentView] = useState("list")
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [donorList, setDonorList] = useState([
    {
      id: 1,
      donorUhid: "DON001",
      donorFn: "John",
      donorMn: "",
      donorLn: "Doe",
      donorMobileNumber: "9876543210",
      donorGenderId: "1",
      donorRelationId: "1",
      donorDob: "1990-01-15T00:00:00",
      donorBloodGroupId: "1",
      donorAddress1: "123 Main Street",
      donorAddress2: "Apt 4B",
      donorCountryId: "1",
      donorStateId: "1",
      donorDistrictId: "1",
      donorCity: "Mumbai",
      donorPincode: "400001",
      hemoglobin: "14.5",
      weight: "65.5",
      height: "175",
      bloodPressure: "120/80",
      pulse: "72",
      temperature: "36.8",
      screenResult: "pass",
      deferralType: "",
      deferralReason: "",
      regDate: "2024-01-15T10:30:00",
      createdBy: "Admin",
      donorStatus: "Active",
      status: "a",
      previousScreenings: [
        {
          id: 1,
          screeningDate: "2024-01-15",
          hemoglobin: "14.2",
          weight: "65.0",
          height: "175",
          bloodPressure: "118/78",
          pulse: "70",
          temperature: "36.6",
          screenResult: "pass",
          deferralType: "",
          deferralReason: "",
          conductedBy: "rakesh"
        },
        {
          id: 2,
          screeningDate: "2024-06-20",
          hemoglobin: "14.8",
          weight: "66.0",
          height: "175",
          bloodPressure: "122/82",
          pulse: "72",
          temperature: "36.7",
          screenResult: "pass",
          deferralType: "",
          deferralReason: "",
          conductedBy: "Rajesh"
        }
      ]
    },
    {
      id: 2,
      donorUhid: "DON002",
      donorFn: "Jane",
      donorMn: "Marie",
      donorLn: "Smith",
      donorMobileNumber: "9876543211",
      donorGenderId: "2",
      donorRelationId: "2",
      donorDob: "1985-05-20T00:00:00",
      donorBloodGroupId: "2",
      donorAddress1: "456 Oak Avenue",
      donorAddress2: "",
      donorCountryId: "1",
      donorStateId: "2",
      donorDistrictId: "2",
      donorCity: "Delhi",
      donorPincode: "110001",
      hemoglobin: "13.2",
      weight: "58.0",
      height: "162",
      bloodPressure: "118/76",
      pulse: "68",
      temperature: "36.5",
      screenResult: "fail",
      deferralType: "temporary",
      deferralReason: "Low hemoglobin level",
      regDate: "2024-01-16T14:20:00",
      createdBy: "Admin",
      donorStatus: "Active",
      status: "s",
      previousScreenings: [
        {
          id: 1,
          screeningDate: "2024-01-16",
          hemoglobin: "13.0",
          weight: "58.0",
          height: "162",
          bloodPressure: "118/76",
          pulse: "68",
          temperature: "36.5",
          screenResult: "fail",
          deferralType: "temporary",
          deferralReason: "Low hemoglobin level",
          conductedBy: "Abrar"
        }
      ],
       previousScreenings: [
        {
          id: 1,
          screeningDate: "2024-01-15",
          hemoglobin: "14.2",
          weight: "65.0",
          height: "175",
          bloodPressure: "118/78",
          pulse: "70",
          temperature: "36.6",
          screenResult: "pass",
          deferralType: "",
          deferralReason: "",
          conductedBy: "rakesh"
        },
        {
          id: 2,
          screeningDate: "2024-06-20",
          hemoglobin: "14.8",
          weight: "66.0",
          height: "175",
          bloodPressure: "122/82",
          pulse: "72",
          temperature: "36.7",
          screenResult: "pass",
          deferralType: "",
          deferralReason: "",
          conductedBy: "Dr. Raju"
        }
      ]
    },
    {
      id: 3,
      donorUhid: "DON003",
      donorFn: "Robert",
      donorMn: "",
      donorLn: "Johnson",
      donorMobileNumber: "9876543212",
      donorGenderId: "1",
      donorRelationId: "1",
      donorDob: "1988-08-10T00:00:00",
      donorBloodGroupId: "5",
      donorAddress1: "789 Park Lane",
      donorAddress2: "",
      donorCountryId: "1",
      donorStateId: "3",
      donorDistrictId: "1",
      donorCity: "Bangalore",
      donorPincode: "560001",
      hemoglobin: "15.0",
      weight: "70.0",
      height: "180",
      bloodPressure: "125/85",
      pulse: "75",
      temperature: "37.0",
      screenResult: "pass",
      deferralType: "",
      deferralReason: "",
      regDate: "2024-01-17T09:15:00",
      createdBy: "Admin",
      donorStatus: "Active",
      status: "a",
      previousScreenings: [
        {
          id: 1,
          screeningDate: "2024-01-17",
          hemoglobin: "14.9",
          weight: "69.5",
          height: "180",
          bloodPressure: "124/84",
          pulse: "74",
          temperature: "36.9",
          screenResult: "pass",
          deferralType: "",
          deferralReason: "",
          conductedBy: "ramesh"
        },
        {
          id: 2,
          screeningDate: "2024-07-10",
          hemoglobin: "15.2",
          weight: "70.5",
          height: "180",
          bloodPressure: "126/86",
          pulse: "76",
          temperature: "37.0",
          screenResult: "pass",
          deferralType: "",
          deferralReason: "",
          conductedBy: "Nikita"
        },
        {
          id: 3,
          screeningDate: "2024-12-05",
          hemoglobin: "14.7",
          weight: "71.0",
          height: "180",
          bloodPressure: "124/82",
          pulse: "74",
          temperature: "36.8",
          screenResult: "pass",
          deferralType: "",
          deferralReason: "",
          conductedBy: "rajesh"
        }
      ]
    }
  ])

  const [filteredDonorList, setFilteredDonorList] = useState([])
  const [genderData] = useState([
    { id: "1", genderName: "Male" },
    { id: "2", genderName: "Female" },
    { id: "3", genderName: "Other" }
  ])
  const [relationData] = useState([
    { id: "1", relationName: "Self" },
    { id: "2", relationName: "Spouse" },
    { id: "3", relationName: "Child" },
    { id: "4", relationName: "Parent" }
  ])
  const [bloodGroupData] = useState([
    { id: "1", bloodGroupName: "A+" },
    { id: "2", bloodGroupName: "A-" },
    { id: "3", bloodGroupName: "B+" },
    { id: "4", bloodGroupName: "B-" },
    { id: "5", bloodGroupName: "O+" },
    { id: "6", bloodGroupName: "O-" },
    { id: "7", bloodGroupName: "AB+" },
    { id: "8", bloodGroupName: "AB-" }
  ])
  const [countryData] = useState([
    { id: "1", countryName: "India" },
    { id: "2", countryName: "USA" },
    { id: "3", countryName: "UK" }
  ])
  const [stateData, setStateData] = useState([])
  const [districtData, setDistrictData] = useState([])
  const [popupMessage, setPopupMessage] = useState(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    mobileNo: "",
    gender: "",
    relation: "",
    dob: "",
    bloodGroup: "",
    address1: "",
    address2: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
    hemoglobin: "",
    weight: "",
    height: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    screenResult: "",
    deferralType: "",
    deferralReason: ""
  })

  const [newScreening, setNewScreening] = useState({
    screeningDate: "",
    hemoglobin: "",
    weight: "",
    height: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    screenResult: "",
    deferralType: "",
    deferralReason: "",
    conductedBy: ""
  })

  const [errors, setErrors] = useState({})
  const [newScreeningErrors, setNewScreeningErrors] = useState({})

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      }
    })
  }

  useEffect(() => {
    setCurrentPage(1);

    if (!searchQuery.trim()) {
      setFilteredDonorList(donorList);
      return;
    }

    const query = searchQuery.trim();
    const filtered = donorList.filter(item =>
      item.donorMobileNumber?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredDonorList(filtered);
  }, [searchQuery, donorList]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredDonorList(donorList);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.trim();
    const filtered = donorList.filter(item =>
      item.donorMobileNumber?.includes(query)
    );

    setFilteredDonorList(filtered);
    setCurrentPage(1);
  }

  const handleShowAll = () => {
    setSearchQuery("");
    setFilteredDonorList(donorList);
    setCurrentPage(1);
  }

  const handleEditClick = (record, e) => {
    e.stopPropagation()
    setSelectedRecord(record)

    if (record.donorCountryId === "1") {
      setStateData([
        { id: "1", stateName: "Maharashtra" },
        { id: "2", stateName: "Delhi" },
        { id: "3", stateName: "Karnataka" },
        { id: "4", stateName: "Gujarat" },
        { id: "5", stateName: "Tamil Nadu" }
      ])
    } else {
      setStateData([])
    }

    if (record.donorStateId === "1") {
      setDistrictData([
        { id: "1", districtName: "Mumbai" },
        { id: "2", districtName: "Pune" },
        { id: "3", districtName: "Nagpur" }
      ])
    } else if (record.donorStateId === "2") {
      setDistrictData([
        { id: "1", districtName: "New Delhi" },
        { id: "2", districtName: "South Delhi" },
        { id: "3", districtName: "North Delhi" }
      ])
    } else if (record.donorStateId === "3") {
      setDistrictData([
        { id: "1", districtName: "Bangalore Urban" },
        { id: "2", districtName: "Mysore" }
      ])
    } else {
      setDistrictData([])
    }

    setFormData({
      firstName: record.donorFn || "",
      middleName: record.donorMn || "",
      lastName: record.donorLn || "",
      mobileNo: record.donorMobileNumber || "",
      gender: record.donorGenderId || "",
      relation: record.donorRelationId || "",
      dob: record.donorDob ? record.donorDob.split("T")[0] : "",
      bloodGroup: record.donorBloodGroupId || "",
      address1: record.donorAddress1 || "",
      address2: record.donorAddress2 || "",
      country: record.donorCountryId || "",
      state: record.donorStateId || "",
      district: record.donorDistrictId || "",
      city: record.donorCity || "",
      pinCode: record.donorPincode || "",
      hemoglobin: record.hemoglobin || "",
      weight: record.weight || "",
      height: record.height || "",
      bloodPressure: record.bloodPressure || "",
      pulse: record.pulse || "",
      temperature: record.temperature || "",
      screenResult: record.screenResult || "",
      deferralType: record.deferralType || "",
      deferralReason: record.deferralReason || ""
    })

    setNewScreening({
      screeningDate: new Date().toISOString().split("T")[0],
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: "",
      conductedBy: ""
    })

    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      mobileNo: "",
      gender: "",
      relation: "",
      dob: "",
      bloodGroup: "",
      address1: "",
      address2: "",
      country: "",
      state: "",
      district: "",
      city: "",
      pinCode: "",
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: ""
    })
    setNewScreening({
      screeningDate: "",
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: "",
      conductedBy: ""
    })
    setErrors({})
    setNewScreeningErrors({})
    setStateData([])
    setDistrictData([])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedForm = { ...formData, [name]: value }

    if (name === "screenResult") {
      if (value === "pass") {
        updatedForm.deferralType = ""
        updatedForm.deferralReason = ""
      }
    }

    if (name === "country") {
      if (value === "1") {
        setStateData([
          { id: "1", stateName: "Maharashtra" },
          { id: "2", stateName: "Delhi" },
          { id: "3", stateName: "Karnataka" },
          { id: "4", stateName: "Gujarat" },
          { id: "5", stateName: "Tamil Nadu" }
        ])
      } else {
        setStateData([])
      }
      updatedForm.state = ""
      updatedForm.district = ""
      setDistrictData([])
    }

    if (name === "state") {
      if (value === "1") {
        setDistrictData([
          { id: "1", districtName: "Mumbai" },
          { id: "2", districtName: "Pune" },
          { id: "3", districtName: "Nagpur" }
        ])
      } else if (value === "2") {
        setDistrictData([
          { id: "1", districtName: "New Delhi" },
          { id: "2", districtName: "South Delhi" },
          { id: "3", districtName: "North Delhi" }
        ])
      } else if (value === "3") {
        setDistrictData([
          { id: "1", districtName: "Bangalore Urban" },
          { id: "2", districtName: "Mysore" }
        ])
      } else {
        setDistrictData([])
      }
      updatedForm.district = ""
    }

    setFormData(updatedForm)
    setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleNewScreeningChange = (e) => {
    const { name, value } = e.target
    const updatedScreening = { ...newScreening, [name]: value }

    if (name === "screenResult") {
      if (value === "pass") {
        updatedScreening.deferralType = ""
        updatedScreening.deferralReason = ""
      }
    }

    setNewScreening(updatedScreening)
    setNewScreeningErrors(prev => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required"
    if (!formData.mobileNo.trim()) newErrors.mobileNo = "Mobile number is required"
    else if (!/^\d{10}$/.test(formData.mobileNo)) newErrors.mobileNo = "Must be 10 digits"

    if (!formData.gender) newErrors.gender = "Gender is required"
    if (!formData.relation) newErrors.relation = "Relation is required"
    if (!formData.dob) newErrors.dob = "Date of Birth is required"
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood Group is required"

    if (!formData.address1.trim()) newErrors.address1 = "Address 1 is required"
    if (!formData.country) newErrors.country = "Country is required"
    if (!formData.state) newErrors.state = "State is required"
    if (!formData.district) newErrors.district = "District is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.pinCode.trim()) newErrors.pinCode = "Pin Code is required"
    else if (!/^\d{6}$/.test(formData.pinCode)) newErrors.pinCode = "Must be 6 digits"

    if (!formData.hemoglobin.trim()) newErrors.hemoglobin = "Hemoglobin is required"
    if (!formData.weight.trim()) newErrors.weight = "Weight is required"
    if (!formData.height.trim()) newErrors.height = "Height is required"
    if (!formData.bloodPressure.trim()) newErrors.bloodPressure = "Blood Pressure is required"
    else if (!/^\d{2,3}\/\d{2,3}$/.test(formData.bloodPressure)) newErrors.bloodPressure = "Format: 120/80"
    if (!formData.pulse.trim()) newErrors.pulse = "Pulse is required"
    if (!formData.temperature.trim()) newErrors.temperature = "Temperature is required"

    if (!formData.screenResult) {
      newErrors.screenResult = "Screen Result is required"
    }

    if (formData.screenResult === "fail") {
      if (!formData.deferralType.trim()) {
        newErrors.deferralType = "Deferral Type is required when screen fails"
      }
      if (!formData.deferralReason.trim()) {
        newErrors.deferralReason = "Deferral Reason is required when screen fails"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateNewScreening = () => {
    const newErrors = {}

    if (!newScreening.screeningDate) newErrors.screeningDate = "Screening Date is required"
    if (!newScreening.hemoglobin) newErrors.hemoglobin = "Hemoglobin is required"
    if (!newScreening.weight) newErrors.weight = "Weight is required"
    if (!newScreening.height) newErrors.height = "Height is required"
    if (!newScreening.bloodPressure) newErrors.bloodPressure = "Blood Pressure is required"
    else if (!/^\d{2,3}\/\d{2,3}$/.test(newScreening.bloodPressure)) newErrors.bloodPressure = "Format: 120/80"
    if (!newScreening.pulse) newErrors.pulse = "Pulse is required"
    if (!newScreening.temperature) newErrors.temperature = "Temperature is required"
    if (!newScreening.screenResult) newErrors.screenResult = "Screen Result is required"
    if (!newScreening.conductedBy) newErrors.conductedBy = "Conducted By is required"

    if (newScreening.screenResult === "fail") {
      if (!newScreening.deferralType) {
        newErrors.deferralType = "Deferral Type is required when screen fails"
      }
      if (!newScreening.deferralReason) {
        newErrors.deferralReason = "Deferral Reason is required when screen fails"
      }
    }

    setNewScreeningErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddNewScreening = () => {
    if (!validateNewScreening()) {
      showPopup("Please fill all mandatory fields for new screening", "warning")
      return
    }

    const updatedDonorList = donorList.map(donor => {
      if (donor.id === selectedRecord.id) {
        const updatedScreenings = [...(donor.previousScreenings || []), {
          id: Date.now(),
          screeningDate: newScreening.screeningDate,
          hemoglobin: newScreening.hemoglobin,
          weight: newScreening.weight,
          height: newScreening.height,
          bloodPressure: newScreening.bloodPressure,
          pulse: newScreening.pulse,
          temperature: newScreening.temperature,
          screenResult: newScreening.screenResult,
          deferralType: newScreening.deferralType,
          deferralReason: newScreening.deferralReason,
          conductedBy: newScreening.conductedBy
        }]

        return {
          ...donor,
          previousScreenings: updatedScreenings,
          hemoglobin: newScreening.hemoglobin,
          weight: newScreening.weight,
          height: newScreening.height,
          bloodPressure: newScreening.bloodPressure,
          pulse: newScreening.pulse,
          temperature: newScreening.temperature,
          screenResult: newScreening.screenResult,
          deferralType: newScreening.deferralType,
          deferralReason: newScreening.deferralReason
        }
      }
      return donor
    })

    setDonorList(updatedDonorList)
    setFilteredDonorList(updatedDonorList)

    const updatedSelectedRecord = updatedDonorList.find(d => d.id === selectedRecord.id)
    setSelectedRecord(updatedSelectedRecord)

    setFormData({
      ...formData,
      hemoglobin: newScreening.hemoglobin,
      weight: newScreening.weight,
      height: newScreening.height,
      bloodPressure: newScreening.bloodPressure,
      pulse: newScreening.pulse,
      temperature: newScreening.temperature,
      screenResult: newScreening.screenResult,
      deferralType: newScreening.deferralType,
      deferralReason: newScreening.deferralReason
    })

    setNewScreening({
      screeningDate: new Date().toISOString().split("T")[0],
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: "",
      conductedBy: ""
    })

    showPopup("New screening added successfully!", "success")
  }

  const handleUpdate = async () => {
    if (!validateForm()) {
      showPopup("Please fill all mandatory fields", "warning")
      return
    }

    try {
      setLoading(true)

      const updatedDonorList = donorList.map(donor => {
        if (donor.id === selectedRecord.id) {
          return {
            ...donor,
            donorFn: formData.firstName,
            donorMn: formData.middleName,
            donorLn: formData.lastName,
            donorMobileNumber: formData.mobileNo,
            donorGenderId: formData.gender,
            donorRelationId: formData.relation,
            donorDob: formData.dob + "T00:00:00",
            donorBloodGroupId: formData.bloodGroup,
            donorAddress1: formData.address1,
            donorAddress2: formData.address2,
            donorCountryId: formData.country,
            donorStateId: formData.state,
            donorDistrictId: formData.district,
            donorCity: formData.city,
            donorPincode: formData.pinCode,
            hemoglobin: formData.hemoglobin,
            weight: formData.weight,
            height: formData.height,
            bloodPressure: formData.bloodPressure,
            pulse: formData.pulse,
            temperature: formData.temperature,
            screenResult: formData.screenResult,
            deferralType: formData.deferralType,
            deferralReason: formData.deferralReason
          }
        }
        return donor
      })

      setDonorList(updatedDonorList)
      setFilteredDonorList(updatedDonorList)

      showPopup("Donor updated successfully!", "success", () => {
        handleBackToList()
      })
    } catch (error) {
      console.error("Error:", error)
      showPopup("An error occurred", "error")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    return dateStr.split("T")[0]
  }

  const getStatusBadge = (screenResult) => {
    if (screenResult === "pass") {
      return <span className="badge bg-success">Passed</span>
    } else if (screenResult === "fail") {
      return <span className="badge bg-danger">Failed</span>
    }
    return <span className="badge bg-secondary">Not Screened</span>
  }

  const getApprovalStatusBadge = (status) => {
    switch (status) {
      case "a":
        return <span className="badge bg-success">Approved</span>
      case "s":
        return <span className="badge bg-info">Saved</span>
      case "p":
        return <span className="badge bg-warning text-dark">Pending</span>
      case "r":
        return <span className="badge bg-danger">Rejected</span>
      default:
        return <span className="badge bg-secondary">Unknown</span>
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (currentView === "detail") {
    const allScreenings = selectedRecord?.previousScreenings || []

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
                <h4 className="card-title p-2 mb-0">View And Edit Donor Registration</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Donor Basic Info Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Donor ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.donorUhid || "N/A"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Registration Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedRecord?.regDate) || "N/A"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Screening Result</label>
                    <div className="form-control" >
                      {getStatusBadge(selectedRecord?.screenResult)}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Registered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.createdBy || "N/A"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3 mt-3">
                    <label className="form-label fw-bold">Status</label>
                    <div className="form-control" >
                      {getApprovalStatusBadge(selectedRecord?.status)}
                    </div>
                  </div>
                </div>

                {/* Personal Details Card */}
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Personal Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">First Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Enter First Name"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Middle Name</label>
                        <input
                          type="text"
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter Middle Name"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Last Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                          placeholder="Enter Last Name"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mobile No. <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.mobileNo ? "is-invalid" : ""}`}
                          name="mobileNo"
                          value={formData.mobileNo}
                          maxLength={10}
                          onChange={handleChange}
                          placeholder="Enter Mobile Number"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {errors.mobileNo && <div className="invalid-feedback">{errors.mobileNo}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Gender <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        >
                          <option value="">Select Gender</option>
                          {genderData.map(gender => (
                            <option key={gender.id} value={gender.id}>{gender.genderName}</option>
                          ))}
                        </select>
                        {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Relation <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                          name="relation"
                          value={formData.relation}
                          onChange={handleChange}
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        >
                          <option value="">Select Relation</option>
                          {relationData.map(relation => (
                            <option key={relation.id} value={relation.id}>{relation.relationName}</option>
                          ))}
                        </select>
                        {errors.relation && <div className="invalid-feedback">{errors.relation}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          name="dob"
                          className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                          value={formData.dob}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={handleChange}
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {errors.dob && <div className="invalid-feedback">{errors.dob}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Blood Group <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.bloodGroup ? "is-invalid" : ""}`}
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        >
                          <option value="">Select Blood Group</option>
                          {bloodGroupData.map(bloodGroup => (
                            <option key={bloodGroup.id} value={bloodGroup.id}>{bloodGroup.bloodGroupName}</option>
                          ))}
                        </select>
                        {errors.bloodGroup && <div className="invalid-feedback">{errors.bloodGroup}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Details Card */}
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Address Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Address 1 <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.address1 ? "is-invalid" : ""}`}
                          name="address1"
                          value={formData.address1}
                          onChange={handleChange}
                          placeholder="Enter Address 1"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {errors.address1 && <div className="invalid-feedback">{errors.address1}</div>}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Address 2</label>
                        <input
                          type="text"
                          className="form-control"
                          name="address2"
                          value={formData.address2}
                          onChange={handleChange}
                          placeholder="Enter Address 2"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Country <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.country ? "is-invalid" : ""}`}
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        >
                          <option value="">Select Country</option>
                          {countryData.map(country => (
                            <option key={country.id} value={country.id}>{country.countryName}</option>
                          ))}
                        </select>
                        {errors.country && <div className="invalid-feedback">{errors.country}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.state ? "is-invalid" : ""}`}
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          disabled={!formData.country || selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        >
                          <option value="">Select State</option>
                          {stateData.map(state => (
                            <option key={state.id} value={state.id}>{state.stateName}</option>
                          ))}
                        </select>
                        {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">District <span className="text-danger">*</span></label>
                        <select
                          className={`form-select ${errors.district ? "is-invalid" : ""}`}
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          disabled={!formData.state || selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        >
                          <option value="">Select District</option>
                          {districtData.map(district => (
                            <option key={district.id} value={district.id}>{district.districtName}</option>
                          ))}
                        </select>
                        {errors.district && <div className="invalid-feedback">{errors.district}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">City <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.city ? "is-invalid" : ""}`}
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter City"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Pin Code <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.pinCode ? "is-invalid" : ""}`}
                          name="pinCode"
                          value={formData.pinCode}
                          maxLength={6}
                          onChange={handleChange}
                          placeholder="Enter Pin Code"
                          readOnly={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {errors.pinCode && <div className="invalid-feedback">{errors.pinCode}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Screenings Table */}
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Previous Screenings</h6>
                  </div>
                  <div className="card-body">
                    {allScreenings.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                          <thead >
                            <tr>
                              <th>Screening Date</th>
                              <th>Hb (g/dL)</th>
                              <th>Weight (kg)</th>
                              <th>Height (cm)</th>
                              <th>BP</th>
                              <th>Pulse</th>
                              <th>Temp (°C)</th>
                              <th>Result</th>
                              <th>Deferral Type</th>
                              <th>Deferral Reason</th>
                              <th>Conducted By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allScreenings.map((screening, index) => (
                              <tr key={screening.id || index}>
                                <td>{screening.screeningDate}</td>
                                <td>{screening.hemoglobin}</td>
                                <td>{screening.weight}</td>
                                <td>{screening.height}</td>
                                <td>{screening.bloodPressure}</td>
                                <td>{screening.pulse}</td>
                                <td>{screening.temperature}</td>
                                <td>{getStatusBadge(screening.screenResult)}</td>
                                <td>{screening.deferralType || "—"}</td>
                                <td>{screening.deferralReason || "—"}</td>
                                <td>{screening.conductedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted text-center py-3">No previous screenings found</div>
                    )}
                  </div>
                </div>

                {/* Add New Screening Section */}
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Add New Screening</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label className="form-label">Screening Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          name="screeningDate"
                          className={`form-control ${newScreeningErrors.screeningDate ? "is-invalid" : ""}`}
                          value={newScreening.screeningDate}
                          onChange={handleNewScreeningChange}
                          max={new Date().toISOString().split("T")[0]}
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.screeningDate && <div className="invalid-feedback">{newScreeningErrors.screeningDate}</div>}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Hemoglobin (g/dL) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          name="hemoglobin"
                          className={`form-control ${newScreeningErrors.hemoglobin ? "is-invalid" : ""}`}
                          value={newScreening.hemoglobin}
                          onChange={handleNewScreeningChange}
                          placeholder="Enter Hemoglobin"
                          step="0.1"
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.hemoglobin && <div className="invalid-feedback">{newScreeningErrors.hemoglobin}</div>}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Weight (kg) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          name="weight"
                          className={`form-control ${newScreeningErrors.weight ? "is-invalid" : ""}`}
                          value={newScreening.weight}
                          onChange={handleNewScreeningChange}
                          placeholder="Enter Weight"
                          step="0.1"
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.weight && <div className="invalid-feedback">{newScreeningErrors.weight}</div>}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Height (cm) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          name="height"
                          className={`form-control ${newScreeningErrors.height ? "is-invalid" : ""}`}
                          value={newScreening.height}
                          onChange={handleNewScreeningChange}
                          placeholder="Enter Height"
                          step="0.1"
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.height && <div className="invalid-feedback">{newScreeningErrors.height}</div>}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Blood Pressure <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          name="bloodPressure"
                          className={`form-control ${newScreeningErrors.bloodPressure ? "is-invalid" : ""}`}
                          value={newScreening.bloodPressure}
                          onChange={handleNewScreeningChange}
                          placeholder="120/80"
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.bloodPressure && <div className="invalid-feedback">{newScreeningErrors.bloodPressure}</div>}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Pulse Rate (bpm) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          name="pulse"
                          className={`form-control ${newScreeningErrors.pulse ? "is-invalid" : ""}`}
                          value={newScreening.pulse}
                          onChange={handleNewScreeningChange}
                          placeholder="Enter Pulse Rate"
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.pulse && <div className="invalid-feedback">{newScreeningErrors.pulse}</div>}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Temperature (°C) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          name="temperature"
                          className={`form-control ${newScreeningErrors.temperature ? "is-invalid" : ""}`}
                          value={newScreening.temperature}
                          onChange={handleNewScreeningChange}
                          placeholder="Enter Temperature"
                          step="0.1"
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.temperature && <div className="invalid-feedback">{newScreeningErrors.temperature}</div>}
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Conducted By <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          name="conductedBy"
                          className={`form-control ${newScreeningErrors.conductedBy ? "is-invalid" : ""}`}
                          value={newScreening.conductedBy}
                          onChange={handleNewScreeningChange}
                          placeholder="Enter name"
                          disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.conductedBy && <div className="invalid-feedback">{newScreeningErrors.conductedBy}</div>}
                      </div>
                    </div>

                    <div className="row g-3 mt-2">
                      <div className="col-md-4">
                        <label className="form-label">Screen Result <span className="text-danger">*</span></label>
                        <div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="screenResult"
                              id="newScreenPass"
                              value="pass"
                              checked={newScreening.screenResult === "pass"}
                              onChange={handleNewScreeningChange}
                              disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            <label className="form-check-label" htmlFor="newScreenPass">
                              Pass
                            </label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="screenResult"
                              id="newScreenFail"
                              value="fail"
                              checked={newScreening.screenResult === "fail"}
                              onChange={handleNewScreeningChange}
                              disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            <label className="form-check-label" htmlFor="newScreenFail">
                              Fail
                            </label>
                          </div>
                        </div>
                        {newScreeningErrors.screenResult && <div className="text-danger small mt-1">{newScreeningErrors.screenResult}</div>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Deferral Type</label>
                        <div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="deferralType"
                              id="newDeferralTemporary"
                              value="temporary"
                              checked={newScreening.deferralType === "temporary"}
                              onChange={handleNewScreeningChange}
                              disabled={newScreening.screenResult === "pass" || selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            <label className="form-check-label" htmlFor="newDeferralTemporary">
                              Temporary
                            </label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="deferralType"
                              id="newDeferralPermanent"
                              value="permanent"
                              checked={newScreening.deferralType === "permanent"}
                              onChange={handleNewScreeningChange}
                              disabled={newScreening.screenResult === "pass" || selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                            />
                            <label className="form-check-label" htmlFor="newDeferralPermanent">
                              Permanent
                            </label>
                          </div>
                        </div>
                        {newScreeningErrors.deferralType && <div className="text-danger small mt-1">{newScreeningErrors.deferralType}</div>}
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Deferral Reason</label>
                        <textarea
                          className={`form-control ${newScreeningErrors.deferralReason ? "is-invalid" : ""}`}
                          name="deferralReason"
                          value={newScreening.deferralReason}
                          onChange={handleNewScreeningChange}
                          placeholder="Enter deferral reason"
                          rows="2"
                          disabled={newScreening.screenResult === "pass" || selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                        />
                        {newScreeningErrors.deferralReason && <div className="invalid-feedback">{newScreeningErrors.deferralReason}</div>}
                      </div>
                    </div>

                    <div className="mt-3 d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleAddNewScreening}
                        disabled={selectedRecord?.status === "a" || selectedRecord?.status === "p"}
                      >
                        <i className="fa fa-plus me-2"></i>
                        Add Screening
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {(selectedRecord?.status === "s" || selectedRecord?.status === "r") && (
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleUpdate}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-save me-2"></i>
                          Update Donor
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleBackToList}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List View
  const filteredDonors = filteredDonorList.filter(donor => {
    if (!fromDate || !toDate) return true;
    const donorDate = new Date(donor.regDate);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return donorDate >= from && donorDate <= to;
  });

  const totalPages = Math.ceil(filteredDonors.length / DEFAULT_ITEMS_PER_PAGE);
  const currentItems = filteredDonors.slice(
    (currentPage - 1) * DEFAULT_ITEMS_PER_PAGE,
    currentPage * DEFAULT_ITEMS_PER_PAGE
  );

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">Donor Registration View & Update</h4>
              <div className="d-flex justify-content-between align-items-center">
                  <>
                    <form className="d-inline-block searchform me-4" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search by Phone Number"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                  </>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead >
                    <tr>
                      <th>Donor ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Gender</th>
                      <th>Blood Group</th>
                      <th>Registration Date</th>
                      <th>Screening Result</th>
                      <th>Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center">No donors found.</td>
                      </tr>
                    ) : (
                      currentItems.map((donor) => (
                        <tr key={donor.id}>
                          <td>{donor.donorUhid || "N/A"}</td>
                          <td>{`${donor.donorFn || ""} ${donor.donorMn || ""} ${donor.donorLn || ""}`.trim()}</td>
                          <td>{donor.donorMobileNumber || "N/A"}</td>
                          <td>
                            {genderData.find(g => g.id === donor.donorGenderId)?.genderName || "N/A"}
                          </td>
                          <td>
                            {bloodGroupData.find(bg => bg.id === donor.donorBloodGroupId)?.bloodGroupName || "N/A"}
                          </td>
                          <td>{formatDate(donor.regDate)}</td>
                          <td>{getStatusBadge(donor.screenResult)}</td>
                          <td>{getApprovalStatusBadge(donor.status)}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={(e) => handleEditClick(donor, e)} 
                              title={donor.status === "s" || donor.status === "r" ? "Edit Donor" : "View Donor"}
                            >
                              <i className={donor.status === "s" || donor.status === "r" ? "fa fa-pencil" : "fa fa-eye"}></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={filteredDonors.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DonorRegistrationViewUpdate
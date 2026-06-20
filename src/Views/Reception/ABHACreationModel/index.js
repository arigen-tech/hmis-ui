// components/ABHACreationModal.jsx
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { integrationService } from "../../../service/integrationService";
import { isValidAadhaarNumber } from "../../../utils/ABDMValidations";

const ABHACreationModal = ({ 
  show, 
  onClose, 
  onSuccess, 
  patientData = {},
  genderData = [],
  stateData = [],
  districtData = [],
}) => {
  const [currentTab, setCurrentTab] = useState(1);
  const [aadhaarData, setAadhaarData] = useState({
    aadhaarNo: patientData.aadhaarNo || "",
    consentName: patientData.consentName || "",
    mobileNumber: patientData.mobileNo || "",
  });
  
  // Consent state - 7 consents as per ABHA requirements
  const [consents, setConsents] = useState({
    consent1: false,
    consent2: false,
    consent3: false,
    consent4: false,
    consent5: false,
    consent6: false,
    consent7: false,
  });
  
  // Consent checkbox refs for individual selection
  const [selectAll, setSelectAll] = useState(false);
  
  const [captcha, setCaptcha] = useState({
    question: "",
    answer: "",
    userInput: "",
    captchaId: "",
  });
  
  // Tab 2: OTP Verification
  const [otpData, setOtpData] = useState({
    otp: "",
    mobileNumber: "",
    txnId: "",
    isType: "",
    xtoken: "",
  });
  
  // Tab 3: ABHA Address / Existing ABHA Display
  const [abhaAddress, setAbhaAddress] = useState("");
  const [abhaNumber, setAbhaNumber] = useState("");
  const [existingAbhaProfile, setExistingAbhaProfile] = useState(null);
  const [isExistingAbha, setIsExistingAbha] = useState(false);
  const [isCreatingAbha, setIsCreatingAbha] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState({
    sendOtp: false,
    verifyOtp: false,
    createAbha: false,
    fetchAbhaDetails: false,
  });
  
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);
  
  useEffect(() => {
    if (show) {
      setCurrentTab(1);
      generateCaptcha();
      if (patientData) {
        setAadhaarData(prev => ({
          ...prev,
          consentName: patientData.consentName || patientData.firstName || "",
          mobileNumber: patientData.mobileNo || "",
        }));
      }
      setConsents({
        consent1: false,
        consent2: false,
        consent3: false,
        consent4: false,
        consent5: false,
        consent6: false,
        consent7: false,
      });
      setSelectAll(false);
      setExistingAbhaProfile(null);
      setIsExistingAbha(false);
      setAbhaNumber("");
      setAbhaAddress("");
      setIsCreatingAbha(false);
    }
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [show, patientData]);
  
  const generateCaptcha = async () => {
    try {
      const response = await integrationService.generateAbdmCaptcha();
      if (response?.status !== false) {
        setCaptcha({
          question: response?.response?.question || "",
          answer: response?.response?.answer || "",
          userInput: "",
          captchaId: response?.response?.captchaId || "",
        });
      } else {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        let answer;
        switch(operator) {
          case '+': answer = num1 + num2; break;
          case '-': answer = num1 - num2; break;
          case '*': answer = num1 * num2; break;
          default: answer = num1 + num2;
        }
        setCaptcha({
          question: `${num1} ${operator} ${num2} = ?`,
          answer: String(answer),
          userInput: "",
          captchaId: "demo_" + Date.now(),
        });
      }
    } catch (error) {
      console.error("Error generating captcha:", error);
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      setCaptcha({
        question: `${num1} + ${num2} = ?`,
        answer: String(num1 + num2),
        userInput: "",
        captchaId: "demo_" + Date.now(),
      });
    }
  };
  
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setConsents({
      consent1: checked,
      consent2: checked,
      consent3: checked,
      consent4: checked,
      consent5: checked,
      consent6: checked,
      consent7: checked,
    });
  };
  
  const handleConsentChange = (e) => {
    const { name, checked } = e.target;
    setConsents(prev => {
      const newConsents = { ...prev, [name]: checked };
      const allChecked = Object.values(newConsents).every(val => val === true);
      setSelectAll(allChecked);
      return newConsents;
    });
  };
  
  const handleAadhaarChange = (e) => {
    const { name, value } = e.target;
    if (name === "aadhaarNo") {
      const numericValue = value.replace(/\D/g, "").slice(0, 12);
      setAadhaarData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === "mobileNumber") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setAadhaarData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setAadhaarData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle OTP input change
  const handleOtpChange = (e) => {
    const { name, value } = e.target;
    if (name === "otp") {
      const numericValue = value.replace(/\D/g, "").slice(0, 6);
      setOtpData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setOtpData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Validate Tab 1
  const validateTab1 = () => {
    if (!aadhaarData.consentName.trim()) {
      Swal.fire("Validation Error", "Please enter your full name as per Aadhaar.", "warning");
      return false;
    }
    if (!isValidAadhaarNumber(aadhaarData.aadhaarNo)) {
      Swal.fire("Validation Error", "Please enter a valid 12-digit Aadhaar number.", "warning");
      return false;
    }
    if (!captcha.userInput || captcha.userInput !== captcha.answer) {
      Swal.fire("Validation Error", "Please enter the correct captcha answer.", "warning");
      return false;
    }
    const allConsents = Object.values(consents);
    if (!allConsents.every(val => val === true)) {
      Swal.fire("Validation Error", "Please accept all consent declarations.", "warning");
      return false;
    }
    return true;
  };
  
  // Validate Tab 2
  const validateTab2 = () => {
    if (otpData.otp.length !== 6) {
      Swal.fire("Validation Error", "Please enter a valid 6-digit OTP.", "warning");
      return false;
    }
    if (!otpData.mobileNumber || otpData.mobileNumber.length !== 10) {
      Swal.fire("Validation Error", "Please enter a valid 10-digit mobile number.", "warning");
      return false;
    }
    return true;
  };
  
  // Validate Tab 3
  const validateTab3 = () => {
    if (!abhaAddress.trim()) {
      Swal.fire("Validation Error", "Please enter an ABHA address.", "warning");
      return false;
    }
    if (!abhaAddress.includes('@')) {
      Swal.fire("Validation Error", "ABHA address should be in format: username@abdm", "warning");
      return false;
    }
    return true;
  };
  
  // Format ABHA number for display
  const formatAbhaNumber = (value = "") => {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 14) return value;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  };
  
  // Helper: Find gender ID from master data
  const findGenderId = (genderName) => {
    if (!genderName || !genderData.length) return null;
    
    const normalizedGender = genderName.toLowerCase().trim();
    const found = genderData.find(g => 
      g.genderName?.toLowerCase() === normalizedGender ||
      g.genderName?.toLowerCase().includes(normalizedGender) ||
      normalizedGender.includes(g.genderName?.toLowerCase())
    );
    return found?.id || null;
  };
  
  // Helper: Find state ID from master data
  const findStateId = (stateName) => {
    if (!stateName || !stateData.length) return null;
    
    const normalizedState = stateName.toLowerCase().trim();
    const found = stateData.find(s => 
      s.stateName?.toLowerCase() === normalizedState ||
      s.stateName?.toLowerCase().includes(normalizedState) ||
      normalizedState.includes(s.stateName?.toLowerCase())
    );
    return found?.id || null;
  };
  
  // Helper: Find district ID from master data
  const findDistrictId = (districtName, stateId) => {
    if (!districtName || !districtData.length) return null;
    
    const normalizedDistrict = districtName.toLowerCase().trim();
    const found = districtData.find(d => {
      const nameMatch = d.districtName?.toLowerCase() === normalizedDistrict ||
                        d.districtName?.toLowerCase().includes(normalizedDistrict) ||
                        normalizedDistrict.includes(d.districtName?.toLowerCase());
      
      // If stateId is provided, also match by state
      if (stateId && d.stateId) {
        return nameMatch && d.stateId === stateId;
      }
      return nameMatch;
    });
    return found?.id || null;
  };
  
  // Send OTP API call
  const handleSendOtp = async () => {
    if (!validateTab1()) return;
    
    setLoading(prev => ({ ...prev, sendOtp: true }));
    
    try {
      // Prepare consent payload - all consents should be "true"
      const consentPayload = {
        consent1: String(consents.consent1),
        consent2: String(consents.consent2),
        consent3: String(consents.consent3),
        consent4: String(consents.consent4),
        consent5: String(consents.consent5),
        consent6: String(consents.consent6),
        consent7: String(consents.consent7),
      };
      
      // Secure Aadhaar number
      const secureAadhaar = await integrationService.secureAbdmFieldPayload({
        field: "aadhaarNumber",
        value: aadhaarData.aadhaarNo,
      });
      
      // Send OTP
      const response = await integrationService.sendAbdmAadhaarOtp({
        ...secureAadhaar,
        consentName: aadhaarData.consentName.trim(),
        ...consentPayload,
      });
      
      if (response?.status === false) {
        throw new Error(response?.message || "Unable to send OTP.");
      }
      
      setOtpData(prev => ({
        ...prev,
        txnId: response?.response?.txnId || response?.response?.tnxId || "",
        isType: response?.response?.isType || "",
        mobileNumber: aadhaarData.mobileNumber || "",
      }));
      
      setCurrentTab(2);
      setLoading(prev => ({ ...prev, sendOtp: false }));
      
      setTimer(30);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      timerInterval.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      Swal.fire("OTP Sent", "OTP has been sent to your Aadhaar-linked mobile number.", "success");
    } catch (error) {
      setLoading(prev => ({ ...prev, sendOtp: false }));
      Swal.fire("Error", error.message || "Unable to send OTP.", "error");
    }
  };
  
  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) {
      Swal.fire("Please wait", `Wait ${timer} seconds before resending OTP.`, "info");
      return;
    }  
    setLoading(prev => ({ ...prev, sendOtp: true }));
    try {
      const response = await integrationService.resendAbdmOtp({
        txnId: otpData.txnId,
      });
      
      if (response?.status === false) {
        throw new Error(response?.message || "Unable to resend OTP.");
      }
      setTimer(30);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      timerInterval.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      Swal.fire("OTP Resent", "OTP has been resent successfully.", "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to resend OTP.", "error");
    } finally {
      setLoading(prev => ({ ...prev, sendOtp: false }));
    }
  };
  
  // Fetch ABHA details using xtoken
  const fetchAbhaDetails = async (xtoken, isType) => {
    setLoading(prev => ({ ...prev, fetchAbhaDetails: true }));
    try {
      const response = await integrationService.getAbhaDetails({
        xtoken,
        ...(isType ? { isType } : {}),
      });
      
      if (response?.status === false) {
        throw new Error(response?.message || "Unable to fetch ABHA details.");
      }
      
      const profile = response?.response || {};
      
      // Map the response fields to our profile structure
      return {
        abhaNumber: profile.ABHANumber || profile.healthIdNumber || profile.abhaNumber || "",
        abhaAddress: profile.preferredAbhaAddress || profile.healthId || profile.abhaAddress || "",
        name: profile.name || profile.consentName || aadhaarData.consentName,
        gender: profile.gender || "",
        genderId: findGenderId(profile.gender),
        mobileNumber: profile.mobile || profile.mobileNumber || otpData.mobileNumber,
        dateOfBirth: profile.dayOfBirth || profile.dateOfBirth || profile.dob || "",
        yearOfBirth: profile.yearOfBirth || "",
        // stateName: profile.stateName || "",
        // stateId: findStateId(profile.stateName),
        // districtName: profile.districtName || "",
        // districtId: findDistrictId(profile.districtName, findStateId(profile.stateName)),
        // address: profile.address || "",
        pincode: profile.pincode || "",
        photo: profile.profilePhoto || profile.photo || "",
        xtoken: xtoken,
        isType: isType,
        status: profile.status || "ACTIVE",
        fullProfile: profile,
      };
    } catch (error) {
      console.error("Error fetching ABHA details:", error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, fetchAbhaDetails: false }));
    }
  };
  
  // Verify OTP API call - MODIFIED to handle existing ABHA
  const handleVerifyOtp = async () => {
    if (!validateTab2()) return;
    
    setLoading(prev => ({ ...prev, verifyOtp: true }));
    try {
      const response = await integrationService.verifyAbdmAadhaarOtp({
        tnxId: otpData.txnId,
        otp: otpData.otp,
        mobileNumber: otpData.mobileNumber,
      });
      
      if (response?.status === false) {
        throw new Error(response?.message || "Invalid OTP. Please try again.");
      }
      debugger;
      const abhaProfile = response?.response?.ABHAProfile || null;
      const xtoken = response?.response?.xtoken || response?.response?.token || "";
      const isType = response?.response?.isType || "";
      const isExisting = abhaProfile || response?.response?.isNew === false;
      
      if (isExisting) {
        setIsExistingAbha(true);
        
        if (xtoken) {
          const fullProfile = await fetchAbhaDetails(xtoken, isType);
          if (fullProfile) {
            setExistingAbhaProfile(fullProfile);
            setAbhaNumber(fullProfile.abhaNumber);
            setAbhaAddress(fullProfile.abhaAddress);
            
            setOtpData(prev => ({ ...prev, xtoken }));
          } else {
            const basicProfile = {
              abhaNumber: abhaProfile?.healthIdNumber || abhaProfile?.ABHANumber || "",
              abhaAddress: abhaProfile?.preferredAbhaAddress || abhaProfile?.healthId || "",
              name: abhaProfile?.name || aadhaarData.consentName,
              gender: abhaProfile?.gender || "",
              genderId: findGenderId(abhaProfile?.gender),
              mobileNumber: abhaProfile?.mobile || abhaProfile?.mobileNumber || otpData.mobileNumber,
              stateName: abhaProfile?.stateName || "",
              stateId: findStateId(abhaProfile?.stateName),
              districtName: abhaProfile?.districtName || "",
              districtId: findDistrictId(abhaProfile?.districtName, findStateId(abhaProfile?.stateName)),
              xtoken: xtoken,
              isType: isType,
            };
            setExistingAbhaProfile(basicProfile);
            setAbhaNumber(basicProfile.abhaNumber);
            setAbhaAddress(basicProfile.abhaAddress);
          }
        } else {
          const basicProfile = {
            abhaNumber: abhaProfile?.healthIdNumber || abhaProfile?.ABHANumber || "",
            abhaAddress: abhaProfile?.preferredAbhaAddress || abhaProfile?.healthId || "",
            name: abhaProfile?.name || aadhaarData.consentName,
            gender: abhaProfile?.gender || "",
            genderId: findGenderId(abhaProfile?.gender),
            mobileNumber: abhaProfile?.mobile || abhaProfile?.mobileNumber || otpData.mobileNumber,
            stateName: abhaProfile?.stateName || "",
            stateId: findStateId(abhaProfile?.stateName),
            districtName: abhaProfile?.districtName || "",
            districtId: findDistrictId(abhaProfile?.districtName, findStateId(abhaProfile?.stateName)),
          };
          setExistingAbhaProfile(basicProfile);
          setAbhaNumber(basicProfile.abhaNumber);
          setAbhaAddress(basicProfile.abhaAddress);
        }
        
        // Show success message with existing ABHA info
        Swal.fire({
          icon: "info",
          title: "ABHA Already Exists",
          html: `
            <div>
              <p>An ABHA already exists for this Aadhaar number.</p>
              <p><strong>ABHA Number:</strong> ${formatAbhaNumber(existingAbhaProfile?.abhaNumber || abhaNumber || "Not found")}</p>
              <p><strong>ABHA Address:</strong> ${existingAbhaProfile?.abhaAddress || "Not set"}</p>
              <p><strong>Name:</strong> ${existingAbhaProfile?.name || aadhaarData.consentName}</p>
            </div>
          `,
          confirmButtonText: "View Profile",
        }).then(() => {
          // Move to Tab 3 to show existing ABHA card
          setCurrentTab(3);
        });
        
        setLoading(prev => ({ ...prev, verifyOtp: false }));
        return;
      }
      
      // No existing ABHA - proceed with creation
      setIsExistingAbha(false);
      setExistingAbhaProfile(null);
      setCurrentTab(3);
      setLoading(prev => ({ ...prev, verifyOtp: false }));
      
      Swal.fire("Verified", "OTP verified successfully! You can now create your ABHA address.", "success");
    } catch (error) {
      setLoading(prev => ({ ...prev, verifyOtp: false }));
      Swal.fire("Verification Failed", error.message || "Invalid OTP. Please try again.", "error");
    }
  };
  
  // Create ABHA API call
  const handleCreateAbha = async () => {
    if (!validateTab3()) return;
    
    setLoading(prev => ({ ...prev, createAbha: true }));
    setIsCreatingAbha(true);
    
    try {
      const response = await integrationService.createAbdmAccount({
        txnId: otpData.txnId,
        abhaAddress: abhaAddress.trim(),
        consentName: aadhaarData.consentName,
        mobileNumber: otpData.mobileNumber || aadhaarData.mobileNumber,
      });
      
      if (response?.status === false) {
        throw new Error(response?.message || "Unable to create ABHA account.");
      }
      
      const abhaNumberResponse = response?.response?.abhaNumber || 
                                 response?.response?.healthIdNumber || 
                                 response?.response?.abhaId || "";
      setAbhaNumber(abhaNumberResponse);
      setLoading(prev => ({ ...prev, createAbha: false }));
      setIsCreatingAbha(false);
      
      Swal.fire({
        icon: "success",
        title: "ABHA Created Successfully!",
        html: `
          <div>
            <p><strong>ABHA Number:</strong> ${formatAbhaNumber(abhaNumberResponse)}</p>
            <p><strong>ABHA Address:</strong> ${abhaAddress.trim()}</p>
            <p><strong>Name:</strong> ${aadhaarData.consentName}</p>
          </div>
        `,
        confirmButtonText: "OK",
      }).then(() => {
        // Pass the data with mapped IDs
        onSuccess?.({
          abhaNumber: abhaNumberResponse,
          abhaAddress: abhaAddress.trim(),
          consentName: aadhaarData.consentName,
          mobileNumber: otpData.mobileNumber || aadhaarData.mobileNumber,
          isNewAbha: true,
          // For new ABHA, these might not be available
          gender: "",
          genderId: null,
          stateName: "",
          stateId: null,
          districtName: "",
          districtId: null,
          dateOfBirth: "",
          address: "",
          pincode: "",
        });
        onClose();
      });
    } catch (error) {
      setLoading(prev => ({ ...prev, createAbha: false }));
      setIsCreatingAbha(false);
      Swal.fire("Error", error.message || "Unable to create ABHA account.", "error");
    }
  };
  
  // Navigate tabs
  const goToTab = (tabNumber) => {
    if (tabNumber === 2 && currentTab === 1) {
      handleSendOtp();
      return;
    }
    if (tabNumber === 3 && currentTab === 2) {
      handleVerifyOtp();
      return;
    }
    if (tabNumber === currentTab + 1) {
      if (currentTab === 1) {
        handleSendOtp();
      } else if (currentTab === 2) {
        handleVerifyOtp();
      }
    } else if (tabNumber < currentTab) {
      setCurrentTab(tabNumber);
    }
  };
  
  // Get masked mobile number
  const getMaskedMobile = (mobile = "") => {
    if (!mobile) return "registered mobile number";
    const digits = mobile.replace(/\D/g, "").slice(0, 10);
    if (digits.length < 4) return "registered mobile number";
    return `******${digits.slice(-4)}`;
  };
  
  // Format Aadhaar for display
  const formatAadhaar = (aadhaar = "") => {
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length < 4) return digits;
    return digits.replace(/(\d{4})/g, '$1 ').trim();
  };
  
  // Render ABHA card for existing profiles
  const renderAbhaCard = (profile) => {
    if (!profile) return null;
    
    // Get the full profile data
    const fullProfile = profile.fullProfile || {};
    
    return (
      <div className="abha-card-container">
        <div className="alert alert-info mb-3">
          <i className="fa fa-info-circle me-2"></i>
          <strong>ABHA Already Exists</strong>
          <p className="mb-0 mt-1">This Aadhaar number is already linked to an ABHA. You can view the profile below.</p>
        </div>
        
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h5 className="card-title mb-3">ABHA Profile</h5>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="text-muted small">Name</label>
                    <p className="fw-bold">{profile.name || aadhaarData.consentName}</p>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small">ABHA Number</label>
                    <p className="fw-bold">{formatAbhaNumber(profile.abhaNumber) || "Not found"}</p>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small">ABHA Address</label>
                    <p className="fw-bold">{profile.abhaAddress || "Not set"}</p>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small">Mobile Number</label>
                    <p className="fw-bold">{profile.mobileNumber || otpData.mobileNumber}</p>
                  </div>
                  {profile.gender && (
                    <div className="col-6">
                      <label className="text-muted small">Gender</label>
                      <p className="fw-bold">{profile.gender} {profile.genderId ? `(ID: ${profile.genderId})` : ''}</p>
                    </div>
                  )}
                  {profile.dateOfBirth && (
                    <div className="col-6">
                      <label className="text-muted small">Date of Birth</label>
                      <p className="fw-bold">{profile.dateOfBirth}</p>
                    </div>
                  )}
                  {profile.address && (
                    <div className="col-12">
                      <label className="text-muted small">Address</label>
                      <p className="fw-bold">{profile.address}</p>
                    </div>
                  )}
                  {profile.pincode && (
                    <div className="col-6">
                      <label className="text-muted small">Pincode</label>
                      <p className="fw-bold">{profile.pincode}</p>
                    </div>
                  )}
                  {profile.stateName && (
                    <div className="col-6">
                      <label className="text-muted small">State</label>
                      <p className="fw-bold">{profile.stateName} {profile.stateId ? `(ID: ${profile.stateId})` : ''}</p>
                    </div>
                  )}
                  {profile.districtName && (
                    <div className="col-6">
                      <label className="text-muted small">District</label>
                      <p className="fw-bold">{profile.districtName} {profile.districtId ? `(ID: ${profile.districtId})` : ''}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-light p-3 rounded">
                  {profile.photo ? (
                    <img 
                      src={profile.photo.startsWith('data:') ? profile.photo : `data:image/jpeg;base64,${profile.photo}`} 
                      alt="ABHA Profile" 
                      className="img-fluid rounded-circle" 
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto" 
                               style="width: 100px; height: 100px; font-size: 2.5rem;">
                            ${profile.name?.charAt(0) || "A"}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                      style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
                    >
                      {profile.name?.charAt(0) || "A"}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-success mt-2 w-100"
                  onClick={() => {
                    // Pass all the profile data with mapped IDs
                    onSuccess?.({
                      abhaNumber: profile.abhaNumber,
                      abhaAddress: profile.abhaAddress,
                      consentName: profile.name || aadhaarData.consentName,
                      mobileNumber: profile.mobileNumber || otpData.mobileNumber,
                      gender: profile.gender || "",
                      genderId: profile.genderId || null,
                      dateOfBirth: profile.dateOfBirth || "",
                      address: profile.address || "",
                      stateName: profile.stateName || "",
                      stateId: profile.stateId || null,
                      districtName: profile.districtName || "",
                      districtId: profile.districtId || null,
                      pincode: profile.pincode || "",
                      photo: profile.photo || "",
                      fullProfile: profile.fullProfile || {},
                      isExistingAbha: true,
                      xtoken: profile.xtoken || otpData.xtoken || "",
                    });
                    onClose();
                  }}
                >
                  <i className="fa fa-check me-2"></i>
                  Use This ABHA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (!show) return null;
  
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {isExistingAbha ? "ABHA Profile Found" : "Create New ABHA Health ID"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body p-4">
            {/* Progress Steps - Hide when existing ABHA is found */}
            {!isExistingAbha && (
              <div className="d-flex justify-content-between mb-4 position-relative">
                <div className="position-absolute top-50 start-0 end-0 border-2 border-top" style={{ zIndex: 0, transform: "translateY(-50%)" }}></div>
                {[1, 2, 3].map((step) => (
                  <div key={step} className="d-flex flex-column align-items-center" style={{ zIndex: 1 }}>
                    <div 
                      className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${
                        currentTab >= step ? "bg-success" : "bg-secondary"
                      }`}
                      style={{ width: "40px", height: "40px", color: "white", cursor: "pointer" }}
                      onClick={() => goToTab(step)}
                    >
                      {currentTab > step ? "✓" : step}
                    </div>
                    <span className={`small ${currentTab >= step ? "text-dark fw-bold" : "text-muted"}`}>
                      {step === 1 ? "Aadhaar" : step === 2 ? "Verify" : "Create"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tab 1: Aadhaar & Consent */}
            {currentTab === 1 && !isExistingAbha && (
              <div className="tab-content">
                <h6 className="fw-bold mb-3">Step 1: Aadhaar Details</h6>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Full Name (as per Aadhaar) <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="consentName"
                    value={aadhaarData.consentName}
                    onChange={handleAadhaarChange}
                    placeholder="Enter full name as per Aadhaar"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Aadhaar Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="aadhaarNo"
                    value={formatAadhaar(aadhaarData.aadhaarNo)}
                    onChange={handleAadhaarChange}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={14}
                  />
                  <small className="text-muted">Enter your 12-digit Aadhaar number</small>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Captcha <span className="text-danger">*</span></label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light p-2 rounded border" style={{ minWidth: "120px", textAlign: "center", fontSize: "1.2rem" }}>
                      <strong>{captcha.question}</strong>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter answer"
                      value={captcha.userInput}
                      onChange={(e) => setCaptcha(prev => ({ ...prev, userInput: e.target.value }))}
                      style={{ maxWidth: "150px" }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={generateCaptcha}
                      title="Refresh captcha"
                    >
                      ⟳
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Consent Declarations <span className="text-danger">*</span></h6>
                  
                  {/* Select All */}
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="selectAll"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    <label className="form-check-label fw-bold" htmlFor="selectAll">
                      Select All Consents
                    </label>
                  </div>
                  
                  <div className="border rounded p-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consent1"
                        name="consent1"
                        checked={consents.consent1}
                        onChange={handleConsentChange}
                      />
                      <label className="form-check-label" htmlFor="consent1">
                        I am voluntarily sharing my Aadhaar Number / Virtual ID issued by the Unique Identification Authority of India ("UIDAI"), and my demographic information for the purpose of creating an Ayushman Bharat Health Account number ("ABHA number") and Ayushman Bharat Health Account address ("ABHA Address"). I authorize NHA to use my Aadhaar number / Virtual ID for performing Aadhaar based authentication with UIDAI as per the provisions of the Aadhaar (Targeted Delivery of Financial and other Subsidies, Benefits and Services) Act, 2016 for the aforesaid purpose. I understand that UIDAI will share my e-KYC details, or response of "Yes" with NHA upon successful authentication.
                      </label>
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consent2"
                        name="consent2"
                        checked={consents.consent2}
                        onChange={handleConsentChange}
                      />
                      <label className="form-check-label" htmlFor="consent2">
                        I consent to usage of my ABHA address and ABHA number for linking of my legacy (past) government health records and those which will be generated during this encounter.
                      </label>
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consent3"
                        name="consent3"
                        checked={consents.consent3}
                        onChange={handleConsentChange}
                      />
                      <label className="form-check-label" htmlFor="consent3">
                        I authorize the sharing of all my health records with healthcare provider(s) for the purpose of providing healthcare services to me during this encounter.
                      </label>
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consent4"
                        name="consent4"
                        checked={consents.consent4}
                        onChange={handleConsentChange}
                      />
                      <label className="form-check-label" htmlFor="consent4">
                        I consent to the anonymization and subsequent use of my government health records for public health purposes.
                      </label>
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consent5"
                        name="consent5"
                        checked={consents.consent5}
                        onChange={handleConsentChange}
                      />
                      <label className="form-check-label" htmlFor="consent5">
                        I, {aadhaarData.consentName || "[Name]"}, confirm that I have duly informed and explained the beneficiary of the contents of consent for aforementioned purposes.
                      </label>
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consent6"
                        name="consent6"
                        checked={consents.consent6}
                        onChange={handleConsentChange}
                      />
                      <label className="form-check-label" htmlFor="consent6">
                        I, {aadhaarData.consentName || "[Name]"}, have been explained about the consent as stated above and hereby provide my consent for the aforementioned purposes.
                      </label>
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consent7"
                        name="consent7"
                        checked={consents.consent7}
                        onChange={handleConsentChange}
                      />
                      <label className="form-check-label" htmlFor="consent7">
                        I understand that I can manage my ABHA through the ABDM portal and can withdraw my consent at any time.
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tab 2: OTP Verification */}
            {currentTab === 2 && !isExistingAbha && (
              <div className="tab-content">
                <h6 className="fw-bold mb-3">Step 2: OTP Verification</h6>
                
                <div className="text-center mb-4 p-3 bg-light rounded">
                  <p className="mb-1 text-muted">OTP has been sent to</p>
                  <p className="fw-bold fs-5 mb-0">
                    {getMaskedMobile(otpData.mobileNumber || patientData.mobileNo || aadhaarData.mobileNumber)}
                  </p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Enter OTP <span className="text-danger">*</span></label>
                  <div className="d-flex gap-3 align-items-center flex-wrap">
                    <input
                      type="text"
                      className="form-control"
                      name="otp"
                      value={otpData.otp}
                      onChange={handleOtpChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      style={{ maxWidth: "200px", fontSize: "1.5rem", textAlign: "center" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleResendOtp}
                      disabled={timer > 0}
                    >
                      {timer > 0 ? `Resend (${timer}s)` : "Resend OTP"}
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Mobile Number (Aadhaar Registered) <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="mobileNumber"
                    value={otpData.mobileNumber}
                    onChange={handleOtpChange}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                  />
                  <small className="text-muted">Enter the mobile number registered with Aadhaar</small>
                </div>
              </div>
            )}
            
            {/* Tab 3: ABHA Address OR Existing ABHA Profile */}
            {currentTab === 3 && (
              <div className="tab-content">
                {isExistingAbha && existingAbhaProfile ? (
                  // Show existing ABHA profile
                  <>
                    {renderAbhaCard(existingAbhaProfile)}
                    
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-secondary me-2"
                        onClick={() => setCurrentTab(2)}
                      >
                        <i className="fa fa-arrow-left me-2"></i>
                        Back
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  // Show ABHA creation form for new users
                  <>
                    <h6 className="fw-bold mb-3">Step 3: Create ABHA Address</h6>
                    
                    <div className="alert alert-success mb-3">
                      <p className="mb-0">✓ Your Aadhaar has been verified successfully!</p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-bold">ABHA Address <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={abhaAddress}
                        onChange={(e) => setAbhaAddress(e.target.value)}
                        placeholder="e.g., username@abdm"
                      />
                      <small className="text-muted">Your ABHA address must be unique and in format: username@abdm</small>
                    </div>
                    
                    <div className="bg-light p-3 rounded mb-3">
                      <p className="mb-1 text-muted">Patient Information</p>
                      <div className="row">
                        <div className="col-6">
                          <strong>Name:</strong> {aadhaarData.consentName}
                        </div>
                        <div className="col-6">
                          <strong>Aadhaar:</strong> ******{aadhaarData.aadhaarNo.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {isExistingAbha ? "Close" : "Cancel"}
            </button>
            
            {!isExistingAbha && currentTab > 1 && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setCurrentTab(prev => prev - 1)}
              >
                Back
              </button>
            )}
            
            {!isExistingAbha && currentTab === 1 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendOtp}
                disabled={loading.sendOtp}
              >
                {loading.sendOtp ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            )}
            
            {!isExistingAbha && currentTab === 2 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleVerifyOtp}
                disabled={loading.verifyOtp}
              >
                {loading.verifyOtp ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>
            )}
            
            {!isExistingAbha && currentTab === 3 && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleCreateAbha}
                disabled={loading.createAbha || isCreatingAbha}
              >
                {loading.createAbha || isCreatingAbha ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  "Create ABHA"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABHACreationModal;
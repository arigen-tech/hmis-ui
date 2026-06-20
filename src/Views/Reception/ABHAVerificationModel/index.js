// components/ABHAVerificationModal.jsx
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { integrationService } from "../../../service/integrationService";
import { isValidAadhaarNumber } from "../../../utils/ABDMValidations";

const ABHAVerificationModal = ({ 
  show, 
  onClose, 
  onSuccess, 
  patientData = {},
  genderData = [],
  stateData = [],
  districtData = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Authentication Methods
  const [authMethods, setAuthMethods] = useState([
    { id: "1002", master_name: "Mobile Number" },
    { id: "1001", master_name: "Aadhaar Number" },
    { id: "1004", master_name: "ABHA Number" },
    { id: "1003", master_name: "ABHA Address" },
  ]);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState("1001");
  
  // OTP Method for ABHA Number (Mobile or Aadhaar)
  const [otpMethod, setOtpMethod] = useState("Mobile");
  
  // Step 1: Input value
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  
  // Step 1.5: Profile Selection
  const [abhaProfiles, setAbhaProfiles] = useState([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [otpType, setOtpType] = useState("");
  const [isType, setIsType] = useState("");
  const [txnId, setTxnId] = useState("");
  
  // Step 2: OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [xtoken, setXtoken] = useState("");
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);
  
  // Step 3: ABHA Profile
  const [abhaProfile, setAbhaProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (show) {
      setCurrentStep(1);
      setInputValue("");
      setInputError("");
      setOtp("");
      setOtpError("");
      setTxnId("");
      setIsType("");
      setXtoken("");
      setAbhaProfile(null);
      setAbhaProfiles([]);
      setSelectedProfileIndex(0);
      setTimer(0);
      setOtpMethod("Mobile");
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      if (patientData?.abhaNumber) {
        setSelectedAuthMethod("1004");
        setInputValue(patientData.abhaNumber);
      } else if (patientData?.mobileNo) {
        setSelectedAuthMethod("1002");
        setInputValue(patientData.mobileNo);
      } else if (patientData?.aadhaarNo) {
        setSelectedAuthMethod("1001");
        setInputValue(patientData.aadhaarNo);
      }
    }
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [show, patientData]);
  
  const validateInput = (methodId, value) => {
    const trimmedValue = (value || "").trim();
    if (!trimmedValue) {
      return `Enter ${getMethodLabel(methodId)}.`;
    }
    
    if (methodId === "1002" && !/^[6-9]\d{9}$/.test(trimmedValue)) {
      return "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.";
    }
    
    if (methodId === "1001" && !isValidAadhaarNumber(trimmedValue)) {
      return "Enter a valid 12-digit Aadhaar number.";
    }
    
    if (methodId === "1004" && !/^\d{14}$/.test(trimmedValue.replace(/\D/g, ""))) {
      return "Enter a valid 14-digit ABHA number.";
    }
    
    if (methodId === "1003" && !/^[a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*$/.test(trimmedValue)) {
      return "Enter a valid ABHA ID / Address. Spaces are not allowed.";
    }
    
    return "";
  };
  
  const getMethodLabel = (methodId) => {
    const map = {
      "1002": "Mobile Number",
      "1001": "Aadhaar Number",
      "1003": "ABHA Address",
      "1004": "ABHA Number",
    };
    return map[methodId] || "Verification";
  };
  
  const getInputPlaceholder = (methodId) => {
    if (methodId === "1001") return "Enter valid 12 digit Aadhaar number";
    if (methodId === "1004") return "Enter ABHA number (e.g. 91-1860-2588-5507)";
    if (methodId === "1003") return "Enter ABHA ID / Address (e.g. username@abdm)";
    return "Enter valid 10 digit mobile number";
  };
  
  const formatAbhaNumber = (value = "") => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 14) return value;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
  };
  
  const getMaskedMobile = (mobile = "") => {
    if (!mobile) return "registered mobile number";
    const digits = mobile.replace(/\D/g, "").slice(0, 10);
    if (digits.length < 4) return "registered mobile number";
    return `******${digits.slice(-4)}`;
  };
  
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
  
  const findDistrictId = (districtName, stateId) => {
    if (!districtName || !districtData.length) return null;
    const normalizedDistrict = districtName.toLowerCase().trim();
    const found = districtData.find(d => {
      const nameMatch = d.districtName?.toLowerCase() === normalizedDistrict ||
                        d.districtName?.toLowerCase().includes(normalizedDistrict) ||
                        normalizedDistrict.includes(d.districtName?.toLowerCase());
      if (stateId && d.stateId) {
        return nameMatch && d.stateId === stateId;
      }
      return nameMatch;
    });
    return found?.id || null;
  };
  
  // Step 1: Send OTP
  const handleSendOtp = async () => {
    const validationError = validateInput(selectedAuthMethod, inputValue);
    if (validationError) {
      setInputError(validationError);
      return;
    }
    setInputError("");
    setIsLoading(true);
    
    try {
      let payload = {
        inputType: selectedAuthMethod,
      };
      
      if (selectedAuthMethod === "1004") {
        payload = {
          inputType: selectedAuthMethod,
          inputNumber: inputValue.replace(/\D/g, ""),
          authMethod: otpMethod,
        };
        console.log("ABHA Number payload:", payload);
      } else if (selectedAuthMethod === "1001") {
        const secureField = await integrationService.secureAbdmFieldPayload({
          field: "inputNumber",
          value: inputValue.replace(/\D/g, ""),
        });
        payload = {
          inputType: selectedAuthMethod,
          inputNumber: secureField.inputNumber,
          key: secureField.key || "",
        };
        console.log("Secure Aadhaar payload:", payload);
      } else if (selectedAuthMethod === "1002") {
        payload = {
          inputType: selectedAuthMethod,
          inputNumber: inputValue.replace(/\D/g, ""),
        };
      } else if (selectedAuthMethod === "1003") {
        payload = {
          inputType: selectedAuthMethod,
          inputNumber: inputValue.trim(),
        };
      }
      
      const response = await integrationService.sendAbdmVerificationOtp(payload);
      
      console.log("Send OTP response:", response);
      
      if (response?.status === false) {
        throw new Error(response?.message || "Unable to send verification OTP.");
      }
      
      // Store the response data
      const responseData = response?.response || {};
      const abhaResponse = responseData.abhaResponse || [];
      const profiles = [];
      
      // Extract profiles from response
      if (abhaResponse.length > 0) {
        const abhaList = abhaResponse[0]?.ABHA || [];
        abhaList.forEach((item) => {
          profiles.push({
            index: item.index || 0,
            name: item.name || "Unknown",
            gender: item.gender || "",
            kycVerified: item.kycVerified === "true" || item.kycVerified === true,
            abhaNumber: item.ABHANumber || "",
            abhaNumberFull: item.ABHANumberFull || item.ABHANumber || "",
          });
        });
      }
      
      // If we have multiple profiles or just one, store them
      if (profiles.length > 0) {
        setAbhaProfiles(profiles);
        setSelectedProfileIndex(0);
        setOtpType(responseData.otpType || "");
        setIsType(responseData.isType || "1");
        setTxnId(abhaResponse[0]?.txnId || responseData.txnId || "");
        
        // Move to profile selection step
        setCurrentStep(1.5);
        setIsLoading(false);
        
        Swal.fire("Profiles Found", `${profiles.length} ABHA profile(s) found. Please select one.`, "info");
      } else {
        // If no profiles, try to get txnId directly
        const directTxnId = responseData.txnId || "";
        if (directTxnId) {
          setTxnId(directTxnId);
          setOtpType(responseData.otpType || "");
          setIsType(responseData.isType || "1");
          setCurrentStep(2);
          setIsLoading(false);
          
          // Start timer
          setTimer(60);
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
          
          Swal.fire("OTP Sent", "OTP has been sent successfully.", "success");
        } else {
          throw new Error("No ABHA profiles found and no OTP sent.");
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Send OTP error:", error);
      Swal.fire("Error", error.message || "Unable to send OTP.", "error");
    }
  };
  
  // Step 1.5: Continue with selected profile - Send OTP using index
  const handleContinueWithProfile = async () => {
    if (!txnId || abhaProfiles.length === 0) {
      Swal.fire("Error", "No profile selected. Please try again.", "error");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedProfile = abhaProfiles[selectedProfileIndex];
      
      const payload = {
        txnId: txnId,
        inputType: otpType || "1002",
        index: String(selectedProfile.index || 0),
        isType: isType || "1",
      };
      
      console.log("Sending index OTP payload:", payload);
      
      const response = await integrationService.sendAbdmVerificationIndexOtp(payload);
      
      console.log("Index OTP response:", response);
      
      if (response?.status === false) {
        throw new Error(response?.message || "Unable to send OTP.");
      }
      
      // Store the new txnId if provided
      const newTxnId = response?.response?.txnId || txnId;
      setTxnId(newTxnId);
      
      // Move to OTP verification step
      setCurrentStep(2);
      setIsLoading(false);
      
      // Start timer
      setTimer(60);
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
      
      Swal.fire("OTP Sent", "OTP has been sent to the registered mobile number.", "success");
    } catch (error) {
      setIsLoading(false);
      console.error("Index OTP error:", error);
      Swal.fire("Error", error.message || "Unable to send OTP.", "error");
    }
  };
  
  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP.");
      return;
    }
    setOtpError("");
    setIsLoading(true);
    
    try {
      const payload = {
        otp: otp,
        txnId: txnId,
        inputType: otpType || selectedAuthMethod,
        isType: isType || "1",
      };

      if (selectedAuthMethod === "1004" || otpType === "1004") {
        payload.authMethod = otpMethod;
      }
      
      console.log("Verify OTP payload:", payload);
      
      const response = await integrationService.verifyAbdmVerificationOtp(payload);
      
      console.log("Verify OTP response:", response);
      
      if (response?.status === false) {
        throw new Error(response?.message || "Invalid OTP. Please try again.");
      }
      
      // Fetch ABHA profile
      const xtokenFromResponse = response?.response?.xtoken || response?.response?.token || "";
      const isTypeFromResponse = response?.response?.isType || isType || "1";
      
      // If we have xtoken, fetch full profile
      if (xtokenFromResponse) {
        const detailsPayload = {
          xtoken: xtokenFromResponse,
        };
        if (isTypeFromResponse) {
          detailsPayload.isType = isTypeFromResponse;
        }
        
        console.log("Fetch ABHA details payload:", detailsPayload);
        
        const detailsResponse = await integrationService.getAbhaDetails(detailsPayload);
        
        console.log("ABHA details response:", detailsResponse);
        
        if (detailsResponse?.status === false) {
          throw new Error(detailsResponse?.message || "Unable to fetch ABHA details.");
        }
        
        const profile = detailsResponse?.response || {};
        
        // Map profile data
        const mappedProfile = {
          abhaNumber: profile.ABHANumber || profile.healthIdNumber || profile.abhaNumber || "",
          abhaAddress: profile.preferredAbhaAddress || profile.healthId || profile.abhaAddress || "",
          name: profile.name || profile.consentName || "",
          gender: profile.gender || "",
          genderId: findGenderId(profile.gender),
          mobileNumber: profile.mobile || profile.mobileNumber || "",
          dateOfBirth: profile.dayOfBirth || profile.dateOfBirth || profile.dob || "",
          address: profile.address || "",
        //   stateName: profile.stateName || "",
        //   stateId: findStateId(profile.stateName),
        //   districtName: profile.districtName || "",
        //   districtId: findDistrictId(profile.districtName, findStateId(profile.stateName)),
          pincode: profile.pincode || "",
          photo: profile.profilePhoto || profile.photo || "",
          xtoken: xtokenFromResponse,
          isType: isTypeFromResponse,
          status: profile.status || "ACTIVE",
          fullProfile: profile,
        };
        
        setAbhaProfile(mappedProfile);
        setCurrentStep(3);
        setIsLoading(false);
        
        Swal.fire("Verified", "ABHA verified successfully!", "success");
      } else {
        // If no xtoken, use the selected profile info
        const selectedProfile = abhaProfiles[selectedProfileIndex] || {};
        const mappedProfile = {
          abhaNumber: selectedProfile.abhaNumber || selectedProfile.abhaNumberFull || "",
          abhaAddress: "",
          name: selectedProfile.name || "",
          gender: selectedProfile.gender || "",
          genderId: findGenderId(selectedProfile.gender),
          mobileNumber: patientData?.mobileNo || "",
          dateOfBirth: "",
          address: "",
          stateName: "",
          stateId: null,
          districtName: "",
          districtId: null,
          pincode: "",
          photo: "",
          xtoken: "",
          isType: isType || "1",
          status: "ACTIVE",
          fullProfile: selectedProfile,
        };
        
        setAbhaProfile(mappedProfile);
        setCurrentStep(3);
        setIsLoading(false);
        
        Swal.fire("Verified", "ABHA verified successfully!", "success");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Verify OTP error:", error);
      Swal.fire("Verification Failed", error.message || "Invalid OTP. Please try again.", "error");
    }
  };
  
  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) {
      Swal.fire("Please wait", `Wait ${timer} seconds before resending OTP.`, "info");
      return;
    }
    
    setIsLoading(true);
    try {
      // If we have profiles, use index-otp
      if (abhaProfiles.length > 0) {
        const selectedProfile = abhaProfiles[selectedProfileIndex];
        const payload = {
          txnId: txnId,
          inputType: otpType || "1002",
          index: String(selectedProfile.index || 0),
          isType: isType || "1",
        };
        
        const response = await integrationService.sendAbdmVerificationIndexOtp(payload);
        
        if (response?.status === false) {
          throw new Error(response?.message || "Unable to resend OTP.");
        }
      } else {
        // Resend using original method
        let payload = {
          inputType: selectedAuthMethod,
        };
        
        if (selectedAuthMethod === "1004") {
          payload = {
            inputType: selectedAuthMethod,
            inputNumber: inputValue.replace(/\D/g, ""),
            authMethod: otpMethod,
          };
        } else if (selectedAuthMethod === "1001") {
          const secureField = await integrationService.secureAbdmFieldPayload({
            field: "inputNumber",
            value: inputValue.replace(/\D/g, ""),
          });
          payload = {
            inputType: selectedAuthMethod,
            inputNumber: secureField.inputNumber,
            key: secureField.key || "",
          };
        } else if (selectedAuthMethod === "1002") {
          payload = {
            inputType: selectedAuthMethod,
            inputNumber: inputValue.replace(/\D/g, ""),
          };
        } else if (selectedAuthMethod === "1003") {
          payload = {
            inputType: selectedAuthMethod,
            inputNumber: inputValue.trim(),
          };
        }
        
        const response = await integrationService.sendAbdmVerificationOtp(payload);
        
        if (response?.status === false) {
          throw new Error(response?.message || "Unable to resend OTP.");
        }
        
        const responseData = response?.response || {};
        const newTxnId = responseData.txnId || txnId;
        setTxnId(newTxnId);
      }
      
      setTimer(60);
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
      
      setIsLoading(false);
      Swal.fire("OTP Resent", "OTP has been resent successfully.", "success");
    } catch (error) {
      setIsLoading(false);
      console.error("Resend OTP error:", error);
      Swal.fire("Error", error.message || "Unable to resend OTP.", "error");
    }
  };
  
  // Handle input change with proper formatting
  const handleInputChange = (value) => {
    let formattedValue = value;
    if (selectedAuthMethod === "1002") {
      formattedValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (selectedAuthMethod === "1001") {
      formattedValue = value.replace(/\D/g, "").slice(0, 12);
    } else if (selectedAuthMethod === "1004") {
      formattedValue = value.replace(/\D/g, "").slice(0, 14);
    } else if (selectedAuthMethod === "1003") {
      formattedValue = value.replace(/\s/g, "").toLowerCase();
    }
    setInputValue(formattedValue);
    setInputError("");
  };
  
  // Handle OTP change
  const handleOtpChange = (value) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
    setOtpError("");
  };
  
  // Use ABHA data in parent
  const handleUseAbha = () => {
    if (!abhaProfile) return;
    
    onSuccess?.({
      abhaNumber: abhaProfile.abhaNumber,
      abhaAddress: abhaProfile.abhaAddress,
      consentName: abhaProfile.name,
      mobileNumber: abhaProfile.mobileNumber,
      gender: abhaProfile.gender,
      genderId: abhaProfile.genderId,
      dateOfBirth: abhaProfile.dateOfBirth,
      address: abhaProfile.address,
      stateName: abhaProfile.stateName,
      stateId: abhaProfile.stateId,
      districtName: abhaProfile.districtName,
      districtId: abhaProfile.districtId,
      pincode: abhaProfile.pincode,
      photo: abhaProfile.photo,
      isExistingAbha: true,
      xtoken: abhaProfile.xtoken,
      fullProfile: abhaProfile.fullProfile,
    });
    
    onClose();
  };
  
  // Download ABHA card
  const handleDownloadCard = async () => {
    if (!abhaProfile?.xtoken) {
      Swal.fire("Download Unavailable", "ABHA card is not available for download.", "warning");
      return;
    }
    
    setIsLoading(true);
    try {
      const payload = {
        xtoken: abhaProfile.xtoken,
      };
      if (abhaProfile.isType) {
        payload.isType = abhaProfile.isType;
      }
      
      const response = await integrationService.downloadAbhaCard(payload);
      
      if (response?.status === false) {
        throw new Error(response?.message || "Failed to download ABHA card.");
      }
      
      const base64Data = response?.response?.abhaCard || "";
      if (!base64Data) {
        throw new Error("ABHA card data not found.");
      }
      
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `abha-card-${abhaProfile.abhaNumber || "profile"}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
      
      setIsLoading(false);
      Swal.fire("Download Ready", "ABHA card downloaded successfully.", "success");
    } catch (error) {
      setIsLoading(false);
      console.error("Download error:", error);
      Swal.fire("Download Error", error.message || "Failed to download ABHA card.", "error");
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Verify / Update ABHA</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body p-4">
            {/* Progress Steps */}
            <div className="d-flex justify-content-between mb-4 position-relative">
              <div className="position-absolute top-50 start-0 end-0 border-2 border-top" style={{ zIndex: 0, transform: "translateY(-50%)" }}></div>
              {[1, 2, 3].map((step) => (
                <div key={step} className="d-flex flex-column align-items-center" style={{ zIndex: 1 }}>
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${
                      currentStep >= step ? "bg-success" : "bg-secondary"
                    }`}
                    style={{ width: "40px", height: "40px", color: "white" }}
                  >
                    {currentStep > step ? "✓" : step}
                  </div>
                  <span className={`small ${currentStep >= step ? "text-dark fw-bold" : "text-muted"}`}>
                    {step === 1 ? "ABHA Detail" : step === 2 ? "ABHA Authentication" : "ABHA Card"}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Step 1: ABHA Detail */}
            {currentStep === 1 && (
              <div className="tab-content">
                <h6 className="fw-bold mb-3">ABHA Detail</h6>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Authentication Type</label>
                  <select
                    className="form-select"
                    value={selectedAuthMethod}
                    onChange={(e) => {
                      setSelectedAuthMethod(e.target.value);
                      setInputValue("");
                      setInputError("");
                      if (e.target.value === "1004") {
                        setOtpMethod("Mobile");
                      }
                    }}
                  >
                    {authMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.master_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">{getMethodLabel(selectedAuthMethod)}</label>
                  <input
                    type="text"
                    className={`form-control ${inputError ? "is-invalid" : ""}`}
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={getInputPlaceholder(selectedAuthMethod)}
                  />
                  {inputError && (
                    <div className="invalid-feedback">{inputError}</div>
                  )}
                  <small className="text-muted">Enter your {getMethodLabel(selectedAuthMethod).toLowerCase()}</small>
                </div>
                
                {/* OTP Method selection for ABHA Number */}
                {selectedAuthMethod === "1004" && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">OTP Method</label>
                    <select
                      className="form-select"
                      value={otpMethod}
                      onChange={(e) => setOtpMethod(e.target.value)}
                    >
                      <option value="Mobile">Mobile</option>
                      <option value="Aadhaar">Aadhaar</option>
                    </select>
                    <small className="text-muted">Select how you want to receive the OTP</small>
                  </div>
                )}
                
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={handleSendOtp}
                    disabled={isLoading || !inputValue}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                      </>
                    ) : (
                      "Next"
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 1.5: Select ABHA Profile */}
            {currentStep === 1.5 && abhaProfiles.length > 0 && (
              <div className="tab-content">
                <h6 className="fw-bold mb-3">Select ABHA Profile</h6>
                
                <div className="mb-3">
                  <p className="text-muted mb-3">Multiple ABHA profiles found. Please select one to continue.</p>
                  
                  {abhaProfiles.map((profile, index) => (
                    <div 
                      key={index}
                      className={`card mb-2 ${selectedProfileIndex === index ? 'border-success bg-success bg-opacity-10' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedProfileIndex(index)}
                    >
                      <div className="card-body py-3">
                        <div className="d-flex align-items-center">
                          <div className="form-check me-3">
                            <input
                              className="form-check-input"
                              type="radio"
                              checked={selectedProfileIndex === index}
                              onChange={() => setSelectedProfileIndex(index)}
                              id={`profile-${index}`}
                            />
                          </div>
                          <div>
                            <label className="fw-bold" htmlFor={`profile-${index}`}>
                              {profile.name || "Unknown"}
                            </label>
                            <div className="text-muted small">
                              {profile.abhaNumber ? formatAbhaNumber(profile.abhaNumber) : "ABHA number pending"}
                              {profile.kycVerified && (
                                <span className="badge bg-success ms-2">KYC Verified</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={handleContinueWithProfile}
                    disabled={isLoading || abhaProfiles.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending OTP...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: OTP Verification */}
            {currentStep === 2 && (
              <div className="tab-content">
                <h6 className="fw-bold mb-3">ABHA Authentication</h6>
                
                <div className="text-center mb-4 p-3 bg-light rounded">
                  <p className="mb-1 text-muted">OTP has been sent to</p>
                  <p className="fw-bold fs-5 mb-0">
                    {selectedAuthMethod === "1002" 
                      ? getMaskedMobile(inputValue)
                      : selectedAuthMethod === "1004" 
                        ? `your ${otpMethod} registered number`
                        : getMaskedMobile(patientData?.mobileNo || "registered mobile number")
                    }
                  </p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Enter OTP</label>
                  <div className="d-flex gap-3 align-items-center flex-wrap">
                    <input
                      type="text"
                      className={`form-control ${otpError ? "is-invalid" : ""}`}
                      value={otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      style={{ maxWidth: "200px", fontSize: "1.5rem", textAlign: "center" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleResendOtp}
                      disabled={timer > 0 || isLoading}
                    >
                      {timer > 0 ? `Resend (${timer}s)` : "Resend OTP"}
                    </button>
                  </div>
                  {otpError && (
                    <div className="invalid-feedback d-block">{otpError}</div>
                  )}
                </div>
                
                <div className="mt-3 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={() => {
                      if (abhaProfiles.length > 0) {
                        setCurrentStep(1.5);
                      } else {
                        setCurrentStep(1);
                      }
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-grow-1"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || !otp || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 3: ABHA Card */}
            {currentStep === 3 && abhaProfile && (
              <div className="tab-content">
                <h6 className="fw-bold mb-3">ABHA Card</h6>
                
                <div className="alert alert-success mb-3">
                  <p className="mb-0">✓ ABHA verified successfully!</p>
                </div>
                
                {/* ABHA Profile Card */}
                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <h5 className="card-title mb-3">ABHA Profile</h5>
                        <div className="row g-2">
                          <div className="col-6">
                            <label className="text-muted small">Name</label>
                            <p className="fw-bold">{abhaProfile.name || "N/A"}</p>
                          </div>
                          <div className="col-6">
                            <label className="text-muted small">ABHA Number</label>
                            <p className="fw-bold">{formatAbhaNumber(abhaProfile.abhaNumber) || "N/A"}</p>
                          </div>
                          <div className="col-6">
                            <label className="text-muted small">ABHA Address</label>
                            <p className="fw-bold">{abhaProfile.abhaAddress || "N/A"}</p>
                          </div>
                          <div className="col-6">
                            <label className="text-muted small">Mobile Number</label>
                            <p className="fw-bold">{abhaProfile.mobileNumber || "N/A"}</p>
                          </div>
                          {abhaProfile.gender && (
                            <div className="col-6">
                              <label className="text-muted small">Gender</label>
                              <p className="fw-bold">{abhaProfile.gender}</p>
                            </div>
                          )}
                          {abhaProfile.dateOfBirth && (
                            <div className="col-6">
                              <label className="text-muted small">Date of Birth</label>
                              <p className="fw-bold">{abhaProfile.dateOfBirth}</p>
                            </div>
                          )}
                          {abhaProfile.address && (
                            <div className="col-12">
                              <label className="text-muted small">Address</label>
                              <p className="fw-bold">{abhaProfile.address}</p>
                            </div>
                          )}
                          {abhaProfile.stateName && (
                            <div className="col-6">
                              <label className="text-muted small">State</label>
                              <p className="fw-bold">{abhaProfile.stateName}</p>
                            </div>
                          )}
                          {abhaProfile.districtName && (
                            <div className="col-6">
                              <label className="text-muted small">District</label>
                              <p className="fw-bold">{abhaProfile.districtName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-4 text-center">
                        <div className="bg-light p-3 rounded">
                          {abhaProfile.photo ? (
                            <img 
                              src={abhaProfile.photo.startsWith('data:') 
                                ? abhaProfile.photo 
                                : `data:image/jpeg;base64,${abhaProfile.photo}`
                              } 
                              alt="ABHA Profile" 
                              className="img-fluid rounded-circle" 
                              style={{ width: "100px", height: "100px", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto" 
                                       style="width: 100px; height: 100px; font-size: 2.5rem;">
                                    ${abhaProfile.name?.charAt(0) || "A"}
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div 
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                              style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
                            >
                              {abhaProfile.name?.charAt(0) || "A"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-outline-primary flex-grow-1"
                    onClick={handleDownloadCard}
                    disabled={isLoading || !abhaProfile.xtoken}
                  >
                    <i className="fa fa-download me-2"></i>
                    Download ABHA Card
                  </button>
                  <button
                    type="button"
                    className="btn btn-success flex-grow-1"
                    onClick={handleUseAbha}
                  >
                    <i className="fa fa-check me-2"></i>
                    Use This ABHA
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {currentStep === 3 ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABHAVerificationModal;
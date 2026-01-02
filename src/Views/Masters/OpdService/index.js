import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_OPD_SERVICE, MAS_SERVICE_CATEGORY, MAS_DEPARTMENT, FILTER_OPD_DEPT, DOCTOR } from "../../../config/apiConfig";
import {ADD_OPD_SERVICE_SUCC_MSG,UPDATE_OPD_SERVICE_SUCC_MSG,FAIL_TO_SAVE_CHANGES,FAIL_TO_UPDATE_STS} from "../../../config/constants"

const OPDServiceMaster = () => {
  const [formData, setFormData] = useState({
    serviceCode: "",
    serviceName: "",
    baseTariff: "",
    serviceCategory: "",
    departmentId: "",
    doctorId: "",
    fromDate: "",
    toDate: "",
  })

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, serviceId: null, newStatus: false })

  const [searchQuery, setSearchQuery] = useState("")
  const [serviceOpdData, setServiceOpdData] = useState([])
  const [serviceCategoryData, setServiceCategoryData] = useState([])
  const [departmentData, setDepartmentData] = useState([]);
  const [doctorData, setDoctorData] = useState([]);
  const [rowDepartmentData, setRowDepartmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentItem, setCurrentItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const hospitalId = sessionStorage.getItem("hospitalId");
  const [process, setProcess] = useState(false);


  console.log("form data:", formData);

  useEffect(() => {
    fetchServiceOpdData();
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchServicecategoryData();
      fetchDepartmentData();
      if (formData.departmentId) {
      fetchDoctorData();
      }
    }
  }, [showForm, formData.departmentId]);


  const fetchServiceOpdData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_OPD_SERVICE}/getByHospitalId/${hospitalId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setServiceOpdData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setServiceOpdData([]);
      }
    } catch (error) {
      console.error("Error fetching Service Category data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicecategoryData = async () => {

    try {
      const data = await getRequest(`${MAS_SERVICE_CATEGORY}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setServiceCategoryData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setServiceCategoryData([]);
      }
    } catch (error) {
      console.error("Error fetching Service Category data:", error);
    }
  };

  const fetchDepartmentData = async () => {

    try {
      const data = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const filteredDepartments = data.response.filter(
          (dept) => dept.departmentTypeName === `${FILTER_OPD_DEPT}`
        );
        setRowDepartmentData(data.response);
        setDepartmentData(filteredDepartments);
      } else {
        console.error("Unexpected API response format:", data);
        setRowDepartmentData([]);
        setDepartmentData([]);
      }
    } catch (error) {
      console.error("Error fetching Department data:", error);
    }
  };

  const fetchDoctorData = async () => {
    try {
      const data = await getRequest(`${DOCTOR}/doctorBySpeciality/${formData.departmentId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setDoctorData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDoctorData([]);
      }
    } catch (error) {
      console.error("Error fetching Doctor data:", error);
    }
  };


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const filteredServiceList = serviceOpdData.filter(
    (item) =>
      item?.serviceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.serviceCategory?.serviceCatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.departmentId?.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.doctorId?.firstName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTotalPages = Math.ceil(filteredServiceList.length / itemsPerPage)

  const currentItems = filteredServiceList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (item) => {
    setEditingService(item)
    setShowForm(true)
    setFormData({
      serviceCode: item.serviceCode,
      serviceName: item.serviceName,
      baseTariff: item.baseTariff?.toString() || "",
      serviceCategory: item.serviceCategory?.id?.toString() || "",
      departmentId: item.departmentId?.id?.toString() || "",
      doctorId: item.doctorId?.userId?.toString() || "",
      fromDate: item.fromDt?.substring(0, 10) || "",
      toDate: item.toDt?.substring(0, 10) || "",
    });
    setIsFormValid(true)
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setProcess(true);
    if (!isFormValid) return;

    const payload = {
      serviceCode: formData.serviceCode,
      serviceName: formData.serviceName,
      baseTariff: parseFloat(formData.baseTariff),
      serviceCategory: parseInt(formData.serviceCategory, 10),
      departmentId: parseInt(formData.departmentId, 10),
      doctorId: parseInt(formData.doctorId, 10),
      hospitalId: parseInt(hospitalId, 10),
      fromDate: new Date(formData.fromDate).toISOString(),
      toDate: new Date(formData.toDate).toISOString()
    };


    try {
      let response;
      if (editingService) {
        response = await putRequest(
          `${MAS_OPD_SERVICE}/update/${editingService.id}`,
          payload
        );
        showPopup(UPDATE_OPD_SERVICE_SUCC_MSG, "success");
      } else {
        response = await postRequest(`${MAS_OPD_SERVICE}/save`, payload);
        showPopup(ADD_OPD_SERVICE_SUCC_MSG, "success");
      }

      // Refresh or update local state if needed here
      await fetchServiceOpdData?.();

      setEditingService(null);
      setShowForm(false);
      setFormData({
        serviceCode: "",
        serviceName: "",
        baseTariff: "",
        serviceCategory: "",
        departmentId: "",
        doctorId: "",
        fromDate: "",
        toDate: "",
      });
    } catch (error) {
      console.error("Error saving OPD Service:", error);
      showPopup(FAIL_TO_SAVE_CHANGES, "error");
    } finally {
      setProcess(false);
    }
  };


  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleSwitchChange = (id, name, newStatus) => {
    setCurrentItem(name);
    setConfirmDialog({ isOpen: true, serviceId: id, newStatus })
  }

    const handleConfirm = async (confirmed) => {
      if (confirmed && confirmDialog.serviceId !== null) {
        setProcess(true);
        try {
          const response = await putRequest(
            `${MAS_OPD_SERVICE}/updateStatus/${confirmDialog.serviceId}?status=${confirmDialog.newStatus}`
          );
  
          if (response.status === 200) {
            showPopup(
              `Service Category ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
              "success"
            );
            await fetchServiceOpdData();
          } else {
            throw new Error(response.message || "Failed to update status");
          }
        } catch (error) {
          console.error("Error updating status:", error);
          showPopup(FAIL_TO_UPDATE_STS, "error");
        } finally {
          setProcess(false);
        }
        setConfirmDialog({ isOpen: false, serviceId: null, newStatus: null });
      } else {
        setConfirmDialog({ isOpen: false, serviceId: null, newStatus: null });
      }
    }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({ ...prevData, [id]: value }))

    const updatedFormData = { ...formData, [id]: value }
    setIsFormValid(
      !!updatedFormData.serviceCode &&
      !!updatedFormData.serviceName &&
      !!updatedFormData.baseTariff &&
      !!updatedFormData.serviceCategory &&
      !!updatedFormData.departmentId &&
      !!updatedFormData.doctorId &&
      !!updatedFormData.fromDate &&
      !!updatedFormData.toDate,
    )
  }

  const handleSelectChange = (e) => {
    const { id, value } = e.target;

    const parsedValue = ["doctorId", "departmentId", "serviceCategory"].includes(id)
        ? parseInt(value, 10) || ""
        : value;

    const updatedFormData = { ...formData, [id]: parsedValue };

    setFormData(updatedFormData);

    setIsFormValid(
      !!updatedFormData.serviceCode &&
      !!updatedFormData.serviceName &&
      !!updatedFormData.baseTariff &&
      !!updatedFormData.serviceCategory &&
      !!updatedFormData.departmentId &&
      !!updatedFormData.doctorId &&
      !!updatedFormData.fromDate &&
      !!updatedFormData.toDate
    );
  };


  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
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

  return (
    <div className="content-wrapper">
      <div className="row">
        {loading && (
          <LoadingScreen />
        )}
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">OPD Service Master</h4>

              <div className="d-flex justify-content-between align-items-center">
                {!showForm && (
                  <>
                    <form className="d-inline-block searchform me-4" role="search">
                      <div className="input-group searchinput">
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search"
                          aria-label="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <span className="input-group-text" id="search-icon">
                          <i className="fa fa-search"></i>
                        </span>
                      </div>
                    </form>
                    <button
                      type="button"
                      className="btn btn-success me-2"
                      onClick={() => {
                        setEditingService(null);   // ✅ RESET EDIT MODE
                        setIsFormValid(false);
                        setFormData({
                          serviceCode: "",
                          serviceName: "",
                          baseTariff: "",
                          serviceCategory: "",
                          departmentId: "",
                          doctorId: "",
                          fromDate: "",
                          toDate: "",
                        });
                        setShowForm(true);
                      }}
                    >
                      <i className="mdi mdi-plus"></i> Add
                    </button>

                    {/* <button type="button" className="btn btn-success me-2">
                      <i className="mdi mdi-plus"></i> Generate Report
                    </button> */}
                  </>
                )}
              </div>
            </div>
            <div className="card-body">
              {!showForm ? (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Service Name</th>
                        <th>Base Tariff</th>
                        <th>Service Category</th>
                        <th>Department</th>
                        <th>Doctor</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.serviceName}</td>
                          <td>
                            {item.baseTariff !== undefined && item.baseTariff !== null
                              ? `₹${Number(item.baseTariff).toFixed(2)}`
                              : '₹0.00'
                            }
                          </td>
                          <td style={{ textTransform: "capitalize" }}>{item.serviceCategory.serviceCatName}</td>
                          <td>{item.departmentId.departmentName}</td>
                          <td>
                            {[item.doctorId?.firstName, item.doctorId?.middleName, item.doctorId?.lastName]
                              .filter(Boolean)
                              .join(" ")}
                          </td>
                          <td>{new Date(item.fromDt).toLocaleDateString()}</td>
                          <td>{new Date(item.toDt).toLocaleDateString()}</td>
                          <td>
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.status === "y"}
                                onChange={() => handleSwitchChange(item.id, item.serviceName, item.status === "y" ? "n" : "y")}
                                id={`switch-${item.id}`}
                              />
                              <label
                                className="form-check-label px-0"
                                htmlFor={`switch-${item.id}`}
                              >
                                {item.status === "y" ? "Active" : "Deactivated"}
                              </label>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(item)}
                              disabled={item.status !== "y"}
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <form className="forms row" onSubmit={handleSave}>
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      <i className="mdi mdi-arrow-left"></i> Back
                    </button>
                  </div>
                  <div className="row">
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Service Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="serviceCode"
                        placeholder="Service Code"
                        onChange={handleInputChange}
                        value={formData.serviceCode}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Service Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="serviceName"
                        placeholder="Service Name"
                        onChange={handleInputChange}
                        value={formData.serviceName}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Base Tariff <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="baseTariff"
                        placeholder="Base Tariff"
                        onChange={handleInputChange}
                        value={formData.baseTariff}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Service Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="serviceCategory"
                        onChange={handleSelectChange}
                        value={formData.serviceCategory}
                        required
                      >
                        <option value="">Select Service Category</option>
                        {serviceCategoryData.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.serviceCatName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Department <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="departmentId"
                        onChange={handleSelectChange}
                        value={formData.departmentId}
                        required
                      >
                        <option value="">Select Department</option>
                        {departmentData.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.departmentName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        Doctor <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="doctorId"
                        onChange={handleSelectChange}
                        value={formData.doctorId}
                        required
                      >
                        <option value="">Select Doctor</option>
                        {doctorData.map((doctor) => (
                          <option key={doctor.userId} value={doctor.userId}>
                            {doctor.firstName} {doctor.middleName} {doctor.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        From Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fromDate"
                        onChange={handleInputChange}
                        value={formData.fromDate}
                        required
                      />
                    </div>
                    <div className="form-group col-md-4 mt-3">
                      <label>
                        To Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="toDate"
                        onChange={handleInputChange}
                        value={formData.toDate}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group col-md-12 d-flex justify-content-end mt-2">

                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={process || !isFormValid}
                    >
                      {editingService ? 'Update' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowForm(false)}
                      disabled={process}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
              {confirmDialog.isOpen && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                  <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Confirm Status Change</h5>
                        <button type="button" className="close" onClick={() => handleConfirm(false)}>
                          <span>&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to {confirmDialog.newStatus === "y" ? "activate" : "deactivate"}{" "}
                          <strong>
                            {currentItem}
                          </strong>
                          ?
                        </p>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>
                          No
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!showForm && (
                <nav className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span>
                      Page {currentPage} of {filteredTotalPages} | Total Records: {filteredServiceList.length}
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
                    />
                    <button className="btn btn-primary" onClick={handlePageNavigation}>
                      Go
                    </button>
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OPDServiceMaster

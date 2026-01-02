import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_ITEM_SECTION, MAS_ITEM_TYPE } from "../../../config/apiConfig";


const ItemSection = () => {

  const [itemSectionData, setItemSectionData] = useState([])
  const [itemTypeData, setItemTypeData] = useState([])
  const [process, setProcess] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);


  useEffect(() => {
    fetchItemSection();
    fetchItemType();
  }, [])


  const fetchItemSection = async () => {
    try {
      const data = await getRequest(`${MAS_ITEM_SECTION}/getAll/0`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setItemSectionData(data.response)
      } else {
        setItemSectionData([])
      }
    } catch (error) {
      console.error("Error fetching Store Section data:", error)
    } finally {
    }
  }

  const fetchItemType = async () => {
    try {
      const data = await getRequest(`${MAS_ITEM_TYPE}/getByAll/1`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setItemTypeData(data.response)
      } else {
        console.error("Unexpected API response format:", data)
        setItemTypeData([])
      }
    } catch (error) {
      console.error("Error fetching Store Section data:", error)
    } finally {
    }
  }




  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, sectionId: null, newStatus: false })
  const [formData, setFormData] = useState({
    sectionCode: "",
    sectionName: "",
    itemType: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalFilteredItems, setTotalFilteredItems] = useState(0)
  const [pageInput, setPageInput] = useState("")
  const [searchType, setSearchType] = useState("name")
  const itemsPerPage = 5

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }


  const search = searchQuery.trim().toLowerCase();

  const filteredSections = itemSectionData.filter((section) => {
    const code = section?.sectionCode?.toLowerCase() || "";
    const name = section?.sectionName?.toLowerCase() || "";
    const typeName = section?.masItemTypeName?.toLowerCase() || "";

    const status = section?.status === "y" ? "active" : "deactivated";

    return (
      code.includes(search) ||
      name.includes(search) ||
      typeName.includes(search) ||
      status.includes(search)
    );
  });


  const filteredTotalPages = Math.ceil(filteredSections.length / itemsPerPage)

  const currentItems = filteredSections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (section) => {
    setEditingSection(section)
    setShowForm(true)
    setFormData({
      sectionCode: section.sectionCode,
      sectionName: section.sectionName,
      itemType: section.masItemType,
    })
    setIsFormValid(true)
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setProcess(true);
    try {
      let response;
      const payload = {
        sectionCode: formData.sectionCode,
        sectionName: formData.sectionName,

        masItemType: formData.itemType
      };

      if (editingSection) {
        // PUT request for updating
        response = await putRequest(
          `${MAS_ITEM_SECTION}/updateById/${editingSection.sectionId}`,  // This is correct
          payload
        );
      } else {
        // POST request for creating new
        response = await postRequest(`${MAS_ITEM_SECTION}/create`, payload);
      }

      if (response.status === 200) {
        showPopup(
          editingSection
            ? "Section updated successfully!"
            : "New section added successfully!",
          "success"
        );

        await fetchItemSection();

        setEditingSection(null);
        setShowForm(false);
        setFormData({
          sectionCode: "",
          sectionName: "",
          itemType: ""
        });
      } else {
        throw new Error(response.message || 'Failed to save section');
      }
    } catch (error) {
      console.error("Error saving section:", error);
      showPopup(error.message || "Error saving section. Please try again.", "error");
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
    setConfirmDialog({ isOpen: true, sectionId: id, newStatus });
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed && confirmDialog.sectionId !== null) {
      setProcess(true);
      try {
        const response = await putRequest(
          `${MAS_ITEM_SECTION}/status/${confirmDialog.sectionId}?status=${confirmDialog.newStatus}`

        );

        if (response.status === 200) {
          showPopup(
            `Section ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
            "success"
          );
          await fetchItemSection(); // Refresh the data
        } else {
          throw new Error(response.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        showPopup(error.message || "Error updating status. Please try again.", "error");
      } finally {
        setProcess(false);
      }
    }
    setConfirmDialog({ isOpen: false, sectionId: null, newStatus: null });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target
    const fieldMapping = {
      sectioncode: "sectionCode",
      sectionname: "sectionName",
      itemType: "itemType",
    }

    setFormData({
      ...formData,
      [fieldMapping[id] || id]: value,
    })

    // Check if all required fields have values
    const updatedFormData = { ...formData, [fieldMapping[id] || id]: value }
    setIsFormValid(!!updatedFormData.sectionCode && !!updatedFormData.sectionName && !!updatedFormData.itemType)
  }

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
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">Item Section Master</h4>
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
                  <button type="button" className="btn btn-success me-2" onClick={() => {
                    setShowForm(true);
                    setEditingSection(null);  // Reset editing state
                    setFormData({            // Reset form data
                      sectionCode: "",
                      sectionName: "",
                      itemType: ""
                    });
                    setIsFormValid(false);   // Reset validation
                  }}>
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
                    <th>Section Code</th>
                    <th>Section Name</th>
                    <th>Item Type</th>
                    <th>Status</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((section) => (
                    <tr key={section.sectionId}>
                      <td>{section.sectionCode}</td>
                      <td>{section.sectionName}</td>
                      <td>{section.masItemTypeName}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={section.status === "y"}
                            onChange={() => handleSwitchChange(section.sectionId, section.sectionName, section.status === "y" ? "n" : "y")}
                            id={`switch-${section.sectionId}`}
                          />
                          <label
                            className="form-check-label px-0"
                            htmlFor={`switch-${section.sectionId}`}
                            onClick={() => handleSwitchChange(section.sectionId, section.status === "y" ? "n" : "y")}
                          >
                            {section.status === "y" ? "Active" : "Deactivated"}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleEdit(section)}
                          disabled={section.status !== "y"}
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
                    Section Code <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="sectioncode"
                    placeholder="Section Code"
                    onChange={handleInputChange}
                    value={formData.sectionCode}
                    required
                  />
                </div>
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Section Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="sectionname"
                    placeholder="Section Name"
                    onChange={handleInputChange}
                    value={formData.sectionName}
                    required
                  />
                </div>
                <div className="form-group col-md-4 mt-3">
                  <label>
                    Item Type <span className="text-danger">*</span>
                  </label>
                  <div className="col-md-12">
                    <select
                      className="form-select"
                      id="itemType"
                      onChange={handleInputChange}
                      value={formData.itemType}
                      required
                    >
                      <option value="" disabled>
                        Select Item Type
                      </option>
                      {itemTypeData.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group col-md-12 d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary me-2">
                  {editingSection ? "Update" : "Add"}
                </button>
                <button className="btn btn-danger me-2" onClick={() => setShowForm(false)}>
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
                  Page {currentPage} of {filteredTotalPages} | Total Records: {filteredSections.length}
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
    </div >
    </div >
  )
}

export default ItemSection;

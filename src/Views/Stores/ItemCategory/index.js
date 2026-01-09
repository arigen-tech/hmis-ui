import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_ITEM_CATEGORY, MAS_ITEM_SECTION } from "../../../config/apiConfig";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const ItemCategory = () => {
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null, newStatus: false })
    const [formData, setFormData] = useState({
        sectionType: "",
        categoryCode: "",
        categoryName: "",
    })
    const [itemSectionData, setItemSectionData] = useState([])
    const [itemCategories, setItemCategories] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [popupMessage, setPopupMessage] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [currentItem, setCurrentItem] = useState(null)
    const [process, setProcess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchItemCategoryData();
        fetchItemSectionData();
    }, []);

    const fetchItemCategoryData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_ITEM_CATEGORY}/getAll/0`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemCategories(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setItemCategories([]);
            }
        } catch (error) {
            console.error("Error fetching Service Category data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchItemSectionData = async () => {
        try {
            const data = await getRequest(`${MAS_ITEM_SECTION}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setItemSectionData(data.response);
            } else {
                setItemSectionData([]);
                console.error("Unexpected API response format for sections:", data);
            }
        } catch (error) {
            console.error("Error fetching Item Section data:", error);
        }
    }

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    }

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const search = searchQuery.trim().toLowerCase();

    const filteredItemCategories = itemCategories.filter((category) => {
        const code = category?.itemCategoryCode?.toLowerCase() || "";
        const name = category?.itemCategoryName?.toLowerCase() || "";
        const section = category?.sectionName?.toLowerCase() || "";

        // Convert status into readable text
        const status = category?.status === "y" ? "active" : "deactivated";

        return (
            code.includes(search) ||
            name.includes(search) ||
            section.includes(search) ||
            status.includes(search)
        );
    });

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredItemCategories.slice(indexOfFirst, indexOfLast);

    const handleEdit = (item) => {
        setEditingCategory(item);
        setShowForm(true);
        setFormData({
            categoryName: item.itemCategoryName,
            categoryCode: item.itemCategoryCode,
            sectionType: item.sectionId,
        });
        setIsFormValid(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setProcess(true);
        try {
            let response;
            const payload = {
                itemCategoryCode: formData.categoryCode,
                itemCategoryName: formData.categoryName,
                sectionId: formData.sectionType,
            };

            if (editingCategory) {
                response = await putRequest(`${MAS_ITEM_CATEGORY}/updateById/${editingCategory.itemCategoryId}`, payload);
            } else {
                response = await postRequest(`${MAS_ITEM_CATEGORY}/create`, payload);
            }

            if (response.status === 200) {
                showPopup(
                    editingCategory
                        ? "Item Category updated successfully!"
                        : "New Item Category added successfully!",
                    "success"
                );

                await fetchItemCategoryData();

                setEditingCategory(null);
                setShowForm(false);
                setFormData({
                    categoryName: "",
                    categoryCode: "",
                    sectionType: "",
                });
            } else {
                throw new Error(response.message || 'Failed to save item Category');
            }
        } catch (error) {
            console.error("Error saving item Category:", error);
            showPopup(error.message || "Error saving item Category. Please try again.", "error");
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
        setConfirmDialog({ isOpen: true, categoryId: id, newStatus });
    }

    const handleConfirm = async (confirmed) => {
        if (confirmed && confirmDialog.categoryId !== null) {
            setProcess(true);
            try {
                const response = await putRequest(
                    `${MAS_ITEM_CATEGORY}/status/${confirmDialog.categoryId}?status=${confirmDialog.newStatus}`
                );

                if (response.status === 200) {
                    showPopup(
                        `Service Category ${confirmDialog.newStatus === 'y' ? 'activated' : 'deactivated'} successfully!`,
                        "success"
                    );
                    await fetchItemCategoryData();
                } else {
                    throw new Error(response.message || "Failed to update status");
                }
            } catch (error) {
                console.error("Error updating status:", error);
                showPopup(error.message || "Error updating status. Please try again.", "error");
            } finally {
                setProcess(false);
            }
            setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
        } else {
            setConfirmDialog({ isOpen: false, categoryId: null, newStatus: null });
        }
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target
        const fieldMapping = {
            itemcategorycode: "categoryCode",
            itemcategoryname: "categoryName",
            SectionType: "sectionType",
            templateSelect: "sectionType",
        }

        setFormData({
            ...formData,
            [fieldMapping[id] || id]: value,
        })

        // Check if all required fields have values
        const updatedFormData = { ...formData, [fieldMapping[id] || id]: value }
        setIsFormValid(!!updatedFormData.sectionType && !!updatedFormData.categoryCode && !!updatedFormData.categoryName)
    }

    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchItemCategoryData();
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Item Category</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Item Category"
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                            />
                                            <span className="input-group-text" id="search-icon">
                                                <i className="fa fa-search"></i>
                                            </span>
                                        </div>
                                    </form>
                                ) : (
                                    <></>
                                )}

                                <div className="d-flex align-items-center">
                                    {!showForm ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2"
                                                onClick={() => setShowForm(true)}
                                            >
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-success me-2 flex-shrink-0"
                                                onClick={handleRefresh}
                                            >
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={() => {
                                            setShowForm(false);
                                            setFormData({
                                                categoryName: "",
                                                categoryCode: "",
                                                sectionType: "",
                                            });
                                            setEditingCategory(null);
                                        }}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <LoadingScreen />
                            ) : !showForm ? (
                                <>
                                    <div className="table-responsive packagelist">
                                        <table className="table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Item Category Code</th>
                                                    <th>Item Category Name</th>
                                                    <th>Section</th>
                                                    <th>Status</th>
                                                    <th>Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map((category) => (
                                                    <tr key={category.itemCategoryId}>
                                                        <td>{category.itemCategoryCode}</td>
                                                        <td>{category.itemCategoryName}</td>
                                                        <td>{category.sectionName}</td>
                                                        <td>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={category.status === "y"}
                                                                    onChange={() => handleSwitchChange(category.itemCategoryId, category.itemCategoryName, category.status === "y" ? "n" : "y")}
                                                                    id={`switch-${category.id}`}
                                                                />
                                                                <label className="form-check-label px-0" htmlFor={`switch-${category.itemCategoryId}`}>
                                                                    {category.status === "y" ? "Active" : "Deactivated"}
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-success me-2"
                                                                onClick={() => handleEdit(category)}
                                                                disabled={category.status !== "y"}
                                                            >
                                                                <i className="fa fa-pencil"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {filteredItemCategories.length > 0 && (
                                        <Pagination
                                            totalItems={filteredItemCategories.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    
                                    <div className="row">
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Category Code <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="itemcategorycode"
                                                placeholder="Category Code"
                                                onChange={handleInputChange}
                                                value={formData.categoryCode}
                                                required
                                            />
                                        </div>
                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Item Class Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="itemcategoryname"
                                                placeholder="Item Class Name"
                                                onChange={handleInputChange}
                                                value={formData.categoryName}
                                                required
                                            />
                                        </div>

                                        <div className="form-group col-md-4 mt-3">
                                            <label>
                                                Section <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select"
                                                id="sectionType"
                                                value={formData.sectionType}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Item Section</option>
                                                {itemSectionData.map((sec) => (
                                                    <option key={sec.sectionId} value={sec.sectionId}>
                                                        {sec.sectionName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary me-2"
                                            disabled={process || !isFormValid}
                                        >
                                            {editingCategory ? 'Update' : 'Save'}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setShowForm(false);
                                                setFormData({
                                                    categoryName: "",
                                                    categoryCode: "",
                                                    sectionType: "",
                                                });
                                                setEditingCategory(null);
                                            }}
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
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default ItemCategory
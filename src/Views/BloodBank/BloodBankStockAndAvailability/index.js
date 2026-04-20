import { useEffect, useState, useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  BANK_BLOOD_STOCK_AVAILABILITY,
  MAS_BLOOD_COLLECTION_TYPE,
  MAS_BLOOD_COMPONENT,
  MAS_BLOOD_INVENTORY_STATUS,
  MAS_BLOODGROUP,
} from "../../../config/apiConfig";
import { getRequest } from "../../../service/apiService";

const BloodBankStockAndAvailability = () => {
  const [popupMessage, setPopupMessage] = useState(null);
  const [tableView, setTableView] = useState("S");
  const [componentData, setComponentData] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [collectionTypeData, setCollectionTypeData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [inventoryStatusData, setInventoryStatusData] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    bloodGroupId: "",
    componentId: "",
    inventoryStatus: "",
    expiryFilter: "",
    collectionType: "",
  });

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // reset to first page on filter change
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchBloodGroups(),
        fetchComponentTypeData(),
        fetchCollectionTypeData(),
        fetchInventoryStatusData(),
      ]);
      await fetchStockData();
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [filters, tableView]);

  const fetchInventoryStatusData = async () => {
    try {
      const res = await getRequest(`${MAS_BLOOD_INVENTORY_STATUS}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        const mapped = res.response
          .filter((item) => item.status === "y")
          .map((item) => ({
            id: item.inventoryStatusId,
            name: item.statusCode.trim(),
            desc: item.description,
          }));
        setInventoryStatusData(mapped);
      }
    } catch (e) {
      console.error("Inventory status fetch error", e);
      showPopup("Failed to load inventory status", "error");
    }
  };

  const fetchComponentTypeData = async () => {
    try {
      const res = await getRequest(`${MAS_BLOOD_COMPONENT}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        const mapped = res.response
          .filter((item) => item.status === "y")
          .map((item) => ({
            id: item.componentId,
            name: item.componentName,
            code: item.componentCode,
          }));
        setComponentData(mapped);
      }
    } catch (e) {
      console.error("Component fetch error", e);
      showPopup("Failed to load component types", "error");
    }
  };

  const fetchBloodGroups = async () => {
    try {
      const res = await getRequest(`${MAS_BLOODGROUP}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        const mapped = res.response.map((item) => ({
          id: item.bloodGroupId,
          name: item.bloodGroupName,
          code: item.bloodGroupCode,
        }));
        setBloodGroups(mapped);
      }
    } catch (e) {
      console.error("Blood group fetch error", e);
    }
  };

  const fetchCollectionTypeData = async () => {
    try {
      const res = await getRequest(`${MAS_BLOOD_COLLECTION_TYPE}/getAll/1`);
      if (res?.status === 200 && res?.response) {
        const mapped = res.response
          .filter((item) => item.status === "y")
          .map((item) => ({
            id: item.collectionTypeId,
            name: item.collectionTypeName,
            code: item.collectionTypeCode,
          }));
        setCollectionTypeData(mapped);
      }
    } catch (e) {
      console.error("Collection Type fetch error", e);
      showPopup("Failed to load collection types", "error");
    }
  };

  const fetchStockData = async () => {
    try {
      setIsTableLoading(true);

      const params = new URLSearchParams();

      if (filters.bloodGroupId)
        params.append("bloodGroupId", filters.bloodGroupId);
      if (filters.componentId)
        params.append("componentId", filters.componentId);
      if (filters.inventoryStatus)
        params.append("inventoryStatus", Number(filters.inventoryStatus));
      if (filters.expiryFilter)
        params.append("expiryFilter", filters.expiryFilter);
      if (filters.collectionType)
        params.append("collectionType", filters.collectionType);

      params.append("viewType", tableView);

      const res = await getRequest(
        `${BANK_BLOOD_STOCK_AVAILABILITY}?${params.toString()}`
      );

      if (res?.status === 200 && res?.response) {
        setTableData(res.response);
      } else {
        setTableData([]);
      }
    } catch (e) {
      showPopup("Failed to load stock data", "error");
    } finally {
      setIsTableLoading(false);
    }
  };

  // Pagination logic
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentTableData = tableData.slice(indexOfFirst, indexOfLast);

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
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                BLOOD BANK STOCK AND AVAILABILITY
              </h4>
            </div>
            <div className="card-body">
              {/* TOP FILTERS: Blood Group & Component Type */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Blood Group</label>
                  <select
                    className="form-select"
                    name="bloodGroupId"
                    value={filters.bloodGroupId}
                    onChange={handleFilterChange}
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        {bg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Component Type</label>
                  <select
                    className="form-select"
                    name="componentId"
                    value={filters.componentId}
                    onChange={handleFilterChange}
                  >
                    <option value="">Select Component Type</option>
                    {componentData.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* INVENTORY FILTERS */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Inventory Status</label>
                  <select
                    className="form-select"
                    name="inventoryStatus"
                    value={filters.inventoryStatus}
                    onChange={handleFilterChange}
                  >
                    <option value="">Select Inventory Status</option>
                    {inventoryStatusData.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Expiry</label>
                  <select
                    className="form-select"
                    name="expiryFilter"
                    value={filters.expiryFilter}
                    onChange={handleFilterChange}
                  >
                    <option value="">Select Expiry</option>
                    <option value="24">Expiring in 24 hrs</option>
                    <option value="3">Expiring in 3 days</option>
                    <option value="7">Expiring in 7 days</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Collection Type</label>
                  <select
                    className="form-select"
                    name="collectionType"
                    value={filters.collectionType}
                    onChange={handleFilterChange}
                  >
                    <option value="">Select Collection Type</option>
                    {collectionTypeData.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TABLE VIEW SELECTOR with Report Button inline */}
              <div className="row mb-4">
                <div className="col-12 d-flex align-items-center justify-content-between">
                  <div>
                    <label className="form-label fw-bold d-block mb-2">
                      Select View
                    </label>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="tableView"
                        id="viewSummary"
                        checked={tableView === "S"}
                        onChange={() => {
                          setTableView("S");
                          setCurrentPage(1);
                        }}
                      />
                      <label className="form-check-label" htmlFor="viewSummary">
                        Blood Bank Stock Summary
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="tableView"
                        id="viewDetail"
                        checked={tableView === "SL"}
                        onChange={() => {
                          setTableView("SL");
                          setCurrentPage(1);
                        }}
                      />
                      <label className="form-check-label" htmlFor="viewDetail">
                        Detailed Blood Stock List
                      </label>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-primary"
                    >
                      Report
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLE DISPLAY */}
              {tableView === "S" && (
                <div className="card mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Blood Bank Stock Summary</h6>
                  </div>
                  <div className="card-body p-0 position-relative">
                   
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Blood Group</th>
                            <th>PRBC</th>
                            <th>Plasma</th>
                            <th>Platelets</th>
                            <th>Cryo</th>
                            <th>Total Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTableData.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4">
                                No data found
                              </td>
                            </tr>
                          ) : (
                            currentTableData.map((row, i) => (
                              <tr key={i}>
                                <td>{row.bloodGroup}</td>
                                <td>{row.prbc}</td>
                                <td>{row.plasma}</td>
                                <td>{row.platelets}</td>
                                <td>{row.cryo}</td>
                                <td>{row.totalUnits}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {tableView === "SL" && (
                <div className="card mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Detailed Blood Stock List</h6>
                  </div>
                  <div className="card-body p-0 position-relative">
                    
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Unit No.</th>
                            <th>Component</th>
                            <th>Blood Group</th>
                            <th>Volume(ml)</th>
                            <th>Expiry Date</th>
                            <th>Status</th>
                            <th>Reserved For</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTableData.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-4">
                                No data found
                              </td>
                            </tr>
                          ) : (
                            currentTableData.map((row, i) => (
                              <tr key={i}>
                                <td>{row.unitNo}</td>
                                <td>{row.component}</td>
                                <td>{row.bloodGroup}</td>
                                <td>{row.volumeMl}</td>
                                <td>{row.expiryDate}</td>
                                <td>{row.status}</td>
                                <td>{row.reservedFor || "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodBankStockAndAvailability;
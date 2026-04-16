import { useEffect, useState, useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
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
  const [filters, setFilters] = useState({
    bloodGroupId: "",
    componentId: "",
    inventoryStatus: "",
    expiryFilter: "",
    collectionType: "",
  });

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
        `${BANK_BLOOD_STOCK_AVAILABILITY}?${params.toString()}`,
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

  return (
    <div className="body d-flex py-3">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <style>{`
        .table-scroll-container {
          max-height: 300px;
          overflow-y: auto;
          overflow-x: auto;
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
        }

        .table-scroll-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .table-scroll-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .table-scroll-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .sticky-header {
          position: sticky;
          top: 0;
          background: #f8f9fa;
          z-index: 10;
        }

        .sticky-header th {
          background: #f8f9fa;
          font-weight: 600;
        }
      `}</style>

      <div className="container-fluid">
        {/* HEADER */}
        <div className="row mb-3">
          <div className="col-12">
            <h3 className="fw-bold">Blood Bank Stock And Availability</h3>
          </div>
        </div>

        {/* TOP FILTERS */}
        <div className="card shadow mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-bold">Blood Group</label>
                <select
                  className="form-select"
                  name="bloodGroupId"
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
          </div>
        </div>

        {/* INVENTORY FILTER */}
        <div className="card shadow mb-4">
          <div className="card-header">
            <h6 className="fw-bold mb-0">Inventory</h6>
          </div>

          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label fw-bold">Inventory Status</label>
                <select
                  className="form-select"
                  name="inventoryStatus"
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

              <div className="col-md-4">
                <label className="form-label fw-bold">Expiry</label>
                <select
                  className="form-select"
                  name="expiryFilter"
                  onChange={handleFilterChange}
                >
                  <option value="">Select Expiry</option>
                  <option value="24">Expiring in 24 hrs</option>
                  <option value="3">Expiring in 3 days</option>
                  <option value="7">Expiring in 7 days</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold">Collection Type</label>
                <select
                  className="form-select"
                  name="collectionType"
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
          </div>
        </div>

        {/* TABLE SELECTOR */}
        <div className="card shadow mb-3">
          <div className="card-body">
            <label className="form-label fw-bold d-block mb-2">
              Select Tables
            </label>

            <div className="form-check form-check-inline">
              <input
                type="radio"
                name="tableView"
                checked={tableView === "S"}
                onChange={() => {
                  setTableView("S");
                }}
              />
              <label className="form-check-label">
                Blood Bank Stock Summary
              </label>
            </div>

            <div className="form-check form-check-inline">
              <input
                type="radio"
                name="tableView"
                checked={tableView === "SL"}
                onChange={() => {
                  setTableView("SL");
                }}
              />
              <label className="form-check-label">
                Detailed Blood Stock List
              </label>
            </div>
          </div>
        </div>

        {/* TABLES */}
        {tableView === "S" && (
          <div className="card shadow mb-3">
            <div className="card-header">
              <h6 className="fw-bold mb-0">Blood Bank Stock Summary</h6>
            </div>
            <div className="card-body p-0 position-relative">
              {isTableLoading && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 999,
                    borderRadius: "0.25rem",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              )}
              <div className={tableData.length > 10 ? "table-scroll-container" : ""}>
                <table className="table table-bordered table-striped mb-0 text-center">
                  <thead className="sticky-header">
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
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, i) => (
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
          <div className="card shadow mb-3">
            <div className="card-header">
              <h6 className="fw-bold mb-0">Detailed Blood Stock List</h6>
            </div>
            <div className="card-body p-0 position-relative">
              {isTableLoading && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 999,
                    borderRadius: "0.25rem",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              )}
              <div className={tableData.length > 10 ? "table-scroll-container" : ""}>
                <table className="table table-bordered table-striped mb-0 text-center">
                  <thead className="sticky-header">
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
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, i) => (
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
  );
};

export default BloodBankStockAndAvailability;

import { useState } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const COMPONENTS = [
  "Whole Blood",
  "Packed Red Blood Cells (PRBC)",
  "Fresh Frozen Plasma (FFP)",
  "Platelets",
  "Cryoprecipitate",
  "Granulocytes",
];

const INVENTORY_STATUS = ["Available", "Reserved", "Allocated", "Expired"];

const STORAGE_LOCATIONS = [
  "Main BB - Rack A, Shelf 1",
  "Main BB - Rack A, Shelf 2",
  "Main BB - Rack A, Shelf 3",
  "Main BB - Rack A, Shelf 4",
  "Main BB - Rack B, Shelf 1",
  "Main BB - Rack B, Shelf 2",
  "Main BB - Rack B, Shelf 3",
  "Main BB - Rack C, Shelf 1",
  "Main BB - Rack C, Shelf 2",
  "Main BB - Rack D, Shelf 1",
];

const ComponentWiseStockReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);


  const handleSearch = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
      setCurrentPage(1);
    }, 1000);
  };

  const handleClear = () => {
    setShowReport(false);
    setCurrentPage(1);
  };

  const stockData = [
    {
      id: "1",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "O+",
      available: 15,
      reserved: 3,
      allocated: 2,
      expired: 1
    },
    {
      id: "2",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "A+",
      available: 12,
      reserved: 2,
      allocated: 1,
      expired: 0
    },
    {
      id: "3",
      component: "Packed Red Blood Cells (PRBC)",
      bloodGroup: "B-",
      available: 8,
      reserved: 1,
      allocated: 0,
      expired: 0
    },
    {
      id: "4",
      component: "Platelets",
      bloodGroup: "A+",
      available: 6,
      reserved: 1,
      allocated: 0,
      expired: 0
    },
    {
      id: "5",
      component: "Platelets",
      bloodGroup: "O+",
      available: 4,
      reserved: 2,
      allocated: 1,
      expired: 0
    },
    {
      id: "6",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "B-",
      available: 4,
      reserved: 0,
      allocated: 1,
      expired: 0
    },
    {
      id: "7",
      component: "Fresh Frozen Plasma (FFP)",
      bloodGroup: "AB+",
      available: 3,
      reserved: 1,
      allocated: 0,
      expired: 0
    },
    {
      id: "8",
      component: "Cryoprecipitate",
      bloodGroup: "AB+",
      available: 2,
      reserved: 0,
      allocated: 0,
      expired: 0
    },
    {
      id: "9",
      component: "Cryoprecipitate",
      bloodGroup: "O-",
      available: 1,
      reserved: 0,
      allocated: 0,
      expired: 0
    },
    {
      id: "10",
      component: "Whole Blood",
      bloodGroup: "O-",
      available: 5,
      reserved: 1,
      allocated: 0,
      expired: 1
    }
  ];

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = stockData.slice(indexOfFirst, indexOfLast);

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
              <h4 className="card-title p-2 mb-0">COMPONENT-WISE STOCK REPORT</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Component</label>
                  <select
                    className="form-control"
                    defaultValue=""
                  >
                    <option value="">All Components</option>
                    {COMPONENTS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Blood Group</label>
                  <select
                    className="form-control"
                    defaultValue=""
                  >
                    <option value="">All Blood Groups</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Inventory Status</label>
                  <select
                    className="form-control"
                    defaultValue=""
                  >
                    <option value="">All Status</option>
                    {INVENTORY_STATUS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Storage Location</label>
                  <select
                    className="form-control"
                    defaultValue=""
                  >
                    <option value="">All Locations</option>
                    {STORAGE_LOCATIONS.map((loc, index) => (
                      <option key={index} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                 
                </div>
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {!isGenerating && showReport && (
                <>
                  

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead >
                        <tr>
                          <th>Component</th>
                          <th>Blood Group</th>
                          <th className="text-center">Available Units</th>
                          <th className="text-center">Reserved Units</th>
                          <th className="text-center">Allocated Units</th>
                          <th className="text-center">Expired Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item) => (
                            <tr key={item.id}>
                              <td>{item.component}</td>
                              <td className="fw-bold">{item.bloodGroup}</td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.available}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.reserved}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.allocated}</span>
                              </td>
                              <td className="text-center">
                                <span className="fw-bold ">{item.expired}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              No Record Found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {stockData.length > DEFAULT_ITEMS_PER_PAGE && (
                    <Pagination
                      totalItems={stockData.length}
                      itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}

             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentWiseStockReport;
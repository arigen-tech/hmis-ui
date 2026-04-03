 import { useState } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";

const BloodBankStockAndAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const [tableView, setTableView] = useState("summary");

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="body d-flex py-3">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

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
                <select className="form-select">
                  <option>Select Blood Group</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold">Component Type</label>
                <select className="form-select">
                  <option>Select Component Type</option>
                  <option>Whole Blood</option>
                  <option>Packed Red Cells</option>
                  <option>Platelets</option>
                  <option>Plasma</option>
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
                <select className="form-select">
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="ISSUED">ISSUED</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold">Expiry</label>
                <select className="form-select">
                  <option value="">Select Expiry</option>
                  <option value="24">Expiring in 24 hrs</option>
                  <option value="3">Expiring in 3 days</option>
                  <option value="7">Expiring in 7 days</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold">Collection Type</label>
                <select className="form-select">
                  <option value="">Select Collection Type</option>
                  <option value="VOLUNTARY">Voluntary</option>
                  <option value="REPLACEMENT">Replacement</option>
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
                className="form-check-input"
                type="radio"
                name="tableView"
                checked={tableView === "summary"}
                onChange={() => setTableView("summary")}
              />
              <label className="form-check-label">
                Blood Bank Stock Summary
              </label>
            </div>

            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="tableView"
                checked={tableView === "detailed"}
                onChange={() => setTableView("detailed")}
              />
              <label className="form-check-label">
                Detailed Blood Stock List
              </label>
            </div>
          </div>
        </div>

        {/* SUMMARY TABLE */}
        {tableView === "summary" && (
          <div className="card shadow mb-3">
            <div className="card-header">
              <h6 className="fw-bold mb-0">Blood Bank Stock Summary</h6>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-striped mb-0 text-center">
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
                    <tr>
                      <td>A+</td>
                      <td>12</td>
                      <td>8</td>
                      <td>5</td>
                      <td>3</td>
                      <td>28</td>
                    </tr>
                    <tr>
                      <td>O+</td>
                      <td>20</td>
                      <td>15</td>
                      <td>10</td>
                      <td>5</td>
                      <td>50</td>
                    </tr>
                  </tbody>

                </table>
              </div>
            </div>
          </div>
        )}

        {/* DETAILED TABLE */}
        {tableView === "detailed" && (
          <div className="card shadow mb-3">

            <div className="card-header">
              <h6 className="fw-bold mb-0">Detailed Blood Stock List</h6>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">

                <table className="table table-bordered table-striped mb-0 text-center">

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
                    <tr>
                      <td>PRBC-001</td>
                      <td>PRBC</td>
                      <td>O+</td>
                      <td>240</td>
                      <td>2025-08-18</td>
                      <td>Available</td>
                      <td>-</td>
                    </tr>

                    <tr>
                      <td>PRBC-002</td>
                      <td>Plasma</td>
                      <td>B+</td>
                      <td>200</td>
                      <td>2025-08-18</td>
                      <td>Available</td>
                      <td>-</td>
                    </tr>

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
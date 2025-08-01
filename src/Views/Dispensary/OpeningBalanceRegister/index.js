import { useState } from "react"

const OpeningBalanceRegister = () => {
  const [fromDate, setFromDate] = useState("2025-07-17")
  const [toDate, setToDate] = useState("2025-07-17")

  const handleGeneratePDF = () => {
    console.log("Generating PDF report from", fromDate, "to", toDate)
  }

  const handleGenerateExcel = () => {
    console.log("Generating Excel report from", fromDate, "to", toDate)
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Register</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-2">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-8 d-flex align-items-end gap-2">
                  <button type="button" className="btn btn-warning" onClick={handleGeneratePDF}>
                    Generate PDF Report
                  </button>
                  <button type="button" className="btn btn-success" onClick={handleGenerateExcel}>
                    Excel Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceRegister

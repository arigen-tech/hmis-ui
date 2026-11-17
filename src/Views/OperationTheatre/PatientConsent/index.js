import { useState } from "react";

const PatientConsent = () => {
    const [patientConsentInfo, setPatientConsentInfo] = useState(false);
    const [showDocument, setShowDocument] = useState(false);



    // ============================================================
    // OT PRE-OPERATIVE CHECKLIST MODAL (with fixed positioning to avoid sidebar)
    // ============================================================
    if (patientConsentInfo) {
        return (
            <>
                <div className="content-wrapper">
                    <div className="card form-card">

                        <div className="card-header">
                            <div className="d-flex align-items-center gap-1">
                                <button className="btn-back" title="Back to PAC Pending List" onClick={() => setPatientConsentInfo(false)}><i className="icofont-arrow-left"></i></button>
                                <h4 className="card-title p-2 mb-0">Patient Consent Management</h4>
                            </div>
                        </div>

                        <div className="card-body">

                            <div className="mb-3">
                                <h6 className="fw-bold text-primary mb-2">Patient Information</h6>
                                <section className="patient-card ">
                                    <div className="patient-header">
                                        <h4>Rahul Sharma</h4>
                                        <p>UHID / IP No: <strong> UHID10025/IPD2001</strong></p>
                                    </div>

                                    <div className="details-grid grid-col-3">
                                        <div className="detail-item">
                                            <span className="detail-label">Mobile No.</span>
                                            <span className="detail-value">98765 XXXXX</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Age / Gender</span>
                                            <span className="detail-value">45 Years / Male</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Ward</span>
                                            <span className="detail-value">Surgical Ward</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Bed No.</span>
                                            <span className="detail-value">SW-12</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">OT Booking No.</span>
                                            <span className="detail-value">OT-1001</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold small mb-1">Consent Type <span className="text-danger">*</span></label>
                                    <select className="form-select">
                                        <option value="">Surgery / Procedure Consent</option>
                                        <option value=""></option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold">Remarks</label>
                                    <textarea className="form-control" rows="2" placeholder="Enter consent remarks" style={{ height: "60px" }}></textarea>
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold small mb-1">Consent Document <span className="text-danger">*</span></label>
                                    <input type="file" className="form-control form-control-sm" />
                                    <div className="d-flex  justify-content-between">
                                        <small>Upload signed consent form</small>
                                        <small>PDF, JPG or PNG</small>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <button type="button" className="btn btn-secondary me-2" onClick={() => setPatientConsentInfo(false)}>Cancel</button>
                                <button className="btn btn-primary">Submit</button>
                            </div>


                            <div className="">
                                <hr />
                                <h6 className="fw-bold text-primary mb-2">Uploaded Consent History</h6>
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>S. No</th>
                                                <th>Consent Type</th>
                                                <th>Remarks</th>
                                                <th>Document</th>
                                                <th>Uploaded By</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ cursor: "pointer" }} onClick={() => setShowDocument(true)}>
                                                <td>1</td>
                                                <td>Surgery Consent</td>
                                                <td>Signed by patient</td>
                                                <td><span className="link">consent_surgery.pdf</span></td>
                                                <td>nurse01</td>
                                            </tr>
                                            <tr style={{ cursor: "pointer" }} onClick={() => setShowDocument(true)}>
                                                <td>2</td>
                                                <td>Anaesthesia Consent</td>
                                                <td>Signed consent received</td>
                                                <td><span className="link">consent_anaesthesia.pdf</span></td>
                                                <td>nurse02</td>
                                            </tr>

                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                { showDocument && <div className="modal show d-block " tabindex="-1" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: "9999" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-semibold">Document Name</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDocument(false)}></button>
                            </div>
                            <div className="modal-body">
                                <h2>Consent document preview here...</h2>
                            </div>
                            {/* <div className="modal-footer">
                                <button className="btn btn-secondary btn-sm">Cancel</button>
                                <button className="btn btn-primary btn-sm">Save</button>
                            </div> */}
                        </div>
                    </div>
                </div>
                }

                

            </>
        )
    }




    return (
        <>
            <div className="content-wrapper">
                <div className="card form-card">
                    <div className="card-header">
                        <h4 className="card-title p-2 mb-0 ps-0">Patient Consent Management</h4>
                    </div>
                    <div className="card-body">

                        <div className="mb-4">
                            <div className="row g-3 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Search</label>
                                    <input type="text" className="form-control" placeholder="UHID/IP No., Patient, Surgery or Surgeon" value="" /></div>
                                <div className="col-md-2"><label className="form-label fw-bold">Type</label><select className="form-select">
                                    <option value="All">All</option>
                                    <option value="OPD">OPD</option>
                                    <option value="IPD">IPD</option>
                                </select></div>
                                <div className="col-md-3 d-flex gap-2">
                                    <button className="btn btn-primary">
                                        <i className="fa fa-search me-1"></i> <span>Search</span>
                                    </button>
                                    <button className="btn btn-secondary">
                                        <i className="fa fa-refresh me-1"></i> <span>Reset</span></button>
                                </div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>UHID / IP No.</th>
                                        <th>Patient Name</th>
                                        <th>Type</th>
                                        <th>Department</th>
                                        <th>Surgery</th>
                                        <th>Surgeon</th>
                                        <th>OT</th>
                                        <th>Scheduled Date / Time</th>
                                        <th>Ward / Bed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ cursor: "pointer" }} onClick={() => setPatientConsentInfo(true)}>
                                        <td>UHID10025</td>
                                        <td>Rahul Sharma</td>
                                        <td>OPD</td>
                                        <td>Orthopaedics</td>
                                        <td>Total Knee Replacement</td>
                                        <td>Dr. Sharma</td>
                                        <td>OT-1001</td>
                                        <td>20-Aug-2026 10:00</td>
                                        <td>Surgical Ward / SW-12</td>
                                    </tr>
                                    <tr style={{ cursor: "pointer" }} onClick={() => setPatientConsentInfo(true)}>
                                        <td>IPD/26/00128</td>
                                        <td>Amit Kumar</td>
                                        <td>IPD</td>
                                        <td>General Surgery</td>
                                        <td>Hernia Repair</td>
                                        <td>Dr. Gupta</td>
                                        <td>OT-02</td>
                                        <td>20-Aug-2026 14:00</td>
                                        <td>Surgical Ward / B-12</td>
                                    </tr>
                                    {/* <tr>
                                        <td colspan="10" className="text-center py-4 text-muted">
                                        <i className="fa fa-info-circle me-1"></i> No patients pending</td>
                                    </tr> */}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PatientConsent;
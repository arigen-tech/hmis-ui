import { useState } from "react";

const PatientConsentForm = () => {
    const [showDocument, setShowDocument] = useState(false);
    return (
        <>
            <div className="">

                {/* <div className="mb-3">
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
                </div> */}

                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-bold small mb-1">Consent Type <span className="text-danger">*</span></label>
                        <select class="form-select">
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
                    <button type="button" class="btn btn-secondary me-2">Cancel</button>
                    <button class="btn btn-primary">Submit</button>
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

export default PatientConsentForm;
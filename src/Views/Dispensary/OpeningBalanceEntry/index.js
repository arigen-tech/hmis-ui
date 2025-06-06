import { useState } from "react"
import Popup from "../../../Components/popup"


const OpeningBalanceEntry = () => {
    const [formData, setFormData] = useState({
        balanceEntryDate: "29/05/2025",
        enteredBy: "Rakesh",
        department: "DISPENSARY"
    })



    const [drugEntries, setDrugEntries] = useState([
        {
            id: 1,
            drugCode: "",
            drugName: "",
            unit: "",
            batchNoSerialNo: "",
            dom: "",
            doe: "",
            qty: "",
            unitRate: "",
            amount: "",
            medicineSource: "",
            manufacturer: ""
        }
    ])

    // Options for dropdowns
    const medicineSourceOptions = [
        "Local Purchase",
        "Central Supply",
        "Donation",
        "Emergency Purchase",
        "Government Supply"
    ]

    const manufacturerOptions = [
        "Cipla Ltd",
        "Sun Pharma",
        "Dr. Reddy's",
        "Lupin Limited",
        "Aurobindo Pharma",
        "Torrent Pharma",
        "Glenmark",
        "Alkem Labs"
    ]

    const handleFormInputChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    const [popupMessage, setPopupMessage] = useState(null)


    const handleDrugEntryChange = (index, field, value) => {
        const updatedEntries = drugEntries.map((entry, i) => {
            if (i === index) {
                const updatedEntry = { ...entry, [field]: value }

                // Auto-calculate amount when qty or unitRate changes
                if (field === 'qty' || field === 'unitRate') {
                    const qty = parseFloat(field === 'qty' ? value : entry.qty) || 0
                    const unitRate = parseFloat(field === 'unitRate' ? value : entry.unitRate) || 0
                    updatedEntry.amount = (qty * unitRate).toFixed(2)
                }

                return updatedEntry
            }
            return entry
        })
        setDrugEntries(updatedEntries)
    }

    const addNewRow = () => {
        const newEntry = {
            id: Date.now(), // Use timestamp for unique ID
            drugCode: "",
            drugName: "",
            unit: "",
            batchNoSerialNo: "",
            dom: "",
            doe: "",
            qty: "",
            unitRate: "",
            amount: "",
            medicineSource: "",
            manufacturer: ""
        }
        setDrugEntries([...drugEntries, newEntry])
    }

    const removeRow = (index) => {
        if (drugEntries.length > 1) {
            const filteredEntries = drugEntries.filter((_, i) => i !== index)
            setDrugEntries(filteredEntries)
        }
    }

    const handleSubmit = () => {
        // Validate required fields
        const hasEmptyRequiredFields = drugEntries.some(entry =>
            !entry.drugCode || !entry.drugName || !entry.qty || !entry.unitRate
        )

        if (hasEmptyRequiredFields) {
            alert("Please fill in all required fields (Drug Code, Drug Name, Qty, Unit Rate)")
            return
        }

        const submissionData = {
            ...formData,
            drugEntries: drugEntries.filter(entry => entry.drugCode || entry.drugName)
        }

        console.log("Submitting:", submissionData)
        showPopup(" Items updated successfully!", "success")

    }

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null)
            },
        })
    }

    const handleReset = () => {
        setFormData({
            balanceEntryDate: "29/05/2025",
            enteredBy: "sumit",
            department: "DISPENSARY"
        })
        setDrugEntries([
            {
                id: 1,
                drugCode: "",
                drugName: "",
                unit: "",
                batchNoSerialNo: "",
                dom: "",
                doe: "",
                qty: "",
                unitRate: "",
                amount: "",
                medicineSource: "",
                manufacturer: ""
            }
        ])
    }



    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header" >
                            <h4 className="card-title p-2 mb-0">Opening Balance Entry</h4>
                        </div>

                        <div className="card-body">
                            {/* Entry Details Section */}
                            <div className="mb-4">
                                <h5 className=" mb-3" >Entry Details:</h5>
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Balance Entry Date</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="balanceEntryDate"
                                            value={formData.balanceEntryDate}
                                            onChange={handleFormInputChange}
                                            style={{ backgroundColor: '#f8f9fa' }}
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Entered By</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="enteredBy"
                                            value={formData.enteredBy}
                                            onChange={handleFormInputChange}
                                            style={{ backgroundColor: '#f8f9fa' }}
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Department</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleFormInputChange}
                                            style={{ backgroundColor: '#f8f9fa' }}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Drug Entry Table - Horizontally Scrollable */}
                            <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <table className="table table-bordered table-hover align-middle" style={{ minWidth: '1600px' }}>
                                    <thead style={{ backgroundColor: '#6c7b7f', color: 'white' }}>
                                        <tr>
                                            <th className="text-center" style={{ width: '60px', minWidth: '60px' }}>S.No.</th>
                                            <th style={{ width: '120px', minWidth: '120px' }}>Drug Code</th>
                                            <th style={{ width: '200px', minWidth: '200px' }}>Drug Name</th>
                                            <th style={{ width: '80px', minWidth: '80px' }}>Unit</th>
                                            <th style={{ width: '150px', minWidth: '150px' }}>Batch No/ Serial No</th>
                                            <th style={{ width: '120px', minWidth: '120px' }}>DOM</th>
                                            <th style={{ width: '120px', minWidth: '120px' }}>DOE</th>
                                            <th style={{ width: '80px', minWidth: '80px' }}>Qty</th>
                                            <th style={{ width: '100px', minWidth: '100px' }}>Unit Rate</th>
                                            <th style={{ width: '100px', minWidth: '100px' }}>Amount</th>
                                            <th style={{ width: '150px', minWidth: '150px' }}>Medicine Source</th>
                                            <th style={{ width: '150px', minWidth: '150px' }}>Manufacturer</th>
                                            <th style={{ width: '60px', minWidth: '60px' }}>Add</th>
                                            <th style={{ width: '70px', minWidth: '70px' }}>Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drugEntries.map((entry, index) => (
                                            <tr key={entry.id}>
                                                <td className="text-center fw-bold">{index + 1}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={entry.drugCode}
                                                        onChange={(e) => handleDrugEntryChange(index, 'drugCode', e.target.value)}
                                                        placeholder="Code"
                                                        style={{ minWidth: '100px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={entry.drugName}
                                                        onChange={(e) => handleDrugEntryChange(index, 'drugName', e.target.value)}
                                                        placeholder="Drug Name"
                                                        style={{ minWidth: '180px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={entry.unit}
                                                        onChange={(e) => handleDrugEntryChange(index, 'unit', e.target.value)}
                                                        placeholder="Unit"
                                                        style={{ minWidth: '70px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={entry.batchNoSerialNo}
                                                        onChange={(e) => handleDrugEntryChange(index, 'batchNoSerialNo', e.target.value)}
                                                        placeholder="Batch/Serial"
                                                        style={{ minWidth: '130px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        value={entry.dom}
                                                        onChange={(e) => handleDrugEntryChange(index, 'dom', e.target.value)}
                                                        style={{ minWidth: '120px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        value={entry.doe}
                                                        onChange={(e) => handleDrugEntryChange(index, 'doe', e.target.value)}
                                                        style={{ minWidth: '120px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={entry.qty}
                                                        onChange={(e) => handleDrugEntryChange(index, 'qty', e.target.value)}
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.01"
                                                        style={{ minWidth: '70px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={entry.unitRate}
                                                        onChange={(e) => handleDrugEntryChange(index, 'unitRate', e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        style={{ minWidth: '90px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={entry.amount}
                                                        readOnly
                                                        style={{ backgroundColor: '#f8f9fa', minWidth: '90px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={entry.medicineSource}
                                                        onChange={(e) => handleDrugEntryChange(index, 'medicineSource', e.target.value)}
                                                        style={{ minWidth: '130px' }}
                                                    >
                                                        <option value="">Select</option>
                                                        {medicineSourceOptions.map((option, idx) => (
                                                            <option key={idx} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={entry.manufacturer}
                                                        onChange={(e) => handleDrugEntryChange(index, 'manufacturer', e.target.value)}
                                                        style={{ minWidth: '130px' }}
                                                    >
                                                        <option value="">Select</option>
                                                        {manufacturerOptions.map((option, idx) => (
                                                            <option key={idx} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success"
                                                        onClick={addNewRow}
                                                        style={{
                                                            color: 'white',
                                                            border: 'none',
                                                            width: '35px',
                                                            height: '35px'
                                                        }}
                                                        title="Add Row"
                                                    >
                                                        +
                                                    </button>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => removeRow(index)}
                                                        disabled={drugEntries.length === 1}
                                                        title="Delete Row"
                                                        style={{
                                                            width: '35px',
                                                            height: '35px'
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}

                                    </tbody>
                                </table>
                            </div>

                            {popupMessage && (
                                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
                            )}

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleSubmit}

                                >
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleReset}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OpeningBalanceEntry
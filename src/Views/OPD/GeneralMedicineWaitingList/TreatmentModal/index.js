import { useState } from "react"

const TreatmentModal = ({ show, onClose, templateType = "create" }) => {
  const [templateName, setTemplateName] = useState("")
  const [templateCode, setTemplateCode] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("Select..")
  const [treatmentItems, setTreatmentItems] = useState([
    {
      drugName: "",
      dispUnit: "Tab",
      dosage: "",
      frequency: "OD",
      days: "",
      total: "",
      instruction: "",
      stock: "",
    },
  ])

  const [templates, setTemplates] = useState(["Blood Test Template", "Cardiac Template", "Diabetes Template"])

  const handleAddTreatmentItem = () => {
    setTreatmentItems([
      ...treatmentItems,
      {
        drugName: "",
        dispUnit: "Tab",
        dosage: "",
        frequency: "OD",
        days: "",
        total: "",
        instruction: "",
        stock: "",
      },
    ])
  }

  const handleRemoveTreatmentItem = (index) => {
    if (treatmentItems.length === 1) return
    const newItems = treatmentItems.filter((_, i) => i !== index)
    setTreatmentItems(newItems)
  }

  const handleTreatmentChange = (index, field, value) => {
    const newItems = [...treatmentItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setTreatmentItems(newItems)
  }

  const handleSaveTemplate = () => {
    if (templateName.trim() && templateCode.trim()) {
      setTemplates([...templates, templateName])
      onClose()
    }
  }

  const handleResetTemplate = () => {
    setTemplateName("")
    setTemplateCode("")
    setTreatmentItems([
      {
        drugName: "",
        dispUnit: "Tab",
        dosage: "",
        frequency: "OD",
        days: "",
        total: "",
        instruction: "",
        stock: "",
      },
    ])
  }

  if (!show) return null

  return (
    <div className="modal fade show d-block" style={{ 
      backgroundColor: 'rgba(0,0,0,0.5)',
      position: 'fixed',
      top: 0,
      left: '250px', // Sidebar width
      right: 0,
      bottom: 0,
      zIndex: 1050
    }}>
      <div className="modal-dialog" style={{ 
        position: 'fixed',
        top: '50%',
        left: 'calc(250px + (100% - 250px) / 2)', // Center in remaining space
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 270px)', // Full width minus sidebar + margin
        maxWidth: 'none',
        margin: 0,
        height: 'auto',
        maxHeight: '90vh'
      }}>
        <div className="modal-content" style={{ 
          height: 'auto', 
          maxHeight: '90vh', 
          overflow: 'hidden',
          borderRadius: '8px',
          margin: '0 10px'
        }}>
          {/* Header */}
          <div className="modal-header" style={{ 
            backgroundColor: '#0d6efd',
            color: 'white',
            borderBottom: '2px solid #0b5ed7',
            padding: '1rem 1.5rem',
            borderRadius: '8px 8px 0 0'
          }}>
            <h5 className="modal-title fw-bold">TREATMENT TEMPLATE</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body" style={{ 
            padding: '1.5rem',
            maxHeight: 'calc(90vh - 100px)',
            overflow: 'auto'
          }}>
            {/* Template Selection */}
            <div className="row mb-3 align-items-center">
              <div className="col-md-2">
                <label className="form-label fw-bold">TEMPLATE</label>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ borderRadius: '4px' }}
                >
                  <option value="Select..">Select..</option>
                  {templates.map((template, index) => (
                    <option key={index} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department */}
            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">GENERAL MEDICINE</label>
              </div>
            </div>

            {/* Template Name and Code */}
            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">Template Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  style={{ borderRadius: '4px' }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Template Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  placeholder="Enter template code"
                  style={{ borderRadius: '4px' }}
                />
              </div>
            </div>

            {/* Treatment Table with Horizontal Scroll */}
            <div className="table-responsive" style={{ 
              overflowX: 'auto',
              maxWidth: '100%'
            }}>
              <table className="table table-bordered" style={{ 
                minWidth: '1200px', // Force horizontal scroll if needed
                width: '100%'
              }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: '200px' }}>DRUGS NAME/DRUGS CODE</th>
                    <th style={{ minWidth: '100px' }}>DISP. UNIT</th>
                    <th style={{ minWidth: '80px' }}>DOSAGE</th>
                    <th style={{ minWidth: '100px' }}>FREQUENCY</th>
                    <th style={{ minWidth: '80px' }}>DAYS</th>
                    <th style={{ minWidth: '80px' }}>TOTAL</th>
                    <th style={{ minWidth: '120px' }}>INSTRUCTION</th>
                    <th style={{ minWidth: '80px' }}>STOCK</th>
                    <th style={{ minWidth: '60px' }}>ADD</th>
                    <th style={{ minWidth: '60px' }}>DELETE</th>
                  </tr>
                </thead>
                <tbody>
                  {treatmentItems.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={row.drugName}
                          onChange={(e) => handleTreatmentChange(index, "drugName", e.target.value)}
                          placeholder="Enter drug name or code"
                          style={{ borderRadius: '4px', minWidth: '180px' }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={row.dispUnit}
                          onChange={(e) => handleTreatmentChange(index, "dispUnit", e.target.value)}
                          style={{ borderRadius: '4px', minWidth: '90px' }}
                        >
                          <option value="Tab">Tab</option>
                          <option value="Cap">Cap</option>
                          <option value="Syr">Syr</option>
                          <option value="Inj">Inj</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.dosage}
                          onChange={(e) => handleTreatmentChange(index, "dosage", e.target.value)}
                          placeholder="1"
                          style={{ borderRadius: '4px', minWidth: '70px' }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={row.frequency}
                          onChange={(e) => handleTreatmentChange(index, "frequency", e.target.value)}
                          style={{ borderRadius: '4px', minWidth: '90px' }}
                        >
                          <option value="OD">OD</option>
                          <option value="BID">BID</option>
                          <option value="TID">TID</option>
                          <option value="QID">QID</option>
                          <option value="HS">HS</option>
                          <option value="SOS">SOS</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.days}
                          onChange={(e) => handleTreatmentChange(index, "days", e.target.value)}
                          placeholder="0"
                          style={{ borderRadius: '4px', minWidth: '70px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.total}
                          onChange={(e) => handleTreatmentChange(index, "total", e.target.value)}
                          placeholder="0"
                          style={{ borderRadius: '4px', minWidth: '70px' }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={row.instruction}
                          onChange={(e) => handleTreatmentChange(index, "instruction", e.target.value)}
                          style={{ borderRadius: '4px', minWidth: '110px' }}
                        >
                          <option value="">Select...</option>
                          <option value="After Meal">After Meal</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="With Food">With Food</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={row.stock}
                          onChange={(e) => handleTreatmentChange(index, "stock", e.target.value)}
                          placeholder="0"
                          style={{ borderRadius: '4px', minWidth: '70px' }}
                        />
                      </td>
                      <td className="text-center align-middle">
                        <button 
                          className="btn btn-success btn-sm" 
                          onClick={handleAddTreatmentItem}
                          style={{ 
                            borderRadius: '4px',
                            width: '35px',
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                          }}
                        >
                          +
                        </button>
                      </td>
                      <td className="text-center align-middle">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveTreatmentItem(index)}
                          disabled={treatmentItems.length === 1}
                          style={{ 
                            borderRadius: '4px',
                            width: '35px',
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                          }}
                        >
                          −
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="row mt-4">
              <div className="col-md-12">
                <div className="d-flex gap-3 justify-content-start">
                  <button 
                    className="btn btn-primary px-4" 
                    onClick={handleSaveTemplate}
                    style={{ borderRadius: '4px' }}
                  >
                    SAVE
                  </button>
                  <button 
                    className="btn btn-secondary px-4" 
                    onClick={handleResetTemplate}
                    style={{ borderRadius: '4px' }}
                  >
                    RESET
                  </button>
                  <button 
                    className="btn btn-secondary px-4" 
                    onClick={onClose}
                    style={{ borderRadius: '4px' }}
                  >
                    CLOSE
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

export default TreatmentModal
import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import { getRequest, putRequest } from "../../../service/apiService";
import { OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const UpdateUnitRate = () => {
  // const [drugList, setDrugList] = useState([
  //   {
  //     id: 1,
  //     drug_name: "ORAL SUSPENSION 200 MG + 40 MG/5 ML",
  //     au: "BOTTLE",
  //     batch: "NOB23005ED",
  //     expiry_date: "02/10/2025",
  //     available_stock: 12,
  //     previous_unit_rate: 114.0,
  //     updated_unit_rate: 114.0,
  //   },
  //   {
  //     id: 2,
  //     drug_name: "ACETYL SALICYLIC ACID (ASA) TABLET (ENTERIC COATED) 325 MG",
  //     au: "No.",
  //     batch: "04008214",
  //     expiry_date: "11/09/2025",
  //     available_stock: 5,
  //     previous_unit_rate: 15.0,
  //     updated_unit_rate: 15.0,
  //   },
  //   {
  //     id: 3,
  //     drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
  //     au: "No.",
  //     batch: "04010774",
  //     expiry_date: "31/08/2026",
  //     available_stock: 350,
  //     previous_unit_rate: 11.0,
  //     updated_unit_rate: 11.0,
  //   },
  //   {
  //     id: 4,
  //     drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
  //     au: "No.",
  //     batch: "04010774",
  //     expiry_date: "31/08/2026",
  //     available_stock: 200,
  //     previous_unit_rate: 11.0,
  //     updated_unit_rate: 11.0,
  //   },
  //   {
  //     id: 5,
  //     drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
  //     au: "No.",
  //     batch: "04010774",
  //     expiry_date: "31/08/2026",
  //     available_stock: 350,
  //     previous_unit_rate: 11.0,
  //     updated_unit_rate: 11.0,
  //   },
  //   {
  //     id: 6,
  //     drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
  //     au: "No.",
  //     batch: "04010320",
  //     expiry_date: "28/02/2026",
  //     available_stock: 250,
  //     previous_unit_rate: 0.8,
  //     updated_unit_rate: 0.8,
  //   },
  //   {
  //     id: 7,
  //     drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
  //     au: "No.",
  //     batch: "10197",
  //     expiry_date: "31/12/2025",
  //     available_stock: 42,
  //     previous_unit_rate: 0.8,
  //     updated_unit_rate: 0.8,
  //   },
  //   {
  //     id: 8,
  //     drug_name: "Acetyl salicylic acid (Aspirin) - 150 Tab. IP",
  //     au: "No.",
  //     batch: "04010692",
  //     expiry_date: "31/07/2026",
  //     available_stock: 126,
  //     previous_unit_rate: 1.1,
  //     updated_unit_rate: 1.1,
  //   },
  // ])

  const [drugList, setDrugList] = useState([])
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  const [searchParams, setSearchParams] = useState({
    drugName: "",
    drugCode: "",
  })
  const [filteredDrugList, setFilteredDrugList] = useState(drugList)
  const [changedRates, setChangedRates] = useState([]); // Add this line
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
  useEffect(() => {
    fetchStoreReportData()
  }, [])

  const fetchStoreReportData = async () => {
    setLoading(true)
    const reportType = "details"
    try {
      const data = await getRequest(`${OPEN_BALANCE}/getAllStock/${reportType}/${hospitalId}/${departmentId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        const withOriginal = data.response.map(item => ({
          ...item,
          originalMrpPerUnit: item.mrpPerUnit
        }));
        setDrugList(withOriginal);
      } else {
        setDrugList([]);
      }
    } catch (error) {
      setDrugList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSearch = (e) => {
    const { name, value } = e.target
    setSearchParams((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearch = () => {
    let filtered = drugList
    if (searchParams.drugName.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.itemName?.toLowerCase().includes(searchParams.drugName.trim().toLowerCase())
      )
    }

    if (searchParams.drugCode.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.itemCode?.toLowerCase().includes(searchParams.drugCode.trim().toLowerCase())
      )
    }

    setFilteredDrugList(filtered)
    setCurrentPage(1)
  }

  // Add this useEffect for dynamic search
  useEffect(() => {
    let filtered = drugList;
    if (searchParams.drugName.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.itemName?.toLowerCase().includes(searchParams.drugName.trim().toLowerCase())
      );
    }
    if (searchParams.drugCode.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.itemCode?.toLowerCase().includes(searchParams.drugCode.trim().toLowerCase())
      );
    }
    setFilteredDrugList(filtered);
    setCurrentPage(1);
  }, [searchParams, drugList]);

  // Keep filteredDrugList in sync if drugList changes
  useEffect(() => {
    setFilteredDrugList(drugList)
  }, [drugList])

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredDrugList.slice(indexOfFirst, indexOfLast);


  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleUnitRateChange = (stockId, newRate) => {
    setChangedRates(prev => {
      const filtered = prev.filter(entry => entry.stockId !== stockId);
      // If input is blank, remove from changedRates
      if (newRate === "") return filtered;
      return [...filtered, { stockId, mrpValue: Number.parseFloat(newRate) || 0 }];
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (changedRates.length === 0) {
      showPopup("No changes to submit.", "info");
      return;
    }
    setLoading(true);
    try {
      // Use putRequest instead of fetch
      const response = await putRequest(
        `${OPEN_BALANCE}/updateByMrp`,
        changedRates
      );
      if (response.status === 200) {
        showPopup("Unit rates updated successfully!", "success");
        setChangedRates([]); // Clear changes after successful update
        await fetchStoreReportData(); 
      } else {
        showPopup("Failed to update unit rates.", "danger");
      }
    } catch (error) {
      showPopup("Error updating unit rates.", "danger");
    } finally {
      setLoading(false);
    }
  }

 
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Update Unit Rate</h4>
            </div>
            <div className="card-body">
              {/* Search Form */}
              <form className="mb-3">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Drug Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Drug Code"
                      name="drugCode"
                      value={searchParams.drugCode}
                      onChange={handleChangeSearch}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Drug Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Drug Name"
                      name="drugName"
                      value={searchParams.drugName}
                      onChange={handleChangeSearch}
                    />
                  </div>
                </div>
              </form>
              {/* End Search Form */}
              <form onSubmit={handleSubmit}>
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Drug Name</th>
                        <th>A/U</th>
                        <th>Batch</th>
                        <th>Expiry Date</th>
                        <th>Available Stock</th>
                        <th>Previous Unit Rate</th>
                        <th>Updated Unit Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => {
                        // Find changed value if exists
                        const changed = changedRates.find(rate => rate.stockId === item.stockId);
                        return (
                          <tr key={item.stockId}>
                            <td>{item.itemName}</td>
                            <td>{item.unitAu}</td>
                            <td>{item.batchNo}</td>
                            <td>{new Date(item.doe).toLocaleDateString('en-GB')}</td>
                            <td>{item.openingQty}</td>
                            <td>{(item.originalMrpPerUnit ?? item.mrpPerUnit).toFixed(2)}</td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={changed ? changed.mrpValue : ""}
                                onChange={e => handleUnitRateChange(item.stockId, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-success">
                      Submit
                    </button>
                  </div>
                </div>

                <Pagination
                                            totalItems={filteredDrugList.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />


              </form>

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateUnitRate

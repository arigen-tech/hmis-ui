
import React, { useState, useEffect } from "react";

const PregnancySection = () => {

  const [pregnancyData, setPregnancyData] = useState({
    pregnant: false,
    lmpDate: "",
    edd: "",
    currentEdd: "",
    gestationPeriod: "",
  });

 const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  if (name === "pregnant") {
    setPregnancyData({
      pregnant: checked,
      lmpDate: checked ? pregnancyData.lmpDate : "",
      edd: checked ? pregnancyData.edd : "",
      currentEdd: checked ? pregnancyData.currentEdd : "",
      gestationPeriod: "",
    });
    return;
  }

  setPregnancyData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  return (
    <div className="container-fluid mt-3">
      <div className="card-body">
        <div className="row align-items-end">
          <div className="col-md-2 mb-3">
         <div className="form-check mt-2">
  <input
    className="form-check-input"
    type="checkbox"
    name="pregnant"
    checked={pregnancyData.pregnant}
    onChange={handleChange}
    id="pregnantCheck"
  />
  <label
    className="form-check-label fw-bold"
    htmlFor="pregnantCheck"
  >
    Pregnant
  </label>
</div>
          </div>

          <div className="col-md-2 mb-3">
            <label className="form-label fw-bold">LMP Date</label>
            <input
              type="date"
              className="form-control"
              name="lmpDate"
              value={pregnancyData.lmpDate}
              onChange={handleChange}
              disabled={!pregnancyData.pregnant}
            />
          </div>

          <div className="col-md-2 mb-3">
            <label className="form-label fw-bold">EDD</label>
            <input
              type="date"
              className="form-control"
              name="edd"
              value={pregnancyData.edd}
              onChange={handleChange}
              disabled={!pregnancyData.pregnant}
            />
          </div>

          <div className="col-md-2 mb-3">
            <label className="form-label fw-bold">Current EDD</label>
           <input
  type="date"
  className="form-control"
  name="currentEdd"
  value={pregnancyData.currentEdd}
  onChange={handleChange}
  disabled={!pregnancyData.pregnant}
/>
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label fw-bold">
              Period of Gestation for Today
            </label>
            <input
              type="text"
              className="form-control"
              name="gestationPeriod"
              value={pregnancyData.gestationPeriod}
              onChange={handleChange}
              placeholder="Weeks / Days"
               disabled={!pregnancyData.pregnant}
                style={{
    boxShadow: "none",
  }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancySection;
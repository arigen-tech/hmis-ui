import React, { useState, forwardRef, useImperativeHandle } from "react";

const PregnancySection = forwardRef((props, ref) => {
  const { readOnly = false, opdPatientDetailsId = null } = props;
  const [pregnancyData, setPregnancyData] = useState({
    pregnant: false,
    lmpDate: "",
    edd: "",
    currentEdd: "",
    gestationPeriod: "",
    opdPatientDetailsId: opdPatientDetailsId || null,
  });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getData: () => {
      // Only return data if pregnant is true
      if (!pregnancyData.pregnant) {
        return null;
      }
      return {
        isPregnant: pregnancyData.pregnant,
        lmpDate: pregnancyData.lmpDate,
        edd: pregnancyData.edd,
        currentEdd: pregnancyData.currentEdd,
        gestationPeriod: pregnancyData.gestationPeriod,
        opdPatientDetailsId:
          pregnancyData.opdPatientDetailsId || opdPatientDetailsId || null,
      };
    },
    resetForm: () => {
      setPregnancyData({
        pregnant: false,
        lmpDate: "",
        edd: "",
        currentEdd: "",
        gestationPeriod: "",
        opdPatientDetailsId: null,
      });
    },
    setData: (data) => {
      if (data) {
        setPregnancyData({
          pregnant: data.isPregnant ?? data.pregnant ?? false,
          lmpDate: data.lmpDate || "",
          edd: data.edd || "",
          currentEdd: data.currentEdd || "",
          gestationPeriod: data.gestationPeriod || "",
          opdPatientDetailsId: data.opdPatientDetailsId || null,
        });
      }
    }
  }));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "pregnant") {
      setPregnancyData({
        pregnant: checked,
        lmpDate: checked ? pregnancyData.lmpDate : "",
        edd: checked ? pregnancyData.edd : "",
        currentEdd: checked ? pregnancyData.currentEdd : "",
        gestationPeriod: "",
        opdPatientDetailsId: pregnancyData.opdPatientDetailsId || opdPatientDetailsId || null,
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
                disabled={readOnly}
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
              disabled={readOnly || !pregnancyData.pregnant}
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
              disabled={readOnly || !pregnancyData.pregnant}
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
              disabled={readOnly || !pregnancyData.pregnant}
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
              disabled={readOnly || !pregnancyData.pregnant}
              style={{
                boxShadow: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default PregnancySection;

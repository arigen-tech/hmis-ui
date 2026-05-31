import React, { useState, useEffect } from "react";

const PregnancySection = () => {

  const [pregnancyData, setPregnancyData] = useState({
    pregnant: false,
    lmpDate: "",
    edd: "",
    currentEdd: "",
    gestationPeriod: "",
  });

  // Calculate EDD from LMP
//  useEffect(() => {

//   if (pregnancyData.lmpDate) {

//     const lmp = new Date(pregnancyData.lmpDate);

//     const today = new Date();

//     const diffTime = today - lmp;

//     const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//     const weeks = Math.floor(totalDays / 7);

//     const days = totalDays % 7;

//     setPregnancyData((prev) => ({
//       ...prev,
//       gestationPeriod: `${weeks} Weeks ${days} Days`,
//     }));

//   }

// }, [pregnancyData.lmpDate]);

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setPregnancyData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

  };

  const handleSave = () => {

    console.log("Pregnancy Data:", pregnancyData);

    alert("Pregnancy details saved successfully!");

  };

  return (

    <div className="container-fluid mt-3">

      <div className="card shadow-sm border-0">

       
        <div className="card-body">

          <div className="row align-items-end">

            {/* Pregnant */}
            <div className="col-md-2 mb-3">

              <label className="form-label fw-bold">
                Pregnant
              </label>

              <div className="border rounded p-2">

                <input
                  type="checkbox"
                  name="pregnant"
                  checked={pregnancyData.pregnant}
                  onChange={handleChange}
                />

              </div>

            </div>

            {/* LMP Date */}
            <div className="col-md-2 mb-3">

              <label className="form-label fw-bold">
                LMP Date
              </label>

              <input
                type="date"
                className="form-control"
                name="lmpDate"
                value={pregnancyData.lmpDate}
                onChange={handleChange}
              />

            </div>

            {/* EDD */}
            <div className="col-md-2 mb-3">

              <label className="form-label fw-bold">
                EDD
              </label>

              <input
                type="date"
                className="form-control"
                name="edd"
                value={pregnancyData.edd}
                onChange={handleChange}
              />

            </div>

            {/* Current EDD */}
            <div className="col-md-2 mb-3">

              <label className="form-label fw-bold">
                Current EDD
              </label>

              <input
                type="date"
                className="form-control"
                name="currentEdd"
                value={pregnancyData.currentEdd}
                onChange={handleChange}
              />

            </div>

            {/* Gestation */}
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
              />

            </div>

          </div>

          {/* Save Button */}
          {/* <div className="text-end mt-3">

            <button
              className="btn btn-primary"
              onClick={handleSave}
            >
              Save
            </button>

          </div> */}

        </div>

      </div>

    </div>

  );

};

export default PregnancySection;
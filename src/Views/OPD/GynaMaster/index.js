import React from "react";

const GynaMaster = () => {
  const data = [
    {
      id: 1,
      tableName: "gyn_mas_flow",
      label: "Menstrual Flow",
      why: "Variation by patient",
      values: "Scanty, Normal, Heavy",
    },
    {
      id: 2,
      tableName: "gyn_mas_menarche_age",
      label: "Age of Menarche",
      why: "Range varies slightly",
      values: "10, 11, 12, 13, 14, 15, 16",
    },
    {
      id: 3,
      tableName: "gyn_mas_menstrual_pattern",
      label: "Menstrual Pattern",
      why: "Needed for diagnosis",
      values: "Regular, Irregular, Polymenorrhea, Oligomenorrhea",
    },
    {
      id: 4,
      tableName: "gyn_mas_sterilisation",
      label: "Sterilisation Type",
      why: "For women's reproductive history",
      values: "None, Tubectomy, Laparoscopic TL, Vasectomy (Partner)",
    },
    {
      id: 5,
      tableName: "gyn_mas_pap_smear",
      label: "Pap Smear Result",
      why: "Standard report terminology",
      values: "Normal, Inflammatory, ASCUS, LSIL, HSIL",
    },
  ];

  return (
    <div className="gyna-master-container">
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Table Name</th>
              <th>Label</th>
              <th>Why Required</th>
              <th>Values</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>{item.tableName}</td>
                <td>{item.label}</td>
                <td>{item.why}</td>
                <td>{item.values}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GynaMaster;
import React from "react";
import "./popup.css"; // for styling

export default function DuplicatePopup({ show, duplicates, onClose }) {
    if (!show) return null;

    console.log("duplicates", duplicates);

    return (
        <div className="popup-overlay">
            <div className="popup-box">
                <h5>Duplicate Entry</h5>

                <p>The following Entry already exist please change it accordingly:</p>

                <div className="alert alert-warning">
                    {duplicates.map((d, i) => {
                        const name =
                            d.itemName ||
                            d.nomenclature ||
                            d.investigationName ||
                            d.icdDiagnosis;

                        return (
                            <span key={i}>
                                {name}
                                {i < duplicates.length - 1 ? ", " : ""}
                            </span>
                        );
                    })}

                </div>

                <button className="btn btn-primary" onClick={onClose}>
                    OK
                </button>
            </div>
        </div>
    );
}

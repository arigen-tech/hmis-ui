import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";
import { postRequest, getRequest } from "../../../service/apiService";
import { SAVE_SHIFT_HANDOVER, GET_SHIFT_HANDOVER } from "../../../config/apiConfig";

const MAX_NOTES_LENGTH = 2000;

const ShiftHandover = ({ selectedPatient }) => {
  const [handoverNotes, setHandoverNotes] = useState("");
  const [history, setHistory] = useState([]);

  // CKEditor refs
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);

  // CKEditor configuration (same as DischargeFromWard)
  const editorConfig = {
    toolbar: {
      items: [
        "heading",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "bulletedList",
        "numberedList",
        "|",
        "alignment",
        "indent",
        "outdent",
        "|",
        "undo",
        "redo",
      ],
      shouldNotGroupWhenFull: true,
    },
    alignment: {
      options: ["left", "center", "right", "justify"],
    },
    placeholder: "Enter shift handover notes...",
  };

  // Helper to strip HTML tags and get plain text length
  const getPlainTextLength = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || "").length;
  };

  // CKEditor change handler
  const handleNotesChange = (event, editor) => {
    const data = editor.getData();
    const plainLength = getPlainTextLength(data);
    if (plainLength <= MAX_NOTES_LENGTH) {
      setHandoverNotes(data);
    }
  };

  const handleClear = () => {
    setHandoverNotes("");
    if (editorRef.current) {
      editorRef.current.setData("");
    }
  };

  const handleSaveHandover = async () => {
    const plainText = handoverNotes.replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      Swal.fire({
        title: "Warning",
        text: "Please enter handover notes before saving.",
        icon: "warning"
      });
      return;
    }

    if (!selectedPatient?.inpatientId) {
      Swal.fire({
        title: "Warning",
        text: "Patient not selected or missing inpatient ID.",
        icon: "warning"
      });
      return;
    }

    const payload = {
      notes: handoverNotes.trim(),
      inpatientId: selectedPatient.inpatientId
    };

    try {
      const res = await postRequest(SAVE_SHIFT_HANDOVER, payload);
      if (res?.status === 200 || res?.status === 201) {
        await Swal.fire({
          title: "Success",
          text: "Shift handover notes saved successfully.",
          icon: "success"
        });

        fetchHandoverHistory(selectedPatient.inpatientId);

        setHandoverNotes("");
        if (editorRef.current) {
          editorRef.current.setData("");
        }
      } else {
        Swal.fire({
          title: "Error",
          text: res?.message || "Failed to save handover notes",
          icon: "error"
        });
      }
    } catch (err) {
      console.error("Error saving handover notes:", err);
      Swal.fire({
        title: "Error",
        text: "Error saving handover notes",
        icon: "error"
      });
    }
  };

  const fetchHandoverHistory = async (inpatientId) => {
    if (!inpatientId) {
      setHistory([]);
      return;
    }
    try {
      const res = await getRequest(`${GET_SHIFT_HANDOVER}?inpatientId=${inpatientId}`);
      if (res?.status === 200 && Array.isArray(res.response)) {
        const mappedHistory = res.response.map(item => {
          let dateStr = item.dateTime;
          if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              dateStr = d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }
          }
          return {
            id: item.noteId,
            dateTime: dateStr || "-",
            enteredBy: item.entered || "-",
            notes: item.notes || "-"
          };
        });
        setHistory(mappedHistory);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching handover history", err);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHandoverHistory(selectedPatient?.inpatientId);
  }, [selectedPatient?.inpatientId]);

  // Cleanup CKEditor on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <div className="body">
        <label className="form-label small fw-bold">Handover Notes <span className="text-danger">*</span></label>

        {/* CKEditor instead of textarea */}
        <div
          style={{
            border: "1px solid #ced4da",
            borderRadius: "6px",
            padding: "8px",
            minHeight: "120px",
          }}
        >
          <div ref={toolbarRef}></div>
          <CKEditor
            editor={DecoupledEditor}
            data={handoverNotes}
            config={editorConfig}
            onReady={(editor) => {
              editorRef.current = editor;
              if (toolbarRef.current) {
                toolbarRef.current.innerHTML = "";
                toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
              }
            }}
            onChange={handleNotesChange}
          />
        </div>

        <div className="text-end text-muted mt-1" style={{ fontSize: "0.7rem" }}>
          {getPlainTextLength(handoverNotes)} / {MAX_NOTES_LENGTH}
        </div>

        <div className="d-flex justify-content-end gap-2 mt-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleClear}>
            Clear
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSaveHandover}>
            Save Handover
          </button>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-header bg-light py-2">
          <strong className="small">Handover History</strong>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-sm table-hover mb-0" style={{ fontSize: "0.75rem" }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: "160px" }}>Date &amp; Time</th>
                  <th style={{ width: "120px" }}>Entered By</th>
                  <th>Handover Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-3 text-muted">No handover history found.</td>
                  </tr>
                ) : (
                  history.map(h => (
                    <tr key={h.id}>
                      <td>{h.dateTime}</td>
                      <td>{h.enteredBy}</td>
                      <td dangerouslySetInnerHTML={{ __html: h.notes }}></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftHandover;
// OTBookingHistory/OTTeamAssignment.js
import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { getRequest } from "../../../service/apiService";
import {
  MAS_OT_TEAM_ROLE_GET_ALL,
  GET_USERS_BY_USER_TYPE,
} from "../../../config/apiConfig";
import {
  FETCH_OT_TEAM_ROLE,
  FETCH_USERS_BY_USER_TYPE_ERR,
} from "../../../config/constants";

// Helper to convert role code (e.g. ASSISTANT_SURGEON) to camelCase (assistantSurgeon)
const toCamelCase = (str = "") =>
  str.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

const OTTeamAssignment = ({ bookingRecord, onClose, onSave }) => {
  // ----- State -----
  const [popupMessage, setPopupMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [usersByUserType, setUsersByUserType] = useState({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [teamData, setTeamData] = useState({});

  // ----- Fetch Dynamic Roles & Users from API -----
  useEffect(() => {
    const fetchRolesAndUsers = async () => {
      try {
        setRolesLoading(true);
        const res = await getRequest(MAS_OT_TEAM_ROLE_GET_ALL);
        if (res?.response && Array.isArray(res.response)) {
          // Filter active roles and order by otTeamRoleId (primary surgeon first)
          const activeRoles = res.response
            .filter((r) => r.status === "Y" || !r.status)
            .sort((a, b) => {
              const codeA = (a.roleCode || "").toUpperCase();
              const codeB = (b.roleCode || "").toUpperCase();
              if (codeA === "PRIMARY_SURGEON") return -1;
              if (codeB === "PRIMARY_SURGEON") return 1;
              return (a.otTeamRoleId || 0) - (b.otTeamRoleId || 0);
            });
          setRoles(activeRoles);

          // Fetch users for each unique userTypeId
          const uniqueUserTypeIds = Array.from(
            new Set(
              activeRoles
                .map((r) => r.userTypeId)
                .filter((id) => id !== null && id !== undefined && id !== "")
            )
          );

          if (uniqueUserTypeIds.length > 0) {
            setUsersLoading(true);
            try {
              const usersMap = {};
              await Promise.all(
                uniqueUserTypeIds.map(async (uId) => {
                  try {
                    const userRes = await getRequest(
                      `${GET_USERS_BY_USER_TYPE}?userTypeId=${uId}`
                    );
                    if (userRes?.response && Array.isArray(userRes.response)) {
                      usersMap[uId] = userRes.response;
                    } else {
                      usersMap[uId] = [];
                    }
                  } catch (err) {
                    console.error(
                      `Error fetching users for userTypeId ${uId}:`,
                      err
                    );
                    usersMap[uId] = [];
                  }
                })
              );
              setUsersByUserType(usersMap);
            } catch (err) {
              console.error("Error fetching users by userType:", err);
              showPopup(FETCH_USERS_BY_USER_TYPE_ERR, "error");
            } finally {
              setUsersLoading(false);
            }
          }
        } else {
          setRoles([]);
        }
      } catch (error) {
        console.error("Error fetching OT team roles:", error);
        showPopup(FETCH_OT_TEAM_ROLE, "error");
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRolesAndUsers();
  }, []);

  // Helper to extract users for a given role by its userTypeId
  const getUsersForRole = (role) => {
    if (!role?.userTypeId) return [];
    const list = usersByUserType[role.userTypeId] || [];
    return list.filter((u) => !u.status || u.status.toLowerCase() === "y");
  };

  // Initialize teamData dynamically from bookingRecord and loaded roles
  useEffect(() => {
    if (!bookingRecord) return;

    const initial = {};
    const primarySurgeonVal =
      bookingRecord.primarySurgeon ||
      bookingRecord.surgeonName ||
      bookingRecord.surgeon ||
      "";
    const primarySurgeonIdVal =
      bookingRecord.primarySurgeonId ||
      bookingRecord.surgeonId ||
      "";

    // If bookingRecord has teamMembers array
    if (Array.isArray(bookingRecord.teamMembers)) {
      bookingRecord.teamMembers.forEach((member) => {
        const code = member.roleCode || "";
        const camelKey = toCamelCase(code);
        const name = member.memberName || member.fullName || "";
        const uId = member.userId || "";

        if (code) {
          initial[code] = name;
          initial[`${code}_ID`] = uId;
        }
        if (camelKey) {
          initial[camelKey] = name;
          initial[`${camelKey}Id`] = uId;
        }
        if (member.otTeamRoleId) {
          initial[member.otTeamRoleId] = name;
          initial[`${member.otTeamRoleId}_ID`] = uId;
        }
      });
    }

    // Populate each role from bookingRecord
    roles.forEach((role) => {
      const code = role.roleCode || "";
      const camelKey = toCamelCase(code);
      const isPrimary = code.toUpperCase() === "PRIMARY_SURGEON";

      if (isPrimary) {
        if (code) initial[code] = primarySurgeonVal;
        if (camelKey) initial[camelKey] = primarySurgeonVal;
        if (role.otTeamRoleId) initial[role.otTeamRoleId] = primarySurgeonVal;
        if (primarySurgeonIdVal) {
          if (code) initial[`${code}_ID`] = primarySurgeonIdVal;
          if (camelKey) initial[`${camelKey}Id`] = primarySurgeonIdVal;
          if (role.otTeamRoleId) initial[`${role.otTeamRoleId}_ID`] = primarySurgeonIdVal;
        }
        return;
      }

      if (!initial[code]) {
        const val =
          bookingRecord[code] ||
          bookingRecord[role.otTeamRoleId] ||
          (camelKey ? bookingRecord[camelKey] : "") ||
          "";
        const idVal =
          bookingRecord[`${code}_ID`] ||
          bookingRecord[`${code}Id`] ||
          (camelKey ? bookingRecord[`${camelKey}Id`] : "") ||
          "";

        if (code) initial[code] = val;
        if (camelKey) initial[camelKey] = val;
        if (role.otTeamRoleId) initial[role.otTeamRoleId] = val;
        if (idVal) {
          if (code) initial[`${code}_ID`] = idVal;
          if (camelKey) initial[`${camelKey}Id`] = idVal;
          if (role.otTeamRoleId) initial[`${role.otTeamRoleId}_ID`] = idVal;
        }
      }
    });

    setTeamData(initial);
  }, [bookingRecord, roles]);

  // ----- Handlers -----
  const handleUserChange = (role, selectedUserId) => {
    const userList = getUsersForRole(role);
    const selectedUser = userList.find(
      (u) => String(u.userId) === String(selectedUserId)
    );

    const code = role.roleCode || "";
    const camelKey = toCamelCase(code);
    const fullName = selectedUser
      ? (selectedUser.fullName || "").replace(/\s+/g, " ").trim()
      : "";
    const userId = selectedUser ? selectedUser.userId : "";

    setTeamData((prev) => ({
      ...prev,
      [code]: fullName,
      [`${code}_ID`]: userId,
      ...(camelKey
        ? {
            [camelKey]: fullName,
            [`${camelKey}Id`]: userId,
          }
        : {}),
      [role.otTeamRoleId]: fullName,
      [`${role.otTeamRoleId}_ID`]: userId,
    }));
  };

  const handleToggleEdit = () => setIsEditing(true);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      showPopup("OT Team assigned successfully!", "success", () => {
        if (onSave) {
          const teamMembers = roles.map((role) => {
            const code = role.roleCode || "";
            const camelKey = toCamelCase(code);
            const isPrimary = code.toUpperCase() === "PRIMARY_SURGEON";

            const memberName = isPrimary
              ? bookingRecord.primarySurgeon ||
                bookingRecord.surgeonName ||
                bookingRecord.surgeon ||
                teamData[code] ||
                ""
              : teamData[code] ||
                (camelKey ? teamData[camelKey] : "") ||
                teamData[role.otTeamRoleId] ||
                "";

            const userId = isPrimary
              ? bookingRecord.primarySurgeonId ||
                bookingRecord.surgeonId ||
                teamData[`${code}_ID`] ||
                ""
              : teamData[`${code}_ID`] ||
                (camelKey ? teamData[`${camelKey}Id`] : "") ||
                teamData[`${role.otTeamRoleId}_ID`] ||
                "";

            return {
              otTeamRoleId: role.otTeamRoleId,
              roleCode: role.roleCode,
              roleName: role.roleName,
              userTypeId: role.userTypeId,
              userId: userId || null,
              memberName: memberName || "",
            };
          });

          onSave({
            ...teamData,
            teamMembers,
          });
        }
      });
    }, 500);
  };

  const handleCancel = () => {
    if (isEditing) {
      // Revert changes from bookingRecord
      const reverted = {};
      const primarySurgeonVal =
        bookingRecord.primarySurgeon ||
        bookingRecord.surgeonName ||
        bookingRecord.surgeon ||
        "";
      const primarySurgeonIdVal =
        bookingRecord.primarySurgeonId ||
        bookingRecord.surgeonId ||
        "";

      if (Array.isArray(bookingRecord.teamMembers)) {
        bookingRecord.teamMembers.forEach((member) => {
          const code = member.roleCode || "";
          const camelKey = toCamelCase(code);
          const name = member.memberName || member.fullName || "";
          const uId = member.userId || "";

          if (code) {
            reverted[code] = name;
            reverted[`${code}_ID`] = uId;
          }
          if (camelKey) {
            reverted[camelKey] = name;
            reverted[`${camelKey}Id`] = uId;
          }
          if (member.otTeamRoleId) {
            reverted[member.otTeamRoleId] = name;
            reverted[`${member.otTeamRoleId}_ID`] = uId;
          }
        });
      }

      roles.forEach((role) => {
        const code = role.roleCode || "";
        const camelKey = toCamelCase(code);
        const isPrimary = code.toUpperCase() === "PRIMARY_SURGEON";

        if (isPrimary) {
          if (code) reverted[code] = primarySurgeonVal;
          if (camelKey) reverted[camelKey] = primarySurgeonVal;
          if (role.otTeamRoleId) reverted[role.otTeamRoleId] = primarySurgeonVal;
          if (primarySurgeonIdVal) {
            if (code) reverted[`${code}_ID`] = primarySurgeonIdVal;
            if (camelKey) reverted[`${camelKey}Id`] = primarySurgeonIdVal;
            if (role.otTeamRoleId) reverted[`${role.otTeamRoleId}_ID`] = primarySurgeonIdVal;
          }
          return;
        }

        if (!reverted[code]) {
          const val =
            bookingRecord[code] ||
            bookingRecord[role.otTeamRoleId] ||
            (camelKey ? bookingRecord[camelKey] : "") ||
            "";
          const idVal =
            bookingRecord[`${code}_ID`] ||
            bookingRecord[`${code}Id`] ||
            (camelKey ? bookingRecord[`${camelKey}Id`] : "") ||
            "";

          if (code) reverted[code] = val;
          if (camelKey) reverted[camelKey] = val;
          if (role.otTeamRoleId) reverted[role.otTeamRoleId] = val;
          if (idVal) {
            if (code) reverted[`${code}_ID`] = idVal;
            if (camelKey) reverted[`${camelKey}Id`] = idVal;
            if (role.otTeamRoleId) reverted[`${role.otTeamRoleId}_ID`] = idVal;
          }
        }
      });

      setTeamData(reverted);
      setIsEditing(false);
    } else {
      onClose();
    }
  };

  const showPopup = (message, type, onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  if (!bookingRecord) return null;

  // ----- Render -----
  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2 mb-0">
                {isEditing ? "Assign OT Team" : "VIEW / Modify OT Team"}
              </h4>
              <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                <i className="mdi mdi-arrow-left"></i> Back
              </button>
            </div>
            <div className="card-body">
              {/* Patient & Surgery Details */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">PATIENT & SURGERY DETAILS</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={bookingRecord.patientName || "-"}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">UHID / IP No.</label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={
                          bookingRecord.uhidNo ||
                          (bookingRecord.patientType === "OPD"
                            ? bookingRecord.uhid
                            : bookingRecord.ipNo) ||
                          "-"
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">OT</label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={bookingRecord.otName || "-"}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">Scheduled Date / Time</label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={`${bookingRecord.date || bookingRecord.preferredDate || "-"} ${
                          bookingRecord.time || bookingRecord.preferredStartTime
                            ? `(${bookingRecord.time || bookingRecord.preferredStartTime}${
                                bookingRecord.endTime || bookingRecord.preferredEndTime
                                  ? ` - ${bookingRecord.endTime || bookingRecord.preferredEndTime}`
                                  : ""
                              })`
                            : ""
                        }`.trim()}
                      />
                    </div>
                  </div>

                  {/* Surgery List Section */}
                  <div className="row mt-3">
                    <div className="col-12">
                      <label className="form-label fw-bold">
                        Surgery List{" "}
                        {Array.isArray(bookingRecord.surgeries) && bookingRecord.surgeries.length > 0
                          ? `(${bookingRecord.surgeries.length})`
                          : ""}
                      </label>
                      {Array.isArray(bookingRecord.surgeries) && bookingRecord.surgeries.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered table-sm align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: "50px" }} className="text-center">
                                  #
                                </th>
                                <th>Surgery Name</th>
                                <th>Anesthesia Required</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bookingRecord.surgeries.map((surg, sIdx) => (
                                <tr key={surg.otBookingRequestDtId || surg.surgeryId || sIdx}>
                                  <td className="text-center">{sIdx + 1}</td>
                                  <td className="fw-bold">{surg.surgeryName || "-"}</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        surg.anesthesiaRequired === "Y"
                                          ? "bg-warning text-dark"
                                          : "bg-secondary"
                                      }`}
                                    >
                                      {surg.anesthesiaRequired === "Y" ? "Yes" : "No"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={bookingRecord.surgery || bookingRecord.surgeryName || "-"}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Assignment Form */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">{isEditing ? "ASSIGN OT TEAM" : "VIEW / MODIFY OT TEAM"}</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {rolesLoading ? (
                      <div className="col-12 text-center py-4 text-muted">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Loading team roles...
                      </div>
                    ) : roles.length === 0 ? (
                      <div className="col-12 text-center py-4 text-muted">
                        No team roles available.
                      </div>
                    ) : (
                      roles.map((role) => {
                        const code = role.roleCode || "";
                        const camelKey = toCamelCase(code);
                        const isPrimary = code.toUpperCase() === "PRIMARY_SURGEON";

                        const userList = getUsersForRole(role);

                        const currentMemberName = isPrimary
                          ? bookingRecord.primarySurgeon ||
                            bookingRecord.surgeon ||
                            bookingRecord.surgeonName ||
                            teamData[code] ||
                            "Not Assigned"
                          : teamData[code] ||
                            (camelKey ? teamData[camelKey] : "") ||
                            teamData[role.otTeamRoleId] ||
                            "";

                        let currentUserId = isPrimary
                          ? bookingRecord.primarySurgeonId ||
                            bookingRecord.surgeonId ||
                            teamData[`${code}_ID`] ||
                            ""
                          : teamData[`${code}_ID`] ||
                            (camelKey ? teamData[`${camelKey}Id`] : "") ||
                            teamData[`${role.otTeamRoleId}_ID`] ||
                            "";

                        // Match ID from userList by name if ID was not previously stored
                        if (!currentUserId && currentMemberName) {
                          const matchedUser = userList.find(
                            (u) =>
                              (u.fullName || "").replace(/\s+/g, " ").trim().toLowerCase() ===
                              currentMemberName.replace(/\s+/g, " ").trim().toLowerCase()
                          );
                          if (matchedUser) {
                            currentUserId = matchedUser.userId;
                          }
                        }

                        return (
                          <div className="col-md-4 mb-3" key={role.otTeamRoleId || role.roleCode}>
                            <label className="form-label fw-bold">
                              {role.roleName}
                            </label>
                            {isPrimary ? (
                              <input
                                type="text"
                                className="form-control"
                                readOnly
                                value={currentMemberName}
                              />
                            ) : isEditing ? (
                              <select
                                className="form-select"
                                value={currentUserId || ""}
                                onChange={(e) => handleUserChange(role, e.target.value)}
                                disabled={usersLoading}
                              >
                                <option value="">
                                  {usersLoading
                                    ? "Loading users..."
                                    : userList.length === 0
                                    ? `No ${role.roleName} users available`
                                    : `Select ${role.roleName}`}
                                </option>
                                {userList.map((user) => {
                                  const name = (user.fullName || "")
                                    .replace(/\s+/g, " ")
                                    .trim();
                                  return (
                                    <option key={user.userId} value={user.userId}>
                                      {name}
                                    </option>
                                  );
                                })}
                                {/* Preserve assigned name if not in the current user list */}
                                {currentMemberName &&
                                  !userList.some((u) => String(u.userId) === String(currentUserId)) && (
                                    <option value={currentUserId || currentMemberName} disabled>
                                      {currentMemberName} (Current)
                                    </option>
                                  )}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="form-control"
                                readOnly
                                value={currentMemberName || "Not Assigned"}
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {isEditing ? (
                    <div className="d-flex justify-content-end mt-4 gap-2">
                      <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Saving...
                          </>
                        ) : (
                          "Save Team Assignment"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-end mt-4">
                      <button className="btn btn-primary" onClick={handleToggleEdit}>
                        <i className="fa fa-pencil"></i> Modify Team
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}
    </div>
  );
};

export default OTTeamAssignment;

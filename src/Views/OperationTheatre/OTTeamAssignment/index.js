// OTBookingHistory/OTTeamAssignment.js
import { useState, useEffect, useCallback } from "react";
import Popup from "../../../Components/popup";
import { getRequest, postRequest } from "../../../service/apiService";
import {
  MAS_OT_TEAM_ROLE_GET_ALL,
  GET_USERS_BY_USER_TYPE,
  OT_TEAM_MEMBER,
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
  const [assignedMembers, setAssignedMembers] = useState({});
  const [savedMembers, setSavedMembers] = useState({});
  const [otTeamMemberId, setOtTeamMemberId] = useState(
    bookingRecord?.otTeamMemberId && Number(bookingRecord.otTeamMemberId) > 0
      ? Number(bookingRecord.otTeamMemberId)
      : null
  );

  // Helper to extract users for a given role by its userTypeId
  const getUsersForRole = useCallback(
    (role) => {
      if (!role?.userTypeId) return [];
      const list = usersByUserType[role.userTypeId] || [];
      return list.filter((u) => !u.status || u.status.toLowerCase() === "y");
    },
    [usersByUserType]
  );

  // ----- Fetch Dynamic Roles, Users & Existing Team Members -----
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        setRolesLoading(true);
        const res = await getRequest(MAS_OT_TEAM_ROLE_GET_ALL);
        if (!isMounted) return;

        let activeRoles = [];
        if (res?.response && Array.isArray(res.response)) {
          // Filter active roles and order by otTeamRoleId (primary surgeon first)
          activeRoles = res.response
            .filter((r) => r.status === "Y" || !r.status)
            .sort((a, b) => {
              const codeA = (a.roleCode || "").toUpperCase();
              const codeB = (b.roleCode || "").toUpperCase();
              if (codeA === "PRIMARY_SURGEON") return -1;
              if (codeB === "PRIMARY_SURGEON") return 1;
              return (a.otTeamRoleId || 0) - (b.otTeamRoleId || 0);
            });
          setRoles(activeRoles);
        } else {
          setRoles([]);
        }

        // Fetch users for each unique userTypeId
        const uniqueUserTypeIds = Array.from(
          new Set(
            activeRoles
              .map((r) => r.userTypeId)
              .filter((id) => id !== null && id !== undefined && id !== "")
          )
        );

        let loadedUsersMap = {};
        if (uniqueUserTypeIds.length > 0) {
          setUsersLoading(true);
          try {
            await Promise.all(
              uniqueUserTypeIds.map(async (uId) => {
                try {
                  const userRes = await getRequest(
                    `${GET_USERS_BY_USER_TYPE}?userTypeId=${uId}`
                  );
                  if (userRes?.response && Array.isArray(userRes.response)) {
                    loadedUsersMap[uId] = userRes.response;
                  } else {
                    loadedUsersMap[uId] = [];
                  }
                } catch (err) {
                  console.error(
                    `Error fetching users for userTypeId ${uId}:`,
                    err
                  );
                  loadedUsersMap[uId] = [];
                }
              })
            );
            if (isMounted) {
              setUsersByUserType(loadedUsersMap);
            }
          } catch (err) {
            console.error("Error fetching users by userType:", err);
            showPopup(FETCH_USERS_BY_USER_TYPE_ERR, "error");
          } finally {
            if (isMounted) {
              setUsersLoading(false);
            }
          }
        }

        // Fetch existing assigned team members from backend
        const bId = bookingRecord?.otBookingId || bookingRecord?.id;
        let existingMembers = [];
        let loadedMemberId = null;

        if (bId) {
          try {
            const teamRes = await getRequest(
              `${OT_TEAM_MEMBER}?otBookingId=${bId}`
            );
            if (teamRes?.response) {
              const resp = teamRes.response;
              existingMembers = Array.isArray(resp)
                ? resp
                : Array.isArray(resp?.teamMembers)
                ? resp.teamMembers
                : [];
              loadedMemberId =
                resp?.otTeamMemberId ||
                existingMembers[0]?.otTeamMemberId ||
                null;
            }
          } catch (err) {
            console.error("Error fetching existing team assignment:", err);
          }
        }

        if (isMounted) {
          if (loadedMemberId && Number(loadedMemberId) > 0) {
            setOtTeamMemberId(Number(loadedMemberId));
          }

          const initialMap = {};

          // 1. Populate from backend existing assigned members
          if (existingMembers.length > 0) {
            existingMembers.forEach((member) => {
              if (member.otTeamRoleId) {
                const roleId = Number(member.otTeamRoleId);
                initialMap[roleId] = {
                  otTeamRoleId: roleId,
                  userId: member.userId ? Number(member.userId) : null,
                  userFullName:
                    member.userFullName ||
                    member.fullName ||
                    member.memberName ||
                    "",
                  isPrimary:
                    member.isPrimary === "Y" || roleId === 1 ? "Y" : "N",
                };
              }
            });
          }

          // 2. Populate Primary Surgeon from bookingRecord if not already populated
          const primaryRole = activeRoles.find(
            (r) =>
              (r.roleCode || "").toUpperCase() === "PRIMARY_SURGEON" ||
              r.otTeamRoleId === 1
          );

          if (primaryRole) {
            const primaryRoleId = Number(primaryRole.otTeamRoleId);
            if (!initialMap[primaryRoleId]) {
              const primarySurgeonName =
                bookingRecord.primarySurgeon ||
                bookingRecord.surgeonName ||
                bookingRecord.surgeon ||
                "";
              let primarySurgeonId =
                bookingRecord.primarySurgeonId ||
                bookingRecord.surgeonId ||
                null;

              // Match by name in loaded users if ID is not available
              if (!primarySurgeonId && primarySurgeonName) {
                const usersForRole =
                  loadedUsersMap[primaryRole.userTypeId] || [];
                const normalizedName = primarySurgeonName
                  .replace(/\s+/g, " ")
                  .trim()
                  .toLowerCase();
                const matched = usersForRole.find(
                  (u) =>
                    (u.fullName || "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .toLowerCase() === normalizedName
                );
                if (matched) {
                  primarySurgeonId = matched.userId;
                }
              }

              initialMap[primaryRoleId] = {
                otTeamRoleId: primaryRoleId,
                userId: primarySurgeonId ? Number(primarySurgeonId) : null,
                userFullName: primarySurgeonName,
                isPrimary: "Y",
              };
            }
          }

          setAssignedMembers(initialMap);
          setSavedMembers(initialMap);
        }
      } catch (error) {
        console.error("Error fetching OT team roles:", error);
        showPopup(FETCH_OT_TEAM_ROLE, "error");
        if (isMounted) setRoles([]);
      } finally {
        if (isMounted) setRolesLoading(false);
      }
    };

    if (bookingRecord) {
      initializeData();
    }

    return () => {
      isMounted = false;
    };
  }, [bookingRecord]);

  // ----- Handlers -----
  const handleUserChange = (role, selectedUserId) => {
    const roleId = Number(role.otTeamRoleId);
    const userList = getUsersForRole(role);
    const selectedUser = userList.find(
      (u) => String(u.userId) === String(selectedUserId)
    );

    setAssignedMembers((prev) => {
      const updated = { ...prev };
      if (!selectedUserId) {
        delete updated[roleId];
      } else {
        const fullName = selectedUser
          ? (selectedUser.fullName || "").replace(/\s+/g, " ").trim()
          : "";
        updated[roleId] = {
          otTeamRoleId: roleId,
          userId: Number(selectedUserId),
          userFullName: fullName,
          isPrimary:
            (role.roleCode || "").toUpperCase() === "PRIMARY_SURGEON" ||
            roleId === 1
              ? "Y"
              : "N",
        };
      }
      return updated;
    });
  };

  const handleToggleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    const otBookingId = Number(
      bookingRecord.otBookingId || bookingRecord.id || 0
    );

    if (!otBookingId) {
      showPopup("Booking ID not found. Cannot save team assignment.", "error");
      return;
    }

    // Build teamMembers list dynamically from roles and assignedMembers
    const teamMembersList = [];

    roles.forEach((role) => {
      const roleId = Number(role.otTeamRoleId);
      const isPrimary =
        (role.roleCode || "").toUpperCase() === "PRIMARY_SURGEON" ||
        roleId === 1;
      const assignment = assignedMembers[roleId];

      let userId = assignment?.userId ? Number(assignment.userId) : null;

      // If primary surgeon and userId not yet resolved, attempt to match by name
      if (isPrimary && !userId) {
        const surgeonName = (
          assignment?.userFullName ||
          bookingRecord.primarySurgeon ||
          bookingRecord.surgeonName ||
          bookingRecord.surgeon ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();

        if (surgeonName) {
          const userList = getUsersForRole(role);
          const match = userList.find(
            (u) =>
              (u.fullName || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase() === surgeonName
          );
          if (match) {
            userId = Number(match.userId);
          }
        }
      }

      if (userId && userId > 0) {
        teamMembersList.push({
          otTeamRoleId: roleId,
          userId: userId,
          isPrimary: isPrimary ? "Y" : "N",
        });
      }
    });

    if (teamMembersList.length === 0) {
      showPopup("Please assign at least one team member.", "error");
      return;
    }

    const payload = {
      otBookingId: otBookingId,
      teamMembers: teamMembersList,
    };

    setIsSaving(true);
    try {
      const res = await postRequest(OT_TEAM_MEMBER, payload);

      if (
        res?.status === 200 ||
        res?.status === 201 ||
        res?.statuss === "success" ||
        res?.message === "success"
      ) {
        const savedData = res?.response || res;
        const newTeamMemberId =
          savedData?.otTeamMemberId ||
          (Array.isArray(savedData?.teamMembers) &&
            savedData.teamMembers[0]?.otTeamMemberId) ||
          otTeamMemberId;

        if (newTeamMemberId && Number(newTeamMemberId) > 0) {
          setOtTeamMemberId(Number(newTeamMemberId));
        }

        setSavedMembers(assignedMembers);

        const successMsg =
          typeof res?.message === "string" && res.message !== "success"
            ? res.message
            : "OT Team assigned successfully!";

        showPopup(successMsg, "success", () => {
          setIsEditing(false);
          if (onSave) {
            const enrichedMembers = roles.map((role) => {
              const roleId = Number(role.otTeamRoleId);
              const isPrimary =
                (role.roleCode || "").toUpperCase() === "PRIMARY_SURGEON" ||
                roleId === 1;
              const assignment = assignedMembers[roleId];

              return {
                otTeamRoleId: roleId,
                roleCode: role.roleCode,
                roleName: role.roleName,
                userTypeId: role.userTypeId,
                userId: assignment?.userId || null,
                memberName: assignment?.userFullName || "",
                isPrimary: isPrimary ? "Y" : "N",
              };
            });

            const teamDataForHistory = {
              otTeamMemberId: newTeamMemberId,
              teamMembers: enrichedMembers,
              primarySurgeon:
                bookingRecord.primarySurgeon ||
                bookingRecord.surgeonName ||
                bookingRecord.surgeon ||
                assignedMembers[1]?.userFullName ||
                "",
            };

            roles.forEach((r) => {
              const code = r.roleCode;
              const camelKey = toCamelCase(code);
              const assignment = assignedMembers[r.otTeamRoleId];
              if (assignment) {
                if (code) teamDataForHistory[code] = assignment.userFullName;
                if (camelKey)
                  teamDataForHistory[camelKey] = assignment.userFullName;
                teamDataForHistory[r.otTeamRoleId] = assignment.userFullName;
              }
            });

            onSave(teamDataForHistory);
          }
        });
      } else {
        showPopup(
          res?.message || "Failed to save OT Team Assignment.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving OT team members:", error);
      showPopup(
        error?.message ||
          "Failed to save OT Team Assignment. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      // Revert to saved snapshot
      setAssignedMembers(savedMembers);
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
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
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
                      <label className="form-label fw-bold">
                        UHID / IP No.
                      </label>
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
                      <label className="form-label fw-bold">
                        Scheduled Date / Time
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={`${
                          bookingRecord.date ||
                          bookingRecord.preferredDate ||
                          "-"
                        } ${
                          bookingRecord.time || bookingRecord.preferredStartTime
                            ? `(${
                                bookingRecord.time ||
                                bookingRecord.preferredStartTime
                              }${
                                bookingRecord.endTime ||
                                bookingRecord.preferredEndTime
                                  ? ` - ${
                                      bookingRecord.endTime ||
                                      bookingRecord.preferredEndTime
                                    }`
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
                        {Array.isArray(bookingRecord.surgeries) &&
                        bookingRecord.surgeries.length > 0
                          ? `(${bookingRecord.surgeries.length})`
                          : ""}
                      </label>
                      {Array.isArray(bookingRecord.surgeries) &&
                      bookingRecord.surgeries.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered table-sm align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th
                                  style={{ width: "50px" }}
                                  className="text-center"
                                >
                                  #
                                </th>
                                <th>Surgery Name</th>
                                <th>Anesthesia Required</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bookingRecord.surgeries.map((surg, sIdx) => (
                                <tr
                                  key={
                                    surg.otBookingRequestDtId ||
                                    surg.surgeryId ||
                                    sIdx
                                  }
                                >
                                  <td className="text-center">{sIdx + 1}</td>
                                  <td className="fw-bold">
                                    {surg.surgeryName || "-"}
                                  </td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        surg.anesthesiaRequired === "Y"
                                          ? "bg-warning text-dark"
                                          : "bg-secondary"
                                      }`}
                                    >
                                      {surg.anesthesiaRequired === "Y"
                                        ? "Yes"
                                        : "No"}
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
                          value={
                            bookingRecord.surgery ||
                            bookingRecord.surgeryName ||
                            "-"
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Assignment Form */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    {isEditing ? "ASSIGN OT TEAM" : "VIEW / MODIFY OT TEAM"}
                  </h5>
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
                        const roleId = Number(role.otTeamRoleId);
                        const isPrimary =
                          (role.roleCode || "").toUpperCase() ===
                            "PRIMARY_SURGEON" || roleId === 1;

                        const userList = getUsersForRole(role);
                        const assignment = assignedMembers[roleId] || {};
                        const currentMemberName =
                          assignment.userFullName || "";
                        const currentUserId = assignment.userId
                          ? String(assignment.userId)
                          : "";

                        return (
                          <div
                            className="col-md-4 mb-3"
                            key={roleId || role.roleCode}
                          >
                            <label className="form-label fw-bold">
                              {role.roleName}
                            </label>
                            {isPrimary ? (
                              <input
                                type="text"
                                className="form-control"
                                readOnly
                                value={currentMemberName || "Not Assigned"}
                              />
                            ) : isEditing ? (
                              <select
                                className="form-select"
                                value={currentUserId}
                                onChange={(e) =>
                                  handleUserChange(role, e.target.value)
                                }
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
                                    <option
                                      key={user.userId}
                                      value={user.userId}
                                    >
                                      {name}
                                    </option>
                                  );
                                })}
                                {/* Preserve assigned name if not in the current user list */}
                                {currentUserId &&
                                  !userList.some(
                                    (u) =>
                                      String(u.userId) === String(currentUserId)
                                  ) && (
                                    <option value={currentUserId} disabled>
                                      {currentMemberName ||
                                        `User #${currentUserId}`}{" "}
                                      (Current)
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
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
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
                      <button
                        className="btn btn-primary"
                        onClick={handleToggleEdit}
                      >
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

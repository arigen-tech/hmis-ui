import { useState, useEffect, useMemo } from "react"
import "./sidebar.css"
import { Link, useLocation } from "react-router-dom"
import { getRequest } from "../../service/apiService"

const iconMap = {
  OPD: "icofont-hospital",
  "OPD Waiting List": "icofont-waiter",
  "Opd Preconsultation": "icofont-doctor",

  Master: "icofont-gear",
  "Department Master": "icofont-building",
  "Religion master": "icofont-book",
  "Gender Master": "icofont-user",
  "Relation Master": "icofont-users-alt-2",
  "Blood Group Master": "icofont-blood-drop",
  "Marital Status": "icofont-heart-alt",
  "Department Type": "icofont-ui-settings",
  "Hospital Master": "icofont-hospital",
  "Country Master": "icofont-earth",
  "State Master": "icofont-map",
  "District Master": "icofont-map-pins",
  "Identification Master": "icofont-id",
  RCMC: "icofont-clip",
  "Frequency Master": "icofont-alarm",
  "OPD Master": "icofont-doctor",
  "Treatment Advice Master": "icofont-prescription",
  "Create User Master": "icofont-user-alt-5",
  "User Department": "icofont-building-alt",

  Report: "icofont-chart-bar-graph",
  "Report 1": "icofont-file-document",
  Report2: "icofont-file-alt",

  "Investigation Pricing": "icofont-calculator-alt-2",

  ADMIN: "icofont-lock",
  "Manage User Application": "icofont-ui-user-group",
  "Add Form Reports": "icofont-file-document",
  "Assign Application": "icofont-paper",
  "Roles Rights": "icofont-users-alt-4",
  "Appointment Setup": "icofont-ui-calendar",
  "Doctor Roaster": "icofont-stethoscope",
  "Role Master": "icofont-businessman",
  "Template Master": "icofont-page",
  "Patient Registration": "icofont-ui-add",
  "Update Patient Registration": "icofont-edit",
  "Register Employee": "icofont-users-alt-5",

  Stores: "icofont-shopping-cart",
  "Item Class": "icofont-box",

  Laboratory: "icofont-laboratory",
  "Lab Registration": "icofont-ui-add",
  "Sub Charge Code": "icofont-code",
  "Main Chargecode": "icofont-code-alt",
  "UOM Master": "icofont-ruler-alt-1",
  "Sample Collection Master": "icofont-test-bottle",
  "Opening Balance": "icofont-coins",
  "Physical Stock": "icofont-capsule",
  Indent: "icofont-prescription",
}

const getIconClass = (name) => iconMap[name] || "icofont-ui-folder"

const Sidebar = () => {
  const [loading, setLoading] = useState(false)
  const [menuData, setMenuData] = useState([])
  const [searchText, setSearchText] = useState("")
  const location = useLocation()

  const rolesId = localStorage.getItem("roleId") || sessionStorage.getItem("roleId")

  useEffect(() => {
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    setLoading(true)
    try {
      const data = await getRequest(`/url/getAllUrlByRoles/${rolesId}`)
      if (data.status === 200 && Array.isArray(data.response)) {
        setMenuData(data.response)

        const extractUrls = (items) => {
          const urls = []
          for (const item of items) {
            if (item.url && item.url !== "#") urls.push(item.url)
            if (item.children?.length) urls.push(...extractUrls(item.children))
          }
          return urls
        }

        sessionStorage.setItem("allowedUrls", JSON.stringify(extractUrls(data.response)))
      } else {
        setMenuData([])
      }
    } catch (error) {
      console.error("Error fetching Menu data:", error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path) => location.pathname === path

  const filterMenu = (items, searchText) => {
    if (!searchText.trim()) return items

    return items
      .map((item) => {
        const matches = item.name.toLowerCase().includes(searchText.toLowerCase())
        const filteredChildren = item.children ? filterMenu(item.children, searchText) : []

        if (matches || filteredChildren.length > 0) {
          return { ...item, children: filteredChildren }
        }

        return null
      })
      .filter(Boolean)
  }

  const filteredMenu = useMemo(() => filterMenu(menuData, searchText), [menuData, searchText])

  const renderMenuItems = (items, parentId = "") => {
    return items.map((item, index) => {
      const hasChildren = item.children && item.children.length > 0
      const collapseId = `collapse-${parentId}-${index}`

      return (
        <li key={`${parentId}-${index}`} className="collapsed">

          {hasChildren ? (
            <>
              <Link
                className="m-link"
                data-bs-toggle="collapse"
                data-bs-target={`#${collapseId}`}
                to={item.url !== "#" ? item.url : "#"}
              >
                <i className={`${getIconClass(item.name)} fs-5`} />
                <span>{item.name}</span>

                <span
                  className="arrow icofont-rounded-down ms-auto text-end fs-5 collapse-arrow"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${collapseId}`}
                ></span>
              </Link>

              <ul className="sub-menu collapse" id={collapseId}>
                {renderMenuItems(item.children, `${parentId}-${index}`)}
              </ul>

            </>
          ) : (
            <Link className={`ms-link ${isActive(item.url) ? "active" : ""}`} to={item.url}>
              <i className={`${getIconClass(item.name)} fs-5 me-2`} />
              {item.name}
            </Link>
          )}
        </li>
      )
    })
  }

  return (
    <div className="sidebar px-4 py-4 py-md-5 me-0 ms-1">
      <div className="d-flex flex-column h-100">

        <Link to="index" className="mb-0 brand-icon">
          <span className="logo-icon">
            <i className="icofont-heart-beat fs-2" />
          </span>
          <span className="logo-text">Arigen-Health</span>
        </Link>

        <div
          className="position-sticky"
          style={{ top: 0, zIndex: 1020, background: "inherit", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
        >
          <input
            id="sidebar-search"
            type="search"
            className="form-control"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <ul className="menu-list flex-grow-1 mt-3">

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="d-flex align-items-center mb-3">
                <div className="skeleton-icon bg-custom me-3 rounded-circle"></div>
                <div className="skeleton-text bg-custom rounded w-75"></div>
              </li>
            ))
          ) : filteredMenu.length > 0 ? (
            renderMenuItems(filteredMenu)
          ) : (
            <li className="text-center text-muted mt-3">
              <i className="icofont-search-document fs-4 me-2"></i> No matching results
            </li>
          )}
        </ul>

        <button type="button" className="btn btn-link sidebar-mini-btn text-light">
          <span className="ms-2">
            <i className="icofont-bubble-right" />
          </span>
        </button>

      </div>
    </div>
  )
}

export default Sidebar

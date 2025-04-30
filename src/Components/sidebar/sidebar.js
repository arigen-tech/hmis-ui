import React, { useState, useEffect } from 'react';
import './sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import { getRequest } from "../../service/apiService";

const iconMap = {
  "OPD": "icofont-hospital",
  "OPD Waiting List": "icofont-waiter",
  "Master": "icofont-gear",
  "Department Master": "icofont-building",
  "Gender Master": "icofont-user",
  "Report": "icofont-chart-bar-graph",
  "Report 1": "icofont-file-document"

};

const getIconClass = (name) => iconMap[name] || "icofont-ui-folder";

const Sidebar = () => {
  const [loading, setLoading] = useState(false);
  const [menuData, setMenuData] = useState([]);
  const location = useLocation();

  const rolesId = localStorage.getItem("roleId") || sessionStorage.getItem("roleId");

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`/url/getAllUrlByRoles/${rolesId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setMenuData(data.response);

        // Flatten the nested URLs
        const extractUrls = (items) => {
          let urls = [];
          for (const item of items) {
            if (item.url && item.url !== "#") {
              urls.push(item.url);
            }
            if (item.children && item.children.length > 0) {
              urls.push(...extractUrls(item.children));
            }
          }
          return urls;
        };

        const allowedUrls = extractUrls(data.response);

        // Save to sessionStorage or localStorage
        sessionStorage.setItem("allowedUrls", JSON.stringify(allowedUrls));
      } else {
        console.error("Unexpected API response format:", data);
        setMenuData([]);
      }
    } catch (error) {
      console.error("Error fetching Menu data:", error);
    } finally {
      setLoading(false);
    }
  };


  const isActive = (path) => location.pathname === path;

  const renderMenuItems = (items, level = 0, parentId = '') => {
    return items.map((item, index) => {
      const hasChildren = item.children && item.children.length > 0;
      const collapseId = `collapse-${parentId}-${index}`;

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
                <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
              </Link>
              <ul className="sub-menu collapse" id={collapseId}>
                {renderMenuItems(item.children, level + 1, `${parentId}-${index}`)}
              </ul>
            </>
          ) : (
            <Link
              className={`ms-link ${isActive(item.url) ? 'active' : ''}`}
              to={item.url}
            >
              <i className={`${getIconClass(item.name)} fs-5 me-2`} />
              {item.name}
            </Link>
          )}
        </li>
      );
    });
  };

  return (
    <div className="sidebar px-4 py-4 py-md-5 me-0">
      <div className="d-flex flex-column h-100">
        <Link to="index" className="mb-0 brand-icon">
          <span className="logo-icon">
            <i className="icofont-heart-beat fs-2" />
          </span>
          <span className="logo-text">Arigen-Health</span>
        </Link>

        <ul className="menu-list flex-grow-1 mt-3">
          {loading ? <li>Loading...</li> : renderMenuItems(menuData)}
        </ul>

        <button type="button" className="btn btn-link sidebar-mini-btn text-light">
          <span className="ms-2">
            <i className="icofont-bubble-right" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

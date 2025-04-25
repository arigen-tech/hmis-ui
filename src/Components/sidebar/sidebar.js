import React, { useState, useEffect } from 'react';
import './sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import { getRequest } from "../../service/apiService";
import { API_HOST } from "../../config/apiConfig";

const Sidebar = () => {
  const [loading, setLoading] = useState(false);
  const [menuData, setMenuData] = useState([]);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  }

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

  return (
    <div className="sidebar px-4 py-4 py-md-5 me-0">
      <div className="d-flex flex-column h-100">
        <Link to="index" className="mb-0 brand-icon">
          <span className="logo-icon">
            <i className="icofont-heart-beat fs-2" />
          </span>
          <span className="logo-text">Arigen-Health</span>
        </Link>
        
        {/* Dynamic Menu List */}
        <ul className="menu-list flex-grow-1 mt-3">
          {loading ? (
            <li>Loading...</li>
          ) : (
            menuData.map((menu, index) => (
              <li key={index} className="collapsed">
                <Link
                  className="m-link"
                  data-bs-toggle="collapse"
                  data-bs-target={`#menu-${index}`}
                  to={menu.parentUrl}
                >
                  <i className="icofont-settings-alt fs-5" /> 
                  <span>{menu.parentName}</span>
                  <span className="arrow icofont-rounded-down ms-auto text-end fs-5" />
                </Link>
                
                {/* Submenu Items */}
                <ul className="sub-menu collapse" id={`menu-${index}`}>
                  {menu.children.map((submenu, subIndex) => (
                    <li key={subIndex}>
                      <Link 
                        className={`ms-link ${isActive(submenu.chiledUrl) ? 'active' : ''}`}
                        to={submenu.chiledUrl}
                      >
                        {submenu.chiledName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))
          )}
        </ul>

        {/* Menu collapse button */}
        <button type="button" className="btn btn-link sidebar-mini-btn text-light">
          <span className="ms-2">
            <i className="icofont-bubble-right" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
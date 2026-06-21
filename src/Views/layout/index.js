import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from "../../Components/header/header";
import Footer from "../../Components/footer/footer";
import Sidebar  from '../../Components/sidebar/sidebar';
const Layout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return(
      <div id="ihealth-layout" className="theme-tradewind">
        <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        <div className="main px-lg-2 px-md-2">
          <Header toggleSidebar={toggleSidebar} collapsed={sidebarCollapsed} />
            
            <div className="main-panel">

                  <Outlet />
            <Footer />
            </div>
          </div>
        </div>
    );
}
export default Layout;
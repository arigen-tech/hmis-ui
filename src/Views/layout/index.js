import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from "../../Components/header/header";
import Footer from "../../Components/footer/footer";
import Sidebar  from '../../Components/sidebar/sidebar';
const Layout = () => {
    return(
      <div id="ihealth-layout" className="theme-tradewind">
        <Sidebar />
      <div className="main px-lg-4 px-md-4">
         <Header />
            
            <div className="main-panel">

                  <Outlet />
            <Footer />
            </div>
          </div>
        </div>
    );
}
export default Layout;
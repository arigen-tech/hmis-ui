import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import "./sidebar.css";
import { Link, useLocation } from "react-router-dom";
import { getRequest } from "../../service/apiService";
import { GET_URL_BY_ROLES } from "../../config/apiConfig";

const iconMap = {
  DASHBOARD: "icofont-dashboard-web",
  "Dashboard": "icofont-dashboard",
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
  "ABDM Milestone 2 & 3": "icofont-heart-beat",
};

const getIconClass = (name) => iconMap[name] || "icofont-ui-folder";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const [loading, setLoading] = useState(false);
  const [menuData, setMenuData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const location = useLocation();

  const rolesId =
    localStorage.getItem("activeRoleId") ||
    sessionStorage.getItem("activeRoleId") ||
    localStorage.getItem("roleId") ||
    sessionStorage.getItem("roleId");

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${GET_URL_BY_ROLES}/${rolesId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        let menuItems = data.response;
        const hasAbdmRoute = menuItems.some(
          item => item.url === "/abdm-milestone2" || (item.children && item.children.some(child => child.url === "/abdm-milestone2"))
        );
        if (!hasAbdmRoute) {
          menuItems = [
            ...menuItems,
            {
              name: "ABDM Milestone 2 & 3",
              url: "/abdm-milestone2",
              children: []
            }
          ];
        }
        setMenuData(menuItems);

        const extractUrls = (items) => {
          const urls = [];
          for (const item of items) {
            if (item.url && item.url !== "#") urls.push(item.url);
            if (item.children?.length) urls.push(...extractUrls(item.children));
          }
          return urls;
        };

        sessionStorage.setItem("allowedUrls", JSON.stringify(extractUrls(menuItems)));
      } else {
        setMenuData([]);
      }
    } catch (error) {
      console.error("Error fetching Menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const filterMenu = (items, searchText) => {
    if (!searchText.trim()) return items;

    return items
      .map((item) => {
        const matches = item.name.toLowerCase().includes(searchText.toLowerCase());
        const filteredChildren = item.children ? filterMenu(item.children, searchText) : [];

        if (matches || filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }
        return null;
      })
      .filter(Boolean);
  };

  const filteredMenu = useMemo(() => filterMenu(menuData, searchText), [menuData, searchText]);

  const renderMenuItems = (items, parentId = "") => {
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
      );
    });
  };

  // ==================== CUSTOM DRAGGABLE SCROLLBAR ====================
  // Fully imperative: no React state is touched during scroll/drag. The
  // thumb's height/position/visibility are written straight to the DOM via
  // refs, throttled to one update per animation frame, so dragging never
  // triggers a React re-render and stays smooth even on long menus.

  const menuListRef = useRef(null);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const rafIdRef = useRef(null);
  const dragRef = useRef({
    dragging: false,
    startY: 0,
    startScrollTop: 0,
    maxScrollTop: 0,
    maxThumbTop: 0
  });

  const MIN_THUMB_HEIGHT = 32;

  // Reads current scroll geometry and writes it straight to the thumb's
  // style / the track's "visible" class - no setState involved.
  const applyThumb = useCallback(() => {
    const list = menuListRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!list || !track || !thumb) return;

    const { scrollHeight, clientHeight, scrollTop } = list;
    const trackHeight = track.clientHeight;

    if (scrollHeight <= clientHeight + 1) {
      track.classList.remove("visible");
      return;
    }
    track.classList.add("visible");

    const ratio = clientHeight / scrollHeight;
    const thumbHeight = Math.max(trackHeight * ratio, MIN_THUMB_HEIGHT);
    const maxScrollTop = scrollHeight - clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${thumbTop}px)`;
  }, []);

  // Collapses any pending calls within the same frame into a single update.
  const scheduleApplyThumb = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      applyThumb();
    });
  }, [applyThumb]);

  // Recalculate whenever the menu content changes (search filter, load, collapse)
  useEffect(() => {
    applyThumb();
  }, [filteredMenu, loading, collapsed, applyThumb]);

  // Recalculate on container resize (e.g. window resize, sidebar height changes)
  useEffect(() => {
    const list = menuListRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => scheduleApplyThumb());
    observer.observe(list);
    return () => observer.disconnect();
  }, [scheduleApplyThumb]);

  // Extra safety nets: window resize, and icon-font load (icofont loading
  // late can change row heights after the first measurement was taken).
  useEffect(() => {
    window.addEventListener("resize", scheduleApplyThumb);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleApplyThumb).catch(() => {});
    }
    return () => window.removeEventListener("resize", scheduleApplyThumb);
  }, [scheduleApplyThumb]);

  const handleMenuScroll = () => {
    // While actively dragging, the pointer-move handler below already keeps
    // the thumb in perfect sync - skip the redundant (and reflow-triggering)
    // recalculation here so drag frames stay pure writes.
    if (dragRef.current.dragging) return;
    scheduleApplyThumb();
  };

  // ---- Dragging the thumb ----
  // Uses the Pointer Events API with setPointerCapture: once capture is set
  // on the thumb, move/up events keep firing on that element even when the
  // cursor leaves it - no window-level listeners needed at all. Geometry
  // (scrollHeight/clientHeight/trackHeight) is measured exactly once, at
  // drag-start, and cached in dragRef. Every pointermove after that is a
  // pure write (scrollTop + transform) with zero DOM reads, so nothing
  // forces a synchronous layout recalculation while dragging - that
  // read/write interleaving was the actual source of the lag.

  const startDragging = (clientY, pointerId) => {
    const list = menuListRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!list || !track || !thumb) return;

    const { scrollHeight, clientHeight, scrollTop } = list;
    const trackHeight = track.clientHeight;
    const thumbHeight = Math.max(trackHeight * (clientHeight / scrollHeight), MIN_THUMB_HEIGHT);
    const maxThumbTop = trackHeight - thumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;

    dragRef.current = {
      dragging: true,
      startY: clientY,
      startScrollTop: scrollTop,
      maxScrollTop,
      maxThumbTop
    };

    thumb.classList.add("dragging");
    document.body.style.userSelect = "none";

    if (pointerId != null) {
      try {
        thumb.setPointerCapture(pointerId);
      } catch (_) {
        /* no-op - unsupported pointer id, drag still works via the capture-less path */
      }
    }
  };

  const handleThumbPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    startDragging(e.clientY, e.pointerId);
  };

  const handleThumbPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const list = menuListRef.current;
    const thumb = thumbRef.current;
    if (!list || !thumb) return;

    const { startY, startScrollTop, maxScrollTop, maxThumbTop } = dragRef.current;
    const deltaY = e.clientY - startY;
    const scrollableRatio = maxThumbTop > 0 ? maxScrollTop / maxThumbTop : 0;
    const newScrollTop = Math.min(Math.max(startScrollTop + deltaY * scrollableRatio, 0), maxScrollTop);

    // Pure writes - no property reads in this handler - so nothing forces
    // a synchronous reflow between frames.
    list.scrollTop = newScrollTop;
    const newThumbTop = maxScrollTop > 0 ? (newScrollTop / maxScrollTop) * maxThumbTop : 0;
    thumb.style.transform = `translateY(${newThumbTop}px)`;
  };

  const handleThumbPointerUp = (e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const thumb = thumbRef.current;
    thumb?.classList.remove("dragging");
    document.body.style.userSelect = "";
    if (thumb && e.pointerId != null) {
      try {
        thumb.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* already released */
      }
    }
  };

  // Click on the track (not the thumb) jumps the scroll to that position
  const handleTrackMouseDown = (e) => {
    if (e.target !== trackRef.current) return; // ignore clicks that started on the thumb
    const list = menuListRef.current;
    const track = trackRef.current;
    if (!list || !track) return;

    const trackRect = track.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const { scrollHeight, clientHeight } = list;
    const trackHeight = track.clientHeight;
    const thumbHeight = Math.max(trackHeight * (clientHeight / scrollHeight), MIN_THUMB_HEIGHT);
    const maxThumbTop = trackHeight - thumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;

    const targetThumbTop = Math.min(Math.max(clickY - thumbHeight / 2, 0), maxThumbTop);
    const targetScrollTop = maxThumbTop > 0 ? (targetThumbTop / maxThumbTop) * maxScrollTop : 0;

    list.scrollTo({ top: targetScrollTop, behavior: "smooth" });
  };

  return (
    <div className={`sidebar px-3 py-4 py-md-4 me-0 ms-1 ${collapsed ? "sidebar-mini" : "open"}`}>
      <div className="sidebar-inner">
        {/* Brand - fixed */}
        <Link to="index" className="mb-0 brand-icon">
          <span className="logo-icon">
            <i className="icofont-heart-beat fs-2" />
          </span>
          <span className="logo-text">Arigen-Health</span>
        </Link>

        {/* Search - fixed */}
        <div className="sidebar-search-wrapper">
          <input
            id="sidebar-search"
            type="search"
            className="form-control"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Scrollable menu list + custom draggable scrollbar */}
        <div className="menu-list-wrapper">
          <ul
            className="menu-list mt-3"
            ref={menuListRef}
            onScroll={handleMenuScroll}
          >
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

          {/* Track is always mounted (so trackRef/thumbRef are available the
              moment we try to measure them) - visibility is toggled purely
              via the "visible" class, never by mounting/unmounting. */}
          <div
            className="custom-scrollbar-track"
            ref={trackRef}
            onMouseDown={handleTrackMouseDown}
          >
            <div
              className="custom-scrollbar-thumb"
              ref={thumbRef}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
            />
          </div>
        </div>

        {/* Toggle button - fixed */}
        <button type="button" className="btn btn-link sidebar-mini-btn text-light" onClick={toggleSidebar}>
          <span className="ms-2">
            <i className="icofont-bubble-right" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
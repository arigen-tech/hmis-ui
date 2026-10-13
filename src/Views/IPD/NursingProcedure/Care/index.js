import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getRequest, postRequest } from '../../../../service/apiService';
import {
  GET_PROCEDURE_BY_INPATIENT_ID,
  MAS_PROCEDURES_GET_ALL,
  GET_CURRENT_USER_PROFILE_BY_NAME,
  SAVE_INPATIENT_PROCEDURE,
  GET_MEDICAL_CONSUMABLE_ITEMS,
  SAVE_PROCEDURE_CONSUMABLE_TEMPLATE,
  GET_PROCEDURE_CONSUMABLE_TEMPLATE,
  GET_PROCEDURE_CONSUMABLE_TEMPLATE_DETAILS,
  GET_ITEM_BATCHES_EXCEPT_STOCK,
  SAVE_NURSING_CARE_PROCEDURE,
  GET_NURSING_CARE_PROCEDURE
} from '../../../../config/apiConfig';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../../../../utils/dateUtils';

const createEmptyManualRow = () => ({
  rowId: Date.now() + Math.random(),
  item: '',
  itemId: null,
  qty: '',
  batch: '',
  expiry: '',
  batchStock: null,
  batchStockId: null,
  procedureRef: '',
});

const CONSUMABLES_PER_PAGE = 5;

const NursingCareModule = ({ selectedPatient }) => {
  const [activeTab, setActiveTab] = useState('procedures');

  const [procedureOptions, setProcedureOptions] = useState([]);
  const [showNewProcDropdown, setShowNewProcDropdown] = useState(false);
  const [showTemplateProcDropdown, setShowTemplateProcDropdown] = useState(false);

  const fetchProcedureOptions = async (searchText = '') => {
    try {
      const res = await getRequest(`${MAS_PROCEDURES_GET_ALL}?flag=1&page=0&size=10&nursingStatus=y&search=${searchText}`);
      if (res?.status === 200 && res?.response?.content) {
        setProcedureOptions(res.response.content);
      } else {
        setProcedureOptions([]);
      }
    } catch (error) {
      console.error("Error fetching procedure options:", error);
    }
  };

  useEffect(() => {
    fetchProcedureOptions('');
  }, []);

  const [itemOptions, setItemOptions] = useState([]);
  const [itemSearchText, setItemSearchText] = useState('');
  const [itemPage, setItemPage] = useState(0);
  const [itemHasMore, setItemHasMore] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [activeItemDropdown, setActiveItemDropdown] = useState(null);

  const [dropdownRect, setDropdownRect] = useState(null);
  const inputRefs = useRef({});

  const fetchConsumableItems = async (searchText = '', page = 0, isLoadMore = false) => {
    if (loadingItems || (!itemHasMore && isLoadMore)) return;
    setLoadingItems(true);
    try {
      const res = await getRequest(`${GET_MEDICAL_CONSUMABLE_ITEMS}?page=${page}&size=10&flag=1&itemName=${searchText}`);
      if (res?.status === 200 && res?.response?.content) {
        const newItems = res.response.content;
        setItemOptions(prev => isLoadMore ? [...prev, ...newItems] : newItems);
        setItemPage(page);
        setItemHasMore(page < (res.response.totalPages - 1) && !res.response.last);
      } else {
        if (!isLoadMore) setItemOptions([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleItemScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20;
    if (bottom && itemHasMore && !loadingItems) {
      fetchConsumableItems(itemSearchText, itemPage + 1, true);
    }
  };

  const updateDropdownRect = (dropdownId) => {
    const el = inputRefs.current[dropdownId];
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const handleItemSearchChange = (val, dropdownId) => {
    setItemSearchText(val);
    if (val && val.trim().length > 0) {
      setActiveItemDropdown(dropdownId);
      updateDropdownRect(dropdownId);
      fetchConsumableItems(val, 0, false);
    } else {
      setActiveItemDropdown(null);
      setItemOptions([]);
      setDropdownRect(null);
    }
  };

  useEffect(() => {
    if (!activeItemDropdown) return;
    const recalc = () => updateDropdownRect(activeItemDropdown);
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [activeItemDropdown]);

  const [applyTemplateOptions, setApplyTemplateOptions] = useState([]);
  const [applyTemplateSearchText, setApplyTemplateSearchText] = useState('');
  const [applyTemplatePage, setApplyTemplatePage] = useState(0);
  const [applyTemplateHasMore, setApplyTemplateHasMore] = useState(true);
  const [loadingApplyTemplates, setLoadingApplyTemplates] = useState(false);
  const [showApplyTemplateDropdown, setShowApplyTemplateDropdown] = useState(false);

  const fetchApplyTemplateOptions = async (searchText = '', page = 0, isLoadMore = false) => {
    if (loadingApplyTemplates || (!applyTemplateHasMore && isLoadMore)) return;
    setLoadingApplyTemplates(true);
    try {
      const res = await getRequest(`${GET_PROCEDURE_CONSUMABLE_TEMPLATE}?search=${searchText}&page=${page}&size=10`);
      if (res?.status === 200 && res?.response?.content) {
        const newItems = res.response.content;
        setApplyTemplateOptions(prev => isLoadMore ? [...prev, ...newItems] : newItems);
        setApplyTemplatePage(page);
        setApplyTemplateHasMore(page < (res.response.totalPages - 1) && !res.response.last);
      } else {
        if (!isLoadMore) setApplyTemplateOptions([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoadingApplyTemplates(false);
    }
  };

  const handleApplyTemplateScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20;
    if (bottom && applyTemplateHasMore && !loadingApplyTemplates) {
      fetchApplyTemplateOptions(applyTemplateSearchText, applyTemplatePage + 1, true);
    }
  };

  const handleApplyTemplateSearchChange = (val) => {
    setApplyTemplateSearchText(val);
    setShowApplyTemplateDropdown(true);
    fetchApplyTemplateOptions(val, 0, false);
  };

  const renderItemDropdown = (dropdownId, onSelect) => {
    if (activeItemDropdown !== dropdownId || !dropdownRect) return null;

    return createPortal(
      <ul
        className="list-group position-fixed shadow"
        style={{
          zIndex: 9999,
          maxHeight: "200px",
          overflowY: "auto",
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
        }}
        onScroll={handleItemScroll}
      >
        {itemOptions.map((opt, idx) => (
          <li
            key={idx}
            className="list-group-item list-group-item-action py-1"
            style={{ cursor: "pointer", fontSize: "0.8rem" }}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(opt);
              setActiveItemDropdown(null);
              setDropdownRect(null);
            }}
          >
            {opt.nomenclature}
          </li>
        ))}
        {loadingItems && <li className="list-group-item py-1 text-center" style={{ fontSize: "0.8rem" }}>Loading...</li>}
        {!loadingItems && itemOptions.length === 0 && <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "0.8rem" }}>No items found</li>}
      </ul>,
      document.body
    );
  };

  const [procedures, setProcedures] = useState([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);

  useEffect(() => {
    if (selectedPatient?.inpatientId) {
      fetchProcedures(selectedPatient.inpatientId);
    }
  }, [selectedPatient]);

  const fetchProcedures = async (inpatientId) => {
    setLoadingProcedures(true);
    try {
      const res = await getRequest(`${GET_PROCEDURE_BY_INPATIENT_ID}/${inpatientId}`);
      if (res?.status === 200 && res?.response) {
        const proceduresData = Array.isArray(res.response) ? res.response : (res.response.content || []);
        const mappedProcedures = proceduresData.map(p => ({
          id: p.inpatientProcedureId || p.procedureTxnId || p.id || p.procedureId,
          procedure: p.procedureName || p.procedure?.procedureName || p.procedure,
          dateTime: p.procedureDatetime || p.createdDate || p.date,
          performedBy: p.performedBy || p.createdBy,
          remarks: p.remarks ? p.remarks : '—',
          remarkText: p.remarks || '',
        }));
        setProcedures(mappedProcedures);
      } else {
        setProcedures([]);
      }
    } catch (error) {
      console.error("Error fetching procedures:", error);
      setProcedures([]);
    } finally {
      setLoadingProcedures(false);
    }
  };

  const [consumables, setConsumables] = useState([]);
  const [loadingConsumables, setLoadingConsumables] = useState(false);
  const [consumablesPage, setConsumablesPage] = useState(1);

  const fetchConsumables = async (inpatientId) => {
    setLoadingConsumables(true);
    try {
      const res = await getRequest(`${GET_NURSING_CARE_PROCEDURE}/${inpatientId}`);
      if (res?.status === 200 && res?.response) {
        const consumablesData = Array.isArray(res.response) ? res.response : [];
        // ⬇️ KEY FIX — make every id unique using idx + a random suffix
        const mappedConsumables = consumablesData.map((c, idx) => ({
          id: `con-${c.procedureTxnId ?? 'na'}-${c.itemId ?? 'na'}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
          item: c.itemName,
          itemId: c.itemId,
          qty: c.qty || c.requestQty,
          procedureRef: c.procedureTxnId,
          procedureName: c.procedureName,
          dateTime: c.dateTime,
          usedBy: c.usedBy || c.givenBy,
          batch: c.batchNo,
          expiry: c.expiryDate,
          remarks: c.remark || '—',
        }));
        setConsumables(mappedConsumables);
        setConsumablesPage(1);
      } else {
        setConsumables([]);
      }
    } catch (error) {
      console.error("Error fetching consumables:", error);
      setConsumables([]);
    } finally {
      setLoadingConsumables(false);
    }
  };

  useEffect(() => {
    if (selectedPatient?.inpatientId) {
      fetchConsumables(selectedPatient.inpatientId);
    }
  }, [selectedPatient]);

  const totalConsumablePages = Math.max(1, Math.ceil(consumables.length / CONSUMABLES_PER_PAGE));
  const paginatedConsumables = consumables.slice(
    (consumablesPage - 1) * CONSUMABLES_PER_PAGE,
    consumablesPage * CONSUMABLES_PER_PAGE
  );

  useEffect(() => {
    if (consumablesPage > totalConsumablePages) {
      setConsumablesPage(totalConsumablePages);
    }
  }, [totalConsumablePages, consumablesPage]);

  const [templates, setTemplates] = useState([
    { id: 1, name: 'IV Cannulation Template', procedureName: 'IV Cannulation', items: [{ item: 'IV Cannula', qty: 1 }, { item: 'Needle', qty: 1 }, { item: 'Fixator', qty: 1 }, { item: 'Gloves', qty: 1 }, { item: 'Syringe', qty: 1 }] },
    { id: 2, name: 'Dressing Template', procedureName: 'Dressing', items: [{ item: 'Gauze', qty: 2 }, { item: 'Gloves', qty: 1 }, { item: 'Bandage', qty: 1 }] },
    { id: 3, name: 'Foley Catheter Template', procedureName: 'Foley Catheter Insertion', items: [{ item: 'Catheter', qty: 1 }, { item: 'Lubricant', qty: 10 }, { item: 'Syringe', qty: 1 }, { item: 'Gloves', qty: 1 }] },
  ]);

  const [showAddProcedureModal, setShowAddProcedureModal] = useState(false);
  const [isSavingProcedure, setIsSavingProcedure] = useState(false);
  const [showAddConsumableModal, setShowAddConsumableModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const username = localStorage.getItem("username") || sessionStorage.getItem("username");
      if (!username) return;
      try {
        const res = await getRequest(`${GET_CURRENT_USER_PROFILE_BY_NAME}/${username}`);
        if (res && res.status === 200 && res.response) {
          const docName = res.response.firstName
            ? [res.response.firstName, res.response.middleName, res.response.lastName].filter(Boolean).join(" ")
            : (res.response.name || res.response.userName || username);
          setCurrentUserName(docName);
          setNewProcedure(prev => ({ ...prev, performedBy: docName }));
        } else {
          setCurrentUserName(username);
          setNewProcedure(prev => ({ ...prev, performedBy: username }));
        }
      } catch (error) {
        console.error("Error fetching logged-in user profile:", error);
        setCurrentUserName(username);
        setNewProcedure(prev => ({ ...prev, performedBy: username }));
      }
    };
    fetchUserData();
  }, []);

  const [newProcedure, setNewProcedure] = useState({
    procedure: '',
    procedureId: null,
    dateTime: '',
    performedBy: '',
    remarks: '',
    remarkText: '',
  });

  const [isSavingConsumables, setIsSavingConsumables] = useState(false);

  const fetchItemBatches = async (itemId, mode, rowIndex) => {
    if (!itemId) return;
    const hospitalId = sessionStorage.getItem('hospitalId');
    const departmentId = sessionStorage.getItem('departmentId');
    const setter = mode === 'template' ? setTemplateItems : setManualRows;

    try {
      const response = await getRequest(
        `${GET_ITEM_BATCHES_EXCEPT_STOCK}/${itemId}?hospitalId=${hospitalId}&departmentId=${departmentId}&minimumClosingStock=0`
      );
      const hasBatch = response && response.status === 200 && response.response;
      const batch = hasBatch ? response.response : null;
      setter(prev => {
        const updated = [...prev];
        if (updated[rowIndex]) {
          updated[rowIndex] = {
            ...updated[rowIndex],
            batch: batch?.batchName || '',
            expiry: batch?.doe || '',
            batchStock: batch?.batchStock ?? 0,
            batchStockId: batch?.stockId ?? null,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error("Error fetching batch:", error);
      setter(prev => {
        const updated = [...prev];
        if (updated[rowIndex]) {
          updated[rowIndex] = {
            ...updated[rowIndex],
            batch: '',
            expiry: '',
            batchStock: 0,
            batchStockId: null,
          };
        }
        return updated;
      });
    }
  };

  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: '',
    templateCode: '',
    procedureName: '',
    procedureId: null,
    items: [],
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateItems, setTemplateItems] = useState([]);
  const [manualRows, setManualRows] = useState(() => [createEmptyManualRow()]);

  const updateManualRow = (index, field, value) => {
    setManualRows(prev => {
      const updated = [...prev];
      if (updated[index]) updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addManualRow = () => {
    setManualRows(prev => [...prev, createEmptyManualRow()]);
  };

  const removeManualRow = (index) => {
    setManualRows(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const nowDateTimeLocal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const local = new Date(now - tzOffset);
    return local.toISOString().slice(0, 16);
  };

  const handleAddProcedure = async () => {
    const { procedure, procedureId, dateTime, performedBy, remarkText, remarks } = newProcedure;
    if (!procedure || !procedureId || !dateTime || !performedBy) {
      alert('Please fill all required fields and select a valid procedure from the list.');
      return;
    }

    const payload = {
      inpatientId: selectedPatient?.inpatientId || 0,
      procedureId: Number(procedureId) || 0,
      procedureDatetime: new Date().toISOString(),
      performedBy: performedBy,
      remarks: remarks || remarkText || ''
    };

    setIsSavingProcedure(true);
    try {
      const response = await postRequest(SAVE_INPATIENT_PROCEDURE, payload);
      if (response && response.status === 200) {
        setShowAddProcedureModal(false);
        setNewProcedure({
          procedure: '',
          procedureId: null,
          dateTime: nowDateTimeLocal(),
          performedBy: currentUserName,
          remarks: '',
          remarkText: '',
        });
        if (selectedPatient?.inpatientId) {
          fetchProcedures(selectedPatient.inpatientId);
        }
      } else {
        alert(response?.message || 'Failed to save procedure.');
      }
    } catch (error) {
      console.error("Error saving procedure:", error);
      alert('Error saving procedure.');
    } finally {
      setIsSavingProcedure(false);
    }
  };

  const resetConsumableModal = () => {
    setTemplateItems([]);
    setManualRows([createEmptyManualRow()]);
    setSelectedTemplateId('');
    setApplyTemplateSearchText('');
    setActiveItemDropdown(null);
    setDropdownRect(null);
  };

  const saveManualItems = async () => {
    const nonEmptyRows = manualRows.filter(r => r.item || r.itemId || r.qty);

    if (nonEmptyRows.length === 0) {
      alert('Add at least one row before saving.');
      return;
    }

    for (const row of nonEmptyRows) {
      if (!row.item || !row.itemId) {
        alert('Please select a valid item for each row.');
        return;
      }
      const qty = Number(row.qty);
      const stock = Number(row.batchStock ?? 0);
      if (!qty || qty <= 0) {
        alert(`Quantity for "${row.item}" must be greater than 0.`);
        return;
      }
      if (qty > stock) {
        alert(`Quantity for "${row.item}" (${qty}) exceeds available batch stock (${stock}).`);
        return;
      }
    }

    setIsSavingConsumables(true);
    try {
      const payload = nonEmptyRows.map(row => ({
        itemId: row.itemId || 0,
        inpatientId: selectedPatient?.inpatientId || 0,
        requestQty: Number(row.qty) || 0,
        batchStockId: row.batchStockId || null,
        procedureId: row.procedureRef ? Number(row.procedureRef) : null
      }));

      const response = await postRequest(SAVE_NURSING_CARE_PROCEDURE, payload);
      if (response && response.status === 200) {
        // ⬇️ Refetch from server so the list is authoritative, no local duplication
        if (selectedPatient?.inpatientId) {
          await fetchConsumables(selectedPatient.inpatientId);
        }
        setShowAddConsumableModal(false);
        resetConsumableModal();
      } else {
        alert(response?.message || 'Failed to save consumables.');
      }
    } catch (error) {
      console.error("Error saving consumables:", error);
      alert('Error saving consumables.');
    } finally {
      setIsSavingConsumables(false);
    }
  };

  const addTemplateItems = async () => {
    if (templateItems.length === 0) {
      alert('No items in template.');
      return;
    }

    for (const item of templateItems) {
      if (!item.item || !item.qty) {
        alert('Please fill Item and Quantity for all rows.');
        return;
      }
      const stock = Number(item.batchStock ?? 0);
      const qty = Number(item.qty);
      if (qty <= 0) {
        alert(`Quantity for "${item.item}" must be greater than 0.`);
        return;
      }
      if (qty > stock) {
        alert(`Quantity for "${item.item}" (${qty}) exceeds available batch stock (${stock}).`);
        return;
      }
    }

    setIsSavingConsumables(true);
    try {
      const payload = templateItems.map(item => ({
        itemId: item.itemId || 0,
        inpatientId: selectedPatient?.inpatientId || 0,
        requestQty: Number(item.qty) || 0,
        batchStockId: item.batchStockId || null,
        procedureId: item.procedureRef ? Number(item.procedureRef) : null
      }));

      const response = await postRequest(SAVE_NURSING_CARE_PROCEDURE, payload);
      if (response && response.status === 200) {
        if (selectedPatient?.inpatientId) {
          await fetchConsumables(selectedPatient.inpatientId);
        }
        setShowAddConsumableModal(false);
        resetConsumableModal();
      } else {
        alert(response?.message || 'Failed to save consumables.');
      }
    } catch (error) {
      console.error("Error saving consumables:", error);
      alert('Error saving consumables.');
    } finally {
      setIsSavingConsumables(false);
    }
  };

  const applyTemplate = async (template) => {
    if (!template || !template.templateId) return;
    try {
      const response = await getRequest(`${GET_PROCEDURE_CONSUMABLE_TEMPLATE_DETAILS}/${template.templateId}`);
      if (response && response.status === 200 && response.response) {
        const itemsData = response.response;
        const items = itemsData.map(item => ({
          item: item.itemName || '',
          itemId: item.itemId,
          qty: item.qty || 1,
          batch: '',
          expiry: '',
          batchStock: null,
          batchStockId: null,
          procedureRef: '',
        }));
        setTemplateItems(items);
        items.forEach((it, idx) => {
          if (it.itemId) fetchItemBatches(it.itemId, 'template', idx);
        });
      } else {
        console.error("Failed to fetch template details:", response);
        alert(response?.message || 'Failed to fetch template details.');
      }
    } catch (error) {
      console.error("Error fetching template details:", error);
      alert('Error fetching template details.');
    }
  };

  const updateTemplateItem = (index, field, value) => {
    setTemplateItems(prev => {
      const updated = [...prev];
      if (updated[index]) updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const openTemplateModal = (template = null) => {
    if (template) {
      setTemplateForm({
        id: template.id,
        name: template.name,
        templateCode: template.templateCode || '',
        procedureName: template.procedureName,
        procedureId: template.procedureId || null,
        items: template.items.map(it => ({ ...it })),
      });
    } else {
      setTemplateForm({
        id: null,
        name: '',
        templateCode: '',
        procedureName: '',
        procedureId: null,
        items: [{ item: '', itemId: 0, qty: 1 }],
      });
    }
    setShowTemplateModal(true);
  };

  const addTemplateItemRow = () => {
    setTemplateForm({
      ...templateForm,
      items: [...templateForm.items, { item: '', itemId: 0, qty: 1 }],
    });
  };

  const updateTemplateItemForm = (index, field, value) => {
    const updatedItems = [...templateForm.items];
    updatedItems[index][field] = value;
    setTemplateForm({ ...templateForm, items: updatedItems });
  };

  const removeTemplateItemRow = (index) => {
    if (templateForm.items.length === 1) {
      alert('Template must have at least one item.');
      return;
    }
    const updatedItems = templateForm.items.filter((_, i) => i !== index);
    setTemplateForm({ ...templateForm, items: updatedItems });
  };

  const saveTemplate = async () => {
    const { name, procedureName, items, templateCode, procedureId } = templateForm;
    if (!name || !templateCode || !procedureName || items.length === 0) {
      alert('Please fill Template Name, Template Code, Procedure Name, and at least one item.');
      return;
    }
    if (items.some(it => !it.item || !it.qty)) {
      alert('Please fill item name and quantity for all rows.');
      return;
    }
    const payload = {
      procedureId: procedureId || 0,
      templateCode: templateCode,
      templateName: name,
      details: items.map(it => ({
        itemId: it.itemId || 0,
        defaultQty: parseFloat(it.qty) || 0
      }))
    };

    try {
      const response = await postRequest(SAVE_PROCEDURE_CONSUMABLE_TEMPLATE, payload);
      if (response && response.status === 200) {
        const newTemplate = {
          id: templateForm.id || Date.now(),
          name,
          templateCode,
          procedureName,
          procedureId,
          items: items.map(it => ({ item: it.item, itemId: it.itemId, qty: parseInt(it.qty) })),
        };
        if (templateForm.id) {
          setTemplates(templates.map(t => t.id === templateForm.id ? newTemplate : t));
        } else {
          setTemplates([...templates, newTemplate]);
        }
        setShowTemplateModal(false);
      } else {
        alert(response?.message || 'Failed to save template.');
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert('Error saving template.');
    }
  };

  const sideModalOverlayStyle = {
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1040,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: '9rem',
  };

  const sideModalContentStyle = {
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const sideModalBodyStyle = {
    overflowY: 'auto',
  };

  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        <button className={`btn btn-sm ${activeTab === 'procedures' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('procedures')} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>Procedures</button>
        <button className={`btn btn-sm ${activeTab === 'consumables' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('consumables')} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>Consumables</button>
      </div>

      {activeTab === 'procedures' && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <strong>Procedure List</strong>
            <button className="btn btn-sm btn-light" onClick={() => {
              setNewProcedure({ ...newProcedure, dateTime: nowDateTimeLocal() });
              setShowAddProcedureModal(true);
            }}>+ Add Procedure</button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Procedure</th>
                    <th>Date/Time</th>
                    <th>Performed By</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingProcedures ? (
                    <tr><td colSpan="5" className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                      <span className="ms-2">Loading procedures...</span>
                    </td></tr>
                  ) : procedures.length > 0 ? (
                    procedures.map(proc => (
                      <tr key={proc.id}>
                        <td>{proc.id}</td><td>{proc.procedure}</td>
                        <td>{formatDateTimeForDisplay(proc.dateTime)}</td>
                        <td>{proc.performedBy}</td>
                        <td>{proc.remarks !== '—' ? (<span title={proc.remarkText || 'No remark'} style={{ cursor: 'help' }}>{proc.remarks}</span>) : ('—')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center">No procedures recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'consumables' && (
        <div className="card shadow-sm">
          <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <strong>Consumable List</strong>
            <button className="btn btn-sm btn-light" onClick={() => {
              setTemplateItems([]);
              setManualRows([createEmptyManualRow()]);
              setSelectedTemplateId('');
              setShowAddConsumableModal(true);
            }}>+ Add Consumable</button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Procedure Reference</th>
                    <th>Date & Time</th>
                    <th>Used By</th>
                    <th>Batch No</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingConsumables ? (
                    <tr><td colSpan="7" className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                      <span className="ms-2">Loading consumables...</span>
                    </td></tr>
                  ) : consumables.length > 0 ? (
                    // ⬇️ KEY FIX — composite key (`cons.id` + idx) prevents React duplication
                    paginatedConsumables.map((cons, idx) => {
                      const proc = procedures.find(p => p.id == cons.procedureRef);
                      const refText = proc ? `${proc.procedure} (${new Date(proc.dateTime).toLocaleDateString()})` : (cons.procedureName || '—');
                      return (
                        <tr key={`row-${idx}-${cons.id}`}>
                          <td>{cons.item}</td>
                          <td>{cons.qty}</td>
                          <td>{refText}</td>
                          <td>{formatDateTimeForDisplay(cons.dateTime)}</td>
                          <td>{cons.usedBy}</td>
                          <td>{cons.batch}</td>
                          <td>{formatDateForDisplay(cons.expiry)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="7" className="text-center">No consumables recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {consumables.length > 0 && (
              <div className="d-flex justify-content-between align-items-center px-3 py-2">
                <small className="text-muted">
                  Showing {((consumablesPage - 1) * CONSUMABLES_PER_PAGE) + 1}–
                  {Math.min(consumablesPage * CONSUMABLES_PER_PAGE, consumables.length)} of {consumables.length}
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${consumablesPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setConsumablesPage(p => Math.max(1, p - 1))} disabled={consumablesPage === 1}>Previous</button>
                    </li>
                    {Array.from({ length: totalConsumablePages }, (_, i) => i + 1).map(pageNum => (
                      <li key={pageNum} className={`page-item ${consumablesPage === pageNum ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setConsumablesPage(pageNum)}>{pageNum}</button>
                      </li>
                    ))}
                    <li className={`page-item ${consumablesPage === totalConsumablePages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setConsumablesPage(p => Math.min(totalConsumablePages, p + 1))} disabled={consumablesPage === totalConsumablePages}>Next</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddProcedureModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Add New Procedure</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddProcedureModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2 position-relative">
                  <label className="form-label small">Procedure Name *</label>
                  <input type="text" className="form-control form-control-sm" value={newProcedure.procedure}
                    onChange={e => { const val = e.target.value; setNewProcedure({ ...newProcedure, procedure: val }); fetchProcedureOptions(val); setShowNewProcDropdown(true); }}
                    onFocus={() => setShowNewProcDropdown(true)}
                    onBlur={() => setShowNewProcDropdown(false)}
                    placeholder="Type to search" />
                  {showNewProcDropdown && procedureOptions.length > 0 && (
                    <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", top: "100%" }}>
                      {procedureOptions.map((opt, idx) => (
                        <li key={idx} className="list-group-item list-group-item-action py-1" style={{ cursor: "pointer", fontSize: "0.8rem" }}
                          onMouseDown={(e) => { e.preventDefault(); setNewProcedure({ ...newProcedure, procedure: opt.procedureName, procedureId: opt.procedureId }); setShowNewProcDropdown(false); }}>
                          {opt.procedureName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mb-2">
                  <label className="form-label small">Date & Time *</label>
                  <input type="text" className="form-control form-control-sm" value={formatDateTimeForDisplay(newProcedure.dateTime)} disabled />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Performed By *</label>
                  <input type="text" className="form-control form-control-sm" value={newProcedure.performedBy}
                    onChange={e => setNewProcedure({ ...newProcedure, performedBy: e.target.value })} placeholder="Nurse name" />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Remarks (optional)</label>
                  <input type="text" className="form-control form-control-sm" value={newProcedure.remarks}
                    onChange={e => setNewProcedure({ ...newProcedure, remarks: e.target.value })} placeholder="Any notes" />
                  <small className="text-muted">Will show as key icon if filled.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddProcedureModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddProcedure} disabled={isSavingProcedure}>
                  {isSavingProcedure ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddConsumableModal && (
        <div className="modal show d-block" tabIndex="-1" style={sideModalOverlayStyle}>
          <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '900px' }}>
            <div className="modal-content" style={sideModalContentStyle}>
              <div className="modal-header bg-secondary text-white">
                <h5 className="modal-title">New Consumable Entry</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowAddConsumableModal(false); resetConsumableModal(); }}></button>
              </div>
              <div className="modal-body" style={sideModalBodyStyle}>
                <div className="row g-2 mb-3">
                  <div className="col-md-6 position-relative">
                    <label className="form-label small">Apply Template (optional)</label>
                    <input type="text" className="form-control form-control-sm" value={applyTemplateSearchText}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleApplyTemplateSearchChange(val);
                        if (!val || val.trim().length === 0) { setSelectedTemplateId(''); setTemplateItems([]); }
                      }}
                      onFocus={() => { setShowApplyTemplateDropdown(true); fetchApplyTemplateOptions(applyTemplateSearchText, 0, false); }}
                      onBlur={() => setShowApplyTemplateDropdown(false)}
                      placeholder="Type to search template" />
                    {showApplyTemplateDropdown && (
                      <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 2000, maxHeight: "200px", overflowY: "auto", top: "100%" }} onScroll={handleApplyTemplateScroll}>
                        {applyTemplateOptions.map((opt, idx) => (
                          <li key={idx} className="list-group-item list-group-item-action py-1" style={{ cursor: "pointer", fontSize: "0.8rem" }}
                            onMouseDown={(e) => { e.preventDefault(); setSelectedTemplateId(opt.templateId); setApplyTemplateSearchText(opt.templateName); setShowApplyTemplateDropdown(false); applyTemplate(opt); }}>
                            {opt.templateName}
                          </li>
                        ))}
                        {loadingApplyTemplates && <li className="list-group-item py-1 text-center" style={{ fontSize: "0.8rem" }}>Loading...</li>}
                        {!loadingApplyTemplates && applyTemplateOptions.length === 0 && <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "0.8rem" }}>No templates found</li>}
                      </ul>
                    )}
                  </div>
                  <div className="col-md-6 d-flex align-items-end gap-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => openTemplateModal(null)}>Manage Templates</button>
                    <button className="btn btn-outline-secondary btn-sm" style={{ border: '1px solid #6c757d' }} onClick={resetConsumableModal}>Reset</button>
                  </div>
                </div>

                {templateItems.length > 0 ? (
                  <div>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th style={{ minWidth: '280px' }}>Item *</th>
                            <th style={{ minWidth: '90px', width: '90px' }}>Qty *</th>
                            <th style={{ minWidth: '200px' }}>Batch *</th>
                            <th style={{ minWidth: '120px' }}>Expiry</th>
                            <th style={{ minWidth: '110px' }}>Batch Stock</th>
                            <th style={{ minWidth: '220px' }}>Procedure Ref</th>
                          </tr>
                        </thead>
                        <tbody>
                          {templateItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="position-relative">
                                <input type="text" className="form-control form-control-sm"
                                  ref={(el) => (inputRefs.current[`templateItem-${idx}`] = el)}
                                  value={item.item}
                                  onChange={(e) => { updateTemplateItem(idx, 'item', e.target.value); handleItemSearchChange(e.target.value, `templateItem-${idx}`); }}
                                  onFocus={() => { updateDropdownRect(`templateItem-${idx}`); handleItemSearchChange(item.item, `templateItem-${idx}`); }}
                                  onBlur={() => { setTimeout(() => setActiveItemDropdown(null), 150); }}
                                  placeholder="Type to search" />
                                {renderItemDropdown(`templateItem-${idx}`, (opt) => {
                                  updateTemplateItem(idx, 'item', opt.nomenclature);
                                  updateTemplateItem(idx, 'itemId', opt.itemId);
                                  updateTemplateItem(idx, 'batch', '');
                                  updateTemplateItem(idx, 'expiry', '');
                                  updateTemplateItem(idx, 'batchStock', null);
                                  updateTemplateItem(idx, 'batchStockId', null);
                                  fetchItemBatches(opt.itemId, 'template', idx);
                                })}
                              </td>
                              <td style={{ minWidth: '90px' }}>
                                <input type="text" inputMode="numeric" pattern="[0-9]*" className="form-control form-control-sm text-center"
                                  value={item.qty ?? ''}
                                  onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); updateTemplateItem(idx, 'qty', d === '' ? '' : parseInt(d, 10)); }}
                                  placeholder="0" />
                              </td>
                              <td style={{ minWidth: '200px' }}><input type="text" className="form-control form-control-sm" value={item.batch || ''} readOnly placeholder="N/A" /></td>
                              <td style={{ minWidth: '120px' }}><input type="text" className="form-control form-control-sm" value={item.expiry || ''} readOnly placeholder="N/A" /></td>
                              <td style={{ minWidth: '110px' }}><input type="text" className="form-control form-control-sm text-center" value={item.batchStock != null ? item.batchStock : ''} readOnly placeholder="N/A" /></td>
                              <td style={{ minWidth: '220px' }}>
                                <select className="form-select form-select-sm" value={item.procedureRef} onChange={(e) => updateTemplateItem(idx, 'procedureRef', e.target.value)}>
                                  <option value="">— None —</option>
                                  {procedures.map(p => (<option key={p.id} value={p.id}>{p.procedure} ({new Date(p.dateTime).toLocaleDateString()})</option>))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button className="btn btn-success btn-sm" onClick={addTemplateItems} disabled={isSavingConsumables}>
                        {isSavingConsumables ? 'Saving...' : `Save All (${templateItems.length} items)`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={addManualRow}>+ Add Row</button>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle">
                        <thead className="table-light">
                          <tr>
                            <th style={{ minWidth: '280px' }}>Item *</th>
                            <th style={{ minWidth: '90px', width: '90px' }}>Qty *</th>
                            <th style={{ minWidth: '200px' }}>Batch *</th>
                            <th style={{ minWidth: '120px' }}>Expiry</th>
                            <th style={{ minWidth: '110px' }}>Batch Stock</th>
                            <th style={{ minWidth: '220px' }}>Procedure Ref</th>
                            <th style={{ width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualRows.map((row, idx) => (
                            <tr key={row.rowId}>
                              <td className="position-relative">
                                <input type="text" className="form-control form-control-sm"
                                  ref={(el) => (inputRefs.current[`manualRow-${idx}`] = el)}
                                  value={row.item}
                                  onChange={(e) => { updateManualRow(idx, 'item', e.target.value); handleItemSearchChange(e.target.value, `manualRow-${idx}`); }}
                                  onFocus={() => { updateDropdownRect(`manualRow-${idx}`); handleItemSearchChange(row.item, `manualRow-${idx}`); }}
                                  onBlur={() => { setTimeout(() => setActiveItemDropdown(null), 150); }}
                                  placeholder="Type to search" />
                                {renderItemDropdown(`manualRow-${idx}`, (opt) => {
                                  updateManualRow(idx, 'item', opt.nomenclature);
                                  updateManualRow(idx, 'itemId', opt.itemId);
                                  updateManualRow(idx, 'batch', '');
                                  updateManualRow(idx, 'expiry', '');
                                  updateManualRow(idx, 'batchStock', null);
                                  updateManualRow(idx, 'batchStockId', null);
                                  fetchItemBatches(opt.itemId, 'manual', idx);
                                })}
                              </td>
                              <td style={{ minWidth: '90px' }}>
                                <input type="text" inputMode="numeric" pattern="[0-9]*" className="form-control form-control-sm text-center"
                                  value={row.qty ?? ''}
                                  onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); updateManualRow(idx, 'qty', d === '' ? '' : parseInt(d, 10)); }}
                                  placeholder="0" />
                              </td>
                              <td style={{ minWidth: '200px' }}><input type="text" className="form-control form-control-sm" value={row.batch || ''} readOnly placeholder="N/A" /></td>
                              <td style={{ minWidth: '120px' }}><input type="text" className="form-control form-control-sm" value={row.expiry || ''} readOnly placeholder="N/A" /></td>
                              <td style={{ minWidth: '110px' }}><input type="text" className="form-control form-control-sm text-center" value={row.batchStock != null ? row.batchStock : ''} readOnly placeholder="N/A" /></td>
                              <td style={{ minWidth: '220px' }}>
                                <select className="form-select form-select-sm" value={row.procedureRef} onChange={(e) => updateManualRow(idx, 'procedureRef', e.target.value)}>
                                  <option value="">— None —</option>
                                  {procedures.map(p => (<option key={p.id} value={p.id}>{p.procedure} ({new Date(p.dateTime).toLocaleDateString()})</option>))}
                                </select>
                              </td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-danger" onClick={() => removeManualRow(idx)}
                                  disabled={manualRows.length === 1}
                                  title={manualRows.length === 1 ? 'At least one row is required' : 'Remove row'}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                      <button className="btn btn-success btn-sm" onClick={saveManualItems} disabled={isSavingConsumables}>
                        {isSavingConsumables ? 'Saving...' : `Save All (${manualRows.filter(r => r.item || r.itemId).length} items)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowAddConsumableModal(false); resetConsumableModal(); }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ ...sideModalOverlayStyle, zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={sideModalContentStyle}>
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">{templateForm.id ? 'Edit Template' : 'New Template'}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTemplateModal(false)}></button>
              </div>
              <div className="modal-body" style={sideModalBodyStyle}>
                <div className="row g-2 mb-3">
                  <div className="col-md-4">
                    <label className="form-label small">Template Code *</label>
                    <input type="text" className="form-control form-control-sm" value={templateForm.templateCode} onChange={(e) => setTemplateForm({ ...templateForm, templateCode: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Template Name *</label>
                    <input type="text" className="form-control form-control-sm" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
                  </div>
                  <div className="col-md-4 position-relative">
                    <label className="form-label small">Procedure Name *</label>
                    <input type="text" className="form-control form-control-sm" value={templateForm.procedureName}
                      onChange={(e) => { const val = e.target.value; setTemplateForm({ ...templateForm, procedureName: val }); fetchProcedureOptions(val); setShowTemplateProcDropdown(true); }}
                      onFocus={() => setShowTemplateProcDropdown(true)}
                      onBlur={() => setShowTemplateProcDropdown(false)} />
                    {showTemplateProcDropdown && procedureOptions.length > 0 && (
                      <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", top: "100%" }}>
                        {procedureOptions.map((opt, idx) => (
                          <li key={idx} className="list-group-item list-group-item-action py-1" style={{ cursor: "pointer", fontSize: "0.8rem" }}
                            onMouseDown={(e) => { e.preventDefault(); setTemplateForm({ ...templateForm, procedureName: opt.procedureName, procedureId: opt.procedureId }); setShowTemplateProcDropdown(false); }}>
                            {opt.procedureName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Item *</th>
                        <th>Quantity *</th>
                        <th style={{ width: '40px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templateForm.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="position-relative">
                            <input type="text" className="form-control form-control-sm"
                              ref={(el) => (inputRefs.current[`templateForm-${idx}`] = el)}
                              value={item.item}
                              onChange={(e) => { updateTemplateItemForm(idx, 'item', e.target.value); handleItemSearchChange(e.target.value, `templateForm-${idx}`); }}
                              onFocus={() => { updateDropdownRect(`templateForm-${idx}`); handleItemSearchChange(item.item, `templateForm-${idx}`); }}
                              onBlur={() => { setTimeout(() => setActiveItemDropdown(null), 150); }}
                              placeholder="Type to search" />
                            {renderItemDropdown(`templateForm-${idx}`, (opt) => { updateTemplateItemForm(idx, 'item', opt.nomenclature); updateTemplateItemForm(idx, 'itemId', opt.itemId); })}
                          </td>
                          <td>
                            <input type="text" inputMode="numeric" pattern="[0-9]*" className="form-control form-control-sm"
                              value={item.qty ?? ''}
                              onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); updateTemplateItemForm(idx, 'qty', d === '' ? '' : parseInt(d, 10)); }}
                              placeholder="0" />
                          </td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeTemplateItemRow(idx)}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={addTemplateItemRow}>+ Add Item</button>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveTemplate}>Save Template</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursingCareModule;
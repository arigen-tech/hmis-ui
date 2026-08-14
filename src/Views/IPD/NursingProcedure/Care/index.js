import React, { useState, useEffect } from 'react';
import { getRequest, postRequest } from '../../../../service/apiService';
import { GET_PROCEDURE_BY_INPATIENT_ID, MAS_PROCEDURES_GET_ALL, GET_CURRENT_USER_PROFILE_BY_NAME, SAVE_INPATIENT_PROCEDURE, GET_MEDICAL_CONSUMABLE_ITEMS, SAVE_PROCEDURE_CONSUMABLE_TEMPLATE, GET_PROCEDURE_CONSUMABLE_TEMPLATE, GET_PROCEDURE_CONSUMABLE_TEMPLATE_DETAILS, GET_ITEM_BATCHES, SAVE_NURSING_CARE_PROCEDURE, GET_NURSING_CARE_PROCEDURE } from '../../../../config/apiConfig';

const NursingCareModule = ({ selectedPatient }) => {
  // ---------- Tab State ----------
  const [activeTab, setActiveTab] = useState('procedures'); // "procedures" | "consumables"

  // ---------- Sample Data ----------
  // Available procedure names for auto‑complete
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

  // ---------- API Data States ----------
  const [itemOptions, setItemOptions] = useState([]);
  const [itemSearchText, setItemSearchText] = useState('');
  const [itemPage, setItemPage] = useState(0);
  const [itemHasMore, setItemHasMore] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [activeItemDropdown, setActiveItemDropdown] = useState(null);

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

  const handleItemSearchChange = (val, dropdownId) => {
    setItemSearchText(val);
    if (val && val.trim().length > 0) {
      setActiveItemDropdown(dropdownId);
      fetchConsumableItems(val, 0, false);
    } else {
      setActiveItemDropdown(null);
      setItemOptions([]);
    }
  };

  // ---------- Apply Template Search API States ----------
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

  const renderItemDropdown = (dropdownId, onSelect) => (
    activeItemDropdown === dropdownId && (
      <ul
        className="list-group position-absolute w-100 shadow"
        style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", top: "100%" }}
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
            }}
          >
            {opt.nomenclature}
          </li>
        ))}
        {loadingItems && <li className="list-group-item py-1 text-center" style={{ fontSize: "0.8rem" }}>Loading...</li>}
        {!loadingItems && itemOptions.length === 0 && <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "0.8rem" }}>No items found</li>}
      </ul>
    )
  );

  // Batch data (simulating FIFO)
  const batchData = {
    'IV Cannula': [
      { batch: '3053632', expiry: '2026-02-28' },
      { batch: '3053633', expiry: '2026-04-15' },
    ],
    'Needle': [
      { batch: '23023626', expiry: '2028-03-22' },
      { batch: '23023627', expiry: '2028-05-10' },
    ],
    'Fixator': [
      { batch: '239005', expiry: '2026-04-30' },
    ],
    'Gauze': [
      { batch: '621023', expiry: '2027-01-15' },
      { batch: '621024', expiry: '2027-03-20' },
    ],
    'Gloves': [
      { batch: 'GL5566', expiry: '2026-12-10' },
      { batch: 'GL5567', expiry: '2027-02-01' },
    ],
    // add more as needed
  };

  // ---------- Procedures State ----------
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

  // ---------- Consumables State ----------
  const [consumables, setConsumables] = useState([]);
  const [loadingConsumables, setLoadingConsumables] = useState(false);

  const fetchConsumables = async (inpatientId) => {
    setLoadingConsumables(true);
    try {
      const res = await getRequest(`${GET_NURSING_CARE_PROCEDURE}/${inpatientId}`);
      if (res?.status === 200 && res?.response) {
        const consumablesData = Array.isArray(res.response) ? res.response : [];
        const mappedConsumables = consumablesData.map(c => ({
          id: c.procedureTxnId || Date.now() + Math.random(),
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

  // ---------- Templates State ----------
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'IV Cannulation Template',
      procedureName: 'IV Cannulation',
      items: [
        { item: 'IV Cannula', qty: 1 },
        { item: 'Needle', qty: 1 },
        { item: 'Fixator', qty: 1 },
        { item: 'Gloves', qty: 1 },
        { item: 'Syringe', qty: 1 },
      ],
    },
    {
      id: 2,
      name: 'Dressing Template',
      procedureName: 'Dressing',
      items: [
        { item: 'Gauze', qty: 2 },
        { item: 'Gloves', qty: 1 },
        { item: 'Bandage', qty: 1 },
      ],
    },
    {
      id: 3,
      name: 'Foley Catheter Template',
      procedureName: 'Foley Catheter Insertion',
      items: [
        { item: 'Catheter', qty: 1 },
        { item: 'Lubricant', qty: 10 },
        { item: 'Syringe', qty: 1 },
        { item: 'Gloves', qty: 1 },
      ],
    },
  ]);

  // ---------- UI State for Modals ----------
  const [showAddProcedureModal, setShowAddProcedureModal] = useState(false);
  const [isSavingProcedure, setIsSavingProcedure] = useState(false);
  const [showAddConsumableModal, setShowAddConsumableModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showRemarkTooltip, setShowRemarkTooltip] = useState(false); // not used, we'll use title attr

  // New Procedure form
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

  // Empty shape for the single-row builder used in the "no template" flow.
  const emptyConsumableForm = {
    item: '',
    itemId: null,
    uom: '',
    batch: '',
    expiry: '',
    qty: '',
    usedBy: '',
    dateTime: '',
    procedureRef: '',
    remarks: '',
  };

  const [fetchedBatches, setFetchedBatches] = useState({});
  const [loadingBatches, setLoadingBatches] = useState({});
  const [isSavingConsumables, setIsSavingConsumables] = useState(false);

  const fetchItemBatches = async (itemId, isTemplateRow = false, templateRowIndex = -1) => {
    if (!itemId || fetchedBatches[itemId] || loadingBatches[itemId]) return;
    setLoadingBatches(prev => ({ ...prev, [itemId]: true }));
    const hospitalId = sessionStorage.getItem('hospitalId') || localStorage.getItem('hospitalId') || 12;
    const departmentId = sessionStorage.getItem('departmentId') || localStorage.getItem('departmentId') || 49;
    try {
      const response = await getRequest(`${GET_ITEM_BATCHES}/${itemId}?hospitalId=${hospitalId}&departmentId=${departmentId}`);
      if (response && response.status === 200 && response.response) {
        const batches = response.response;
        setFetchedBatches(prev => ({ ...prev, [itemId]: batches }));
        if (batches.length > 0) {
          const first = batches[0];
          if (isTemplateRow && templateRowIndex >= 0) {
            setTemplateItems(prev => {
              const updated = [...prev];
              if (updated[templateRowIndex] && updated[templateRowIndex].itemId === itemId && !updated[templateRowIndex].batch) {
                updated[templateRowIndex].batch = first.batchName;
                updated[templateRowIndex].expiry = first.doe;
              }
              return updated;
            });
          } else if (!isTemplateRow) {
            setNewConsumable(prev => {
              if (prev.itemId === itemId && !prev.batch) {
                return { ...prev, batch: first.batchName, expiry: first.doe };
              }
              return prev;
            });
          }
        }
      } else {
        setFetchedBatches(prev => ({ ...prev, [itemId]: [] }));
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setFetchedBatches(prev => ({ ...prev, [itemId]: [] }));
    } finally {
      setLoadingBatches(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // New Consumable form (used both for the single-row builder and as the
  // staging area before a row gets pushed into `manualItems`)
  const [newConsumable, setNewConsumable] = useState({ ...emptyConsumableForm });

  // Template form for creating/editing
  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: '',
    templateCode: '',
    procedureName: '',
    procedureId: null,
    items: [], // array of {item, qty}
  });

  // For applying template: when user selects a template in consumable form, we fill items
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  // We'll store the items from template in a separate list in the consumable form
  // Instead, we'll directly populate the consumable list when applying template? But requirement: "Users should be able to create templates for procedures" and "apply template to auto-fill consumable entry form".
  // We'll implement: In new consumable modal, there is a dropdown to select a template. When selected, it will generate a list of consumable entries (one for each item in template). We'll then allow user to edit quantities and other fields for each item.
  // So we need a dynamic list of consumable entries inside the modal.
  const [templateItems, setTemplateItems] = useState([]); // array of {item, qty, batch, expiry, usedBy, dateTime, procedureRef, remarks} for each line

  // When NO template is selected, the user can still add several consumable
  // rows before finally saving. Each "+ Add Row" click pushes the current
  // `newConsumable` form into this list, which is rendered as a table below
  // the form (mirroring the template table) so the user can review/remove
  // rows before committing everything with "Save All". Clicking a row in
  // that table pulls it back out of the list and into the form so the user
  // can edit it, then "+ Add Row" puts it back in.
  const [manualItems, setManualItems] = useState([]);

  // Helper: get current datetime-local string
  const nowDateTimeLocal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const local = new Date(now - tzOffset);
    return local.toISOString().slice(0, 16);
  };

  // Helper: get default usedBy (simulate login user)
  const defaultUsedBy = currentUserName || 'Nurse A';

  // ---------- Handlers: Procedures ----------
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

  // ---------- Handlers: Consumables ----------


  // When batch is selected, auto-fill expiry
  const handleBatchChange = (batch, itemId) => {
    const batches = fetchedBatches[itemId] || [];
    const found = batches.find(b => b.batchName === batch);
    setNewConsumable({
      ...newConsumable,
      batch,
      expiry: found ? found.doe : '',
    });
  };

  // Reset the whole "Add Consumable" modal back to its default state
  const resetConsumableModal = () => {
    setNewConsumable({ ...emptyConsumableForm });
    setTemplateItems([]);
    setManualItems([]);
    setSelectedTemplateId('');
    setApplyTemplateSearchText('');
  };

  // Push the current single-entry form into the `manualItems` staging list
  // so the user can build up multiple rows without a template. No validation
  // here — whatever is currently in the form (even if partially empty) gets
  // added as a row, and the form is fully cleared afterwards.
  const addManualRow = () => {
    const { item, itemId, qty, batch, expiry, uom, usedBy, dateTime, procedureRef, remarks } = newConsumable;
    const row = {
      rowId: Date.now() + Math.random(),
      item,
      itemId,
      qty,
      batch,
      expiry,
      uom,
      usedBy,
      dateTime,
      procedureRef: procedureRef || '',
      remarks: remarks || '',
    };
    setManualItems([...manualItems, row]);

    // Fully clear the form so the next row starts blank.
    setNewConsumable({ ...emptyConsumableForm });
  };

  // Remove a row from the manual staging list before saving
  const removeManualRow = (rowId) => {
    setManualItems(manualItems.filter(r => r.rowId !== rowId));
  };

  // Clicking a staged row pulls it back into the form for editing — remove
  // it from the table and populate the inputs with its values. The user can
  // then tweak it and click "+ Add Row" again to put it back in the list.
  const editManualRow = (row) => {
    setNewConsumable({
      item: row.item,
      itemId: row.itemId || null,
      uom: row.uom || '',
      batch: row.batch,
      expiry: row.expiry,
      qty: row.qty,
      usedBy: row.usedBy,
      dateTime: row.dateTime,
      procedureRef: row.procedureRef || '',
      remarks: row.remarks || '',
    });
    removeManualRow(row.rowId);
  };

  // Commit every row in `manualItems` to the real consumables list
  const saveManualItems = async () => {
    if (manualItems.length === 0) {
      alert('Add at least one row before saving.');
      return;
    }
    setIsSavingConsumables(true);
    try {
      const payload = manualItems.map(row => ({
        itemId: row.itemId || 0,
        dateTime: new Date().toISOString(),
        requestQty: Number(row.qty) || 0,
        batchNo: row.batch || '',
        expiryDate: row.expiry ? new Date(row.expiry).toISOString().split('T')[0] : '',
        givenBy: row.usedBy || '',
        remark: row.remarks || '',
        procedureId: row.procedureRef ? Number(row.procedureRef) : null,
        inpatientId: selectedPatient?.inpatientId || 0
      }));

      const response = await postRequest(SAVE_NURSING_CARE_PROCEDURE, payload);
      if (response && response.status === 200) {
        const newEntries = manualItems.map(row => ({
          id: Date.now() + Math.random(),
          item: row.item,
          qty: row.qty,
          procedureRef: row.procedureRef || null,
          dateTime: row.dateTime,
          usedBy: row.usedBy,
          batch: row.batch,
          expiry: row.expiry,
          remarks: row.remarks || '—',
        }));
        setConsumables([...consumables, ...newEntries]);
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

  // Add multiple items from template
  const addTemplateItems = async () => {
    // templateItems contains all the rows with filled fields
    if (templateItems.length === 0) {
      alert('No items in template.');
      return;
    }
    for (let item of templateItems) {
      if (!item.item || !item.qty || !item.usedBy || !item.dateTime || !item.batch) {
        alert('Please fill all required fields for each template item (Item, Quantity, Used By, Date/Time, Batch).');
        return;
      }
    }
    setIsSavingConsumables(true);
    try {
      const payload = templateItems.map(item => ({
        itemId: item.itemId || 0,
        dateTime: new Date().toISOString(),
        requestQty: Number(item.qty) || 0,
        batchNo: item.batch || '',
        expiryDate: item.expiry ? new Date(item.expiry).toISOString().split('T')[0] : '',
        givenBy: item.usedBy || '',
        remark: item.remarks || '',
        procedureId: item.procedureRef ? Number(item.procedureRef) : null,
        inpatientId: selectedPatient?.inpatientId || 0
      }));

      const response = await postRequest(SAVE_NURSING_CARE_PROCEDURE, payload);
      if (response && response.status === 200) {
        const newEntries = templateItems.map(item => ({
          id: Date.now() + Math.random(),
          item: item.item,
          qty: item.qty,
          procedureRef: item.procedureRef || null,
          dateTime: item.dateTime,
          usedBy: item.usedBy,
          batch: item.batch,
          expiry: item.expiry,
          remarks: item.remarks || '—',
        }));
        setConsumables([...consumables, ...newEntries]);
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

  // Apply template: fill templateItems array
  const applyTemplate = async (template) => {
    if (!template || !template.templateId) return;
    try {
      const response = await getRequest(`${GET_PROCEDURE_CONSUMABLE_TEMPLATE_DETAILS}/${template.templateId}`);
      if (response && response.status === 200 && response.response) {
        const itemsData = response.response;
        const items = itemsData.map((item, idx) => {
          if (item.itemId) fetchItemBatches(item.itemId, true, idx);
          return {
            item: item.itemName || '',
            itemId: item.itemId,
            qty: item.qty || 1,
            batch: '', // will be auto-selected if available
            expiry: '',
            usedBy: defaultUsedBy,
            dateTime: nowDateTimeLocal(),
            procedureRef: '', // user can choose
            remarks: '',
          };
        });
        setTemplateItems(items);
        // Selecting a template supersedes any manual rows already staged
        setManualItems([]);
      } else {
        console.error("Failed to fetch template details:", response);
        alert(response?.message || 'Failed to fetch template details.');
      }
    } catch (error) {
      console.error("Error fetching template details:", error);
      alert('Error fetching template details.');
    }
  };

  // Update a template item row
  const updateTemplateItem = (index, field, value) => {
    const updated = [...templateItems];
    updated[index][field] = value;
    // if item changes, update UOM? Not necessary for template.
    // if batch changes, update expiry
    if (field === 'batch') {
      const itemId = updated[index].itemId;
      const batches = fetchedBatches[itemId] || [];
      const found = batches.find(b => b.batchName === value);
      if (found) {
        updated[index].expiry = found.doe;
      }
    }
    setTemplateItems(updated);
  };

  // ---------- Handlers: Templates ----------
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
          // edit
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

  // ---------- Render Helper for Procedure Remarks Tooltip ----------
  // We'll use title attribute for tooltip

  // Shared style for the two "side" modals (Add Consumable / Manage Templates).
  // `overflowY: 'auto'` + a bounded `maxHeight` on the dialog is what stops
  // the bottom rows of a long table from being clipped/hidden behind the
  // page's sidebar — the modal now scrolls internally instead of overflowing
  // past the viewport.
  const sideModalOverlayStyle = {
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1040,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: '9rem', // extra gap from the right edge
  };

  const sideModalContentStyle = {
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const sideModalBodyStyle = {
    overflowY: 'auto',
  };

  // ---------- Component Return ----------
  return (
    <div>
      {/* ─── TAB TOGGLE ─── */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === 'procedures' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('procedures')}
          style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}
        >
          Procedures
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'consumables' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('consumables')}
          style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}
        >
          Consumables
        </button>
      </div>

      {/* ─── PROCEDURES TAB ─── */}
      {activeTab === 'procedures' && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <strong>Procedure List</strong>
            <button className="btn btn-sm btn-light" onClick={() => {
              setNewProcedure({ ...newProcedure, dateTime: nowDateTimeLocal() });
              setShowAddProcedureModal(true);
            }}>
              + Add Procedure
            </button>
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
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-2">Loading procedures...</span>
                      </td>
                    </tr>
                  ) : procedures.length > 0 ? (
                    procedures.map(proc => (
                      <tr key={proc.id}>
                        <td>{proc.id}</td>
                        <td>{proc.procedure}</td>
                        <td>{new Date(proc.dateTime).toLocaleString()}</td>
                        <td>{proc.performedBy}</td>
                        <td>
                          {proc.remarks !== '—' ? (
                            <span title={proc.remarkText || 'No remark'} style={{ cursor: 'help' }}>
                              {proc.remarks}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
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

      {/* ─── CONSUMABLES TAB ─── */}
      {activeTab === 'consumables' && (
        <div className="card shadow-sm">
          <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <strong>Consumable List</strong>
            <button className="btn btn-sm btn-light" onClick={() => {
              setNewConsumable({ ...emptyConsumableForm, dateTime: nowDateTimeLocal(), usedBy: defaultUsedBy });
              setTemplateItems([]);
              setManualItems([]);
              setSelectedTemplateId('');
              setShowAddConsumableModal(true);
            }}>
              + Add Consumable
            </button>
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
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingConsumables ? (
                    <tr>
                      <td colSpan="8" className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-2">Loading consumables...</span>
                      </td>
                    </tr>
                  ) : consumables.length > 0 ? (
                    consumables.map(cons => {
                      const proc = procedures.find(p => p.id == cons.procedureRef);
                      const refText = proc ? `${proc.procedure} (${new Date(proc.dateTime).toLocaleDateString()})` : (cons.procedureName || '—');
                      return (
                        <tr key={cons.id}>
                          <td>{cons.item}</td>
                          <td>{cons.qty}</td>
                          <td>{refText}</td>
                          <td>{new Date(cons.dateTime).toLocaleString()}</td>
                          <td>{cons.usedBy}</td>
                          <td>{cons.batch}</td>
                          <td>{cons.expiry}</td>
                          <td>{cons.remarks || '—'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="8" className="text-center">No consumables recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PROCEDURE MODAL ─── */}
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
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={newProcedure.procedure}
                    onChange={e => {
                      const val = e.target.value;
                      setNewProcedure({ ...newProcedure, procedure: val });
                      fetchProcedureOptions(val);
                      setShowNewProcDropdown(true);
                    }}
                    onFocus={() => setShowNewProcDropdown(true)}
                    onBlur={() => setShowNewProcDropdown(false)}
                    placeholder="Type to search"
                  />
                  {showNewProcDropdown && procedureOptions.length > 0 && (
                    <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", top: "100%" }}>
                      {procedureOptions.map((opt, idx) => (
                        <li
                          key={idx}
                          className="list-group-item list-group-item-action py-1"
                          style={{ cursor: "pointer", fontSize: "0.8rem" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setNewProcedure({ ...newProcedure, procedure: opt.procedureName, procedureId: opt.procedureId });
                            setShowNewProcDropdown(false);
                          }}
                        >
                          {opt.procedureName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mb-2">
                  <label className="form-label small">Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={newProcedure.dateTime}
                    disabled
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Performed By *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={newProcedure.performedBy}
                    onChange={e => setNewProcedure({ ...newProcedure, performedBy: e.target.value })}
                    placeholder="Nurse name"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Remarks (optional)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={newProcedure.remarks}
                    onChange={e => setNewProcedure({ ...newProcedure, remarks: e.target.value })}
                    placeholder="Any notes"
                  />
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

      {/* ─── ADD CONSUMABLE MODAL ─── */}
      {showAddConsumableModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={sideModalOverlayStyle}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '900px' }}>
            <div className="modal-content" style={sideModalContentStyle}>
              <div className="modal-header bg-secondary text-white">
                <h5 className="modal-title">New Consumable Entry</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowAddConsumableModal(false); resetConsumableModal(); }}></button>
              </div>
              <div className="modal-body" style={sideModalBodyStyle}>
                {/* Template selection */}
                <div className="row g-2 mb-3">
                  <div className="col-md-6 position-relative">
                    <label className="form-label small">Apply Template (optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={applyTemplateSearchText}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleApplyTemplateSearchChange(val);
                        if (!val || val.trim().length === 0) {
                          setSelectedTemplateId('');
                          setTemplateItems([]);
                        }
                      }}
                      onFocus={() => {
                        setShowApplyTemplateDropdown(true);
                        fetchApplyTemplateOptions(applyTemplateSearchText, 0, false);
                      }}
                      onBlur={() => setShowApplyTemplateDropdown(false)}
                      placeholder="Type to search template"
                    />
                    {showApplyTemplateDropdown && (
                      <ul 
                        className="list-group position-absolute w-100 shadow" 
                        style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", top: "100%" }}
                        onScroll={handleApplyTemplateScroll}
                      >
                        {applyTemplateOptions.map((opt, idx) => (
                          <li
                            key={idx}
                            className="list-group-item list-group-item-action py-1"
                            style={{ cursor: "pointer", fontSize: "0.8rem" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedTemplateId(opt.templateId);
                              setApplyTemplateSearchText(opt.templateName);
                              setShowApplyTemplateDropdown(false);
                              applyTemplate(opt);
                            }}
                          >
                            {opt.templateName}
                          </li>
                        ))}
                        {loadingApplyTemplates && <li className="list-group-item py-1 text-center" style={{ fontSize: "0.8rem" }}>Loading...</li>}
                        {!loadingApplyTemplates && applyTemplateOptions.length === 0 && <li className="list-group-item py-1 text-center text-muted" style={{ fontSize: "0.8rem" }}>No templates found</li>}
                      </ul>
                    )}
                  </div>
                  <div className="col-md-6 d-flex align-items-end">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => openTemplateModal(null)}>
                      Manage Templates
                    </button>
                  </div>
                </div>

                {/* If template is applied, show multiple rows */}
                {templateItems.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Item *</th>
                          <th>Qty *</th>
                          <th>Batch *</th>
                          <th>Expiry</th>
                          <th>Used By *</th>
                          <th>Date/Time *</th>
                          <th>Procedure Ref</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templateItems.map((item, idx) => {
                          return (
                            <tr key={idx}>
                              <td className="position-relative">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={item.item}
                                  onChange={(e) => {
                                    updateTemplateItem(idx, 'item', e.target.value);
                                    handleItemSearchChange(e.target.value, `templateItem-${idx}`);
                                  }}
                                  onFocus={() => {
                                    handleItemSearchChange(item.item, `templateItem-${idx}`);
                                  }}
                                  onBlur={() => setActiveItemDropdown(null)}
                                  placeholder="Type to search"
                                />
                                {renderItemDropdown(`templateItem-${idx}`, (opt) => {
                                  updateTemplateItem(idx, 'item', opt.nomenclature);
                                  updateTemplateItem(idx, 'itemId', opt.itemId);
                                  fetchItemBatches(opt.itemId, true, idx);
                                })}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={item.qty}
                                  onChange={(e) => updateTemplateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                                  min="1"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={item.batch}
                                  onChange={(e) => updateTemplateItem(idx, 'batch', e.target.value)}
                                >
                                  {loadingBatches[item.itemId] ? (
                                    <option value="">Loading...</option>
                                  ) : (fetchedBatches[item.itemId] || []).length === 0 && item.itemId ? (
                                    <option value="" disabled>NIL</option>
                                  ) : (
                                    (fetchedBatches[item.itemId] || []).map(b => (
                                      <option key={b.batchName} value={b.batchName}>
                                        {b.batchName} (Stock: {b.batchStock})
                                      </option>
                                    ))
                                  )}
                                </select>
                              </td>
                              <td>{item.expiry || '—'}</td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={item.usedBy}
                                  onChange={(e) => updateTemplateItem(idx, 'usedBy', e.target.value)}
                                  placeholder="Nurse"
                                />
                              </td>
                              <td>
                                <input
                                  type="datetime-local"
                                  className="form-control form-control-sm"
                                  value={item.dateTime}
                                  disabled
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={item.procedureRef}
                                  onChange={(e) => updateTemplateItem(idx, 'procedureRef', e.target.value)}
                                >
                                  <option value="">— None —</option>
                                  {procedures.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.procedure} ({new Date(p.dateTime).toLocaleDateString()})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={item.remarks}
                                  onChange={(e) => updateTemplateItem(idx, 'remarks', e.target.value)}
                                  placeholder="Optional"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-end">
                      <button className="btn btn-success btn-sm" onClick={addTemplateItems} disabled={isSavingConsumables}>
                        {isSavingConsumables ? 'Saving...' : `Save All (${templateItems.length} items)`}
                      </button>
                    </div>
                  </div>
                ) : (
                  // No template applied — user builds their own rows one at a time.
                  <>
                    <div className="row g-2">
                      <div className="col-md-4 position-relative">
                        <label className="form-label small">Item Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={newConsumable.item}
                          onChange={(e) => {
                            setNewConsumable({ ...newConsumable, item: e.target.value, uom: '' });
                            handleItemSearchChange(e.target.value, 'manual');
                          }}
                          onFocus={() => {
                            handleItemSearchChange(newConsumable.item, 'manual');
                          }}
                          onBlur={() => setActiveItemDropdown(null)}
                          placeholder="Type to search"
                        />
                        {renderItemDropdown('manual', (opt) => {
                          setNewConsumable({
                            ...newConsumable,
                            item: opt.nomenclature,
                            itemId: opt.itemId,
                            uom: opt.unitAuName || '',
                            batch: '',
                            expiry: ''
                          });
                          fetchItemBatches(opt.itemId);
                        })}
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">UOM</label>
                        <input type="text" className="form-control form-control-sm" value={newConsumable.uom} readOnly />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Batch *</label>
                        <select
                          className="form-select form-select-sm"
                          value={newConsumable.batch}
                          onChange={(e) => handleBatchChange(e.target.value, newConsumable.itemId)}
                        >
                          {loadingBatches[newConsumable.itemId] ? (
                            <option value="">Loading...</option>
                          ) : (fetchedBatches[newConsumable.itemId] || []).length === 0 && newConsumable.itemId ? (
                            <option value="" disabled>NIL</option>
                          ) : (
                            (fetchedBatches[newConsumable.itemId] || []).map(b => (
                              <option key={b.batchName} value={b.batchName}>
                                {b.batchName} (Stock: {b.batchStock})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Expiry</label>
                        <input type="text" className="form-control form-control-sm" value={newConsumable.expiry} readOnly />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Quantity *</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={newConsumable.qty}
                          onChange={(e) => setNewConsumable({ ...newConsumable, qty: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                          min="1"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Used By *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={newConsumable.usedBy}
                          onChange={(e) => setNewConsumable({ ...newConsumable, usedBy: e.target.value })}
                          placeholder="Nurse"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Date & Time *</label>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={newConsumable.dateTime}
                          disabled
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">Procedure Reference (optional)</label>
                        <select
                          className="form-select form-select-sm"
                          value={newConsumable.procedureRef}
                          onChange={(e) => setNewConsumable({ ...newConsumable, procedureRef: e.target.value })}
                        >
                          <option value="">— None —</option>
                          {procedures.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.procedure} ({new Date(p.dateTime).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-12 mt-2">
                        <label className="form-label small">Remarks (optional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={newConsumable.remarks}
                          onChange={(e) => setNewConsumable({ ...newConsumable, remarks: e.target.value })}
                          placeholder="Optional remarks"
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                      <button className="btn btn-outline-primary btn-sm" onClick={addManualRow}>
                        + Add Row
                      </button>
                    </div>

                    {/* Rows added so far — same column layout as the template table.
                        Click a row to pull it back into the form above for editing. */}
                    {manualItems.length > 0 && (
                      <div className="table-responsive mt-3">
                        <table className="table table-sm table-bordered align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Item</th>
                              <th>Qty</th>
                              <th>Batch</th>
                              <th>Expiry</th>
                              <th>Used By</th>
                              <th>Date/Time</th>
                              <th>Procedure Ref</th>
                              <th>Remarks</th>
                              <th style={{ width: '40px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {manualItems.map((row) => {
                              const proc = procedures.find(p => p.id == row.procedureRef);
                              const refText = proc ? `${proc.procedure} (${new Date(proc.dateTime).toLocaleDateString()})` : '—';
                              return (
                                <tr
                                  key={row.rowId}
                                  onClick={() => editManualRow(row)}
                                  style={{ cursor: 'pointer' }}
                                  title="Click to edit this row"
                                >
                                  <td>{row.item || '—'}</td>
                                  <td>{row.qty || '—'}</td>
                                  <td>{row.batch || '—'}</td>
                                  <td>{row.expiry || '—'}</td>
                                  <td>{row.usedBy || '—'}</td>
                                  <td>{row.dateTime ? new Date(row.dateTime).toLocaleString() : '—'}</td>
                                  <td>{refText}</td>
                                  <td>{row.remarks || '—'}</td>
                                  <td className="text-center">
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={(e) => { e.stopPropagation(); removeManualRow(row.rowId); }}
                                      title="Remove row"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="d-flex justify-content-end mt-3">
                          <button className="btn btn-success btn-sm" onClick={saveManualItems} disabled={isSavingConsumables}>
                            {isSavingConsumables ? 'Saving...' : `Save ${manualItems.length} Entries`}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowAddConsumableModal(false); resetConsumableModal(); }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TEMPLATE MANAGER MODAL ─── */}
      {showTemplateModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ ...sideModalOverlayStyle, zIndex: 1050 }}
        >
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
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={templateForm.templateCode}
                      onChange={(e) => setTemplateForm({ ...templateForm, templateCode: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Template Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4 position-relative">
                    <label className="form-label small">Procedure Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={templateForm.procedureName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTemplateForm({ ...templateForm, procedureName: val });
                        fetchProcedureOptions(val);
                        setShowTemplateProcDropdown(true);
                      }}
                      onFocus={() => setShowTemplateProcDropdown(true)}
                      onBlur={() => setShowTemplateProcDropdown(false)}
                    />
                    {showTemplateProcDropdown && procedureOptions.length > 0 && (
                      <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", top: "100%" }}>
                        {procedureOptions.map((opt, idx) => (
                          <li
                            key={idx}
                            className="list-group-item list-group-item-action py-1"
                            style={{ cursor: "pointer", fontSize: "0.8rem" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setTemplateForm({ ...templateForm, procedureName: opt.procedureName, procedureId: opt.procedureId });
                              setShowTemplateProcDropdown(false);
                            }}
                          >
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
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.item}
                              onChange={(e) => {
                                updateTemplateItemForm(idx, 'item', e.target.value);
                                handleItemSearchChange(e.target.value, `templateForm-${idx}`);
                              }}
                              onFocus={() => {
                                handleItemSearchChange(item.item, `templateForm-${idx}`);
                              }}
                              onBlur={() => setActiveItemDropdown(null)}
                              placeholder="Type to search"
                            />
                            {renderItemDropdown(`templateForm-${idx}`, (opt) => {
                              updateTemplateItemForm(idx, 'item', opt.nomenclature);
                              updateTemplateItemForm(idx, 'itemId', opt.itemId);
                            })}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.qty}
                              onChange={(e) => updateTemplateItemForm(idx, 'qty', parseInt(e.target.value) || 0)}
                              min="1"
                            />
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
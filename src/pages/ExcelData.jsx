import React, { useState, useEffect, useMemo } from 'react';
import { sendToN8nParseExcel } from '../apis/n8nWebhook.jsx'; // Adjust the import path as necessary
import { getAllFinRatios, createFinRatio, updateFinRatio } from '../apis/finRatioService';
import { getAllFinRatioNganhangs, createFinRatioNganhang, updateFinRatioNganhang } from '../apis/finRatioNganhangService';
import { getAllFinRatioBaohiems, createFinRatioBaohiem, updateFinRatioBaohiem } from '../apis/finRatioBaohiemService';
import { getAllFinRatioChungkhoans, createFinRatioChungkhoan, updateFinRatioChungkhoan } from '../apis/finRatioChungkhoanService';
import { getAllCompanyReports, createCompanyReport, updateCompanyReport } from '../apis/companyReportService';
import { getAllIndustryReports, createIndustryReport, updateIndustryReport } from '../apis/industryReportService';
import { getAllMacroReports, createMacroReport, updateMacroReport } from '../apis/macroReportService';
import { getAllStrategyReports, createStrategyReport, updateStrategyReport } from '../apis/strategyReportService';
import { getAllIRReports, createIRReport, updateIRReport } from '../apis/IRReportService';
// import { getAllVNIndex, createVNIndex, updateVNIndex } from '../apis/vnindexService';
import { getAllBctcConsols, createBctcConsol, updateBctcConsol } from '../apis/bctcConsolService';
import { getAllFinRatioLists, createFinRatioList, updateFinRatioList } from '../apis/finRatioListService';
import { getAllFullNameCompanies, createFullNameCompany, updateFullNameCompany } from '../apis/fullNameCompanyService';
import { getAllCompanyInfos, createCompanyInfo, updateCompanyInfo } from '../apis/companyInfoService';
import { getAllCompanyEvents, createCompanyEvent, updateCompanyEvent } from '../apis/companyEventService';
import { aiGen, uploadPdfFile } from '../apis/aiGen/botService';
import { createAISummary, getAllAISummaries, getAISummaryById } from '../apis/aiSummaryService';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Tabs, Modal, Button } from 'antd';

// Custom Button Component for ag-Grid
const CustomButtonComponent = (props) => {
  const handleClick = () => {
    if (props.data) {
      // Use the ID from data if available, otherwise use the row id
      const itemId = props.data.ID || props.data.id;
      if (itemId) {
        // Call the parent's handleOpenSummary function with item ID
        props.context.handleOpenSummary(itemId);
      }
    }
  };

  if (props.value === true && props.data) {
    const itemId = props.data.ID || props.data.id;
    if (itemId) {
      return (
        <button
          onClick={handleClick}
          style={{
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Xem chi tiết
        </button>
      );
    }
  }
  return null;
};

const ExcelData = () => {
  const [googleDriveUrl, setGoogleDriveUrl] = useState("");
  const [finRatios, setFinRatios] = useState([]);
  const [updateDiffs, setUpdateDiffs] = useState([]);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [aiSummaries, setAiSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [customSystemMessage, setCustomSystemMessage] = useState(`Bạn sẽ nhận toàn bộ nội dung của một báo cáo dưới dạng văn bản. Hãy đọc và trả về kết quả theo định dạng sau:

[SUMMARY_DETAILED]
(Viết đoạn tổng quan chi tiết, 30–40 câu, phân tích bối cảnh, mục tiêu, phương pháp thực hiện, các bước tiếp cận, kết quả và kết luận chính, có định dạng markdown.)

[SUMMARY_SHORT]
(Dựa trên nội dung [SUMMARY_DETAILED], viết đoạn tóm tắt ngắn gọn, 7–10 câu, nêu bật mục tiêu và các điểm chính của báo cáow.)

Chỉ trả về nội dung theo đúng định dạng trên, không thêm phần thừa. Đảm bảo giữ nguyên nhãn [SUMMARY_DETAILED] và [SUMMARY_SHORT].`);

  // Fetch all FinRatios and AI Summaries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllFinRatios();
        setFinRatios(data);
      } catch (e) {
        setFinRatios([]);
      }
    };
    fetchData();
  }, []);

  // Fetch all AI Summaries on mount
  useEffect(() => {
    const fetchAiSummaries = async () => {
      try {
        const data = await getAllAISummaries();
        setAiSummaries(data);
      } catch (e) {
        console.error('Error fetching AI summaries:', e);
        setAiSummaries([]);
      }
    };
    fetchAiSummaries();
  }, []);



  const handleClick = async () => {
    try {
      // const response = await fetch('https://n8n.sab.io.vn/webhook-test/get-excel');
      // const blob = await response.blob();
      // const arrayBuffer = await blob.arrayBuffer();
      // const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      // const sheetNames = workbook.SheetNames;
      // console.log('Sheet names:', sheetNames);
      // sheetNames.forEach((name, idx) => {
      //   console.log(`Sheet ${idx + 1}:`, name);
      // });
      // const sheetNamesJson = [{ sheets: sheetNames }];
      // console.log('Sheet names as JSON:', JSON.stringify(sheetNamesJson, null, 2));

// Send parsed sheet names to the specified endpoint

      // const sheetNamesJson = [
      //   {
      //     "sheets": ["users", "products", "fin_ratio", "order_items", "categories"]
      //   }
      // ]
      const sheetNamesJson =  [
        {
          "sheets": [
            "BCTC_Consol",
            "fin_ratio_list",
            "fin_ratio",
            "fin_ratio_nganhang",
            "fin_ratio_baohiem",
            "fin_ratio_chungkhoan",
            "BCTC_seperate",
            "company_report",
            "industry_report",
            "macro_report",
            "strategy_report",
            "IR_report",
            "Sector_financial_ratios",
            "VNINDEX",
            "Sector_index",
            "global_index",
            "FullName_company",
            "financial_planning"
          ]
        }
      ]
      // Send parsed sheet names to the specified endpoint
      // Use your backend API instead of direct fetch
      const postResult = await sendToN8nParseExcel(sheetNamesJson, googleDriveUrl);
      console.log('Response from /send-to-n8n-parse-excel:', postResult);

      // Check and post items to fin_ratio, company_report, industry_report, and macro_report
      const sheetNamesToProcess = [
        { key: 'fin_ratio', label: 'FinRatio' },
        { key: 'fin_ratio_nganhang', label: 'FinRatioNganhang' },
        { key: 'fin_ratio_baohiem', label: 'FinRatioBaohiem' },
        { key: 'fin_ratio_chungkhoan', label: 'FinRatioChungkhoan' },
        { key: 'company_report', label: 'Company Report' },
        { key: 'industry_report', label: 'Industry Report' },
        { key: 'macro_report', label: 'Macro Report' },
        { key: 'strategy_report', label: 'Strategy Report' },
        { key: 'IR_report', label: 'IR Report' },
        { key: 'bctc_consol', label: 'BctcConsol' },
        { key: 'fin_ratio_list', label: 'FinRatioList' },
        { key: 'full_name_company', label: 'FullNameCompany' },
        { key: 'company_info', label: 'CompanyInfo' },
        { key: 'company_event', label: 'CompanyEvent' },
        // { key: 'VNINDEX', label: 'VNINDEX' }
      ];
      let allDiffs = [];
      let totalSuccess = 0;
      let totalFail = 0;
      for (const sheetInfo of sheetNamesToProcess) {
        const sheet = postResult.find(sheet => sheet.sheetName === sheetInfo.key);
        if (sheet && Array.isArray(sheet.items)) {
          let allRecords = [];
          if (sheetInfo.key === 'fin_ratio_nganhang') {
            allRecords = await getAllFinRatioNganhangs();
          } else if (sheetInfo.key === 'fin_ratio_baohiem') {
            allRecords = await getAllFinRatioBaohiems();
          } else if (sheetInfo.key === 'fin_ratio_chungkhoan') {
            allRecords = await getAllFinRatioChungkhoans();
          } else if (sheetInfo.key === 'company_report') {
            allRecords = await getAllCompanyReports();
          } else if (sheetInfo.key === 'industry_report') {
            allRecords = await getAllIndustryReports();
          } else if (sheetInfo.key === 'macro_report') {
            allRecords = await getAllMacroReports();
          } else if (sheetInfo.key === 'strategy_report') {
            allRecords = await getAllStrategyReports();
          } else if (sheetInfo.key === 'IR_report') {
            allRecords = await getAllIRReports();
          } else if (sheetInfo.key === 'bctc_consol') {
            allRecords = await getAllBctcConsols();
          } else if (sheetInfo.key === 'fin_ratio_list') {
            allRecords = await getAllFinRatioLists();
          } else if (sheetInfo.key === 'full_name_company') {
            allRecords = await getAllFullNameCompanies();
          } else if (sheetInfo.key === 'company_info') {
            allRecords = await getAllCompanyInfos();
          } else if (sheetInfo.key === 'company_event') {
            allRecords = await getAllCompanyEvents();
          // } else if (sheetInfo.key === 'VNINDEX') {
          //   allRecords = await getAllVNIndex();
          } else {
            allRecords = await getAllFinRatios();
          }
          const diffs = [];
          const results = await Promise.allSettled(
            sheet.items.map(async item => {
              const payload = { data: item, gd_url: googleDriveUrl };
              let existing;
              if ([
                'fin_ratio_nganhang',
                'fin_ratio_baohiem',
                'fin_ratio_chungkhoan',
                'company_report',
                'industry_report',
                'macro_report',
                'strategy_report',
                'IR_report',
                'bctc_consol',
                'fin_ratio_list',
                'full_name_company',
                'company_info',
                'company_event',
              ].includes(sheetInfo.key)) {
                existing = allRecords.find(r => r.data["ID"] === item["ID"]);
              } else {
                existing = allRecords.find(
                  r => r.data["Mã CK"] === item["Mã CK"] && r.data["Ngày"] === item["Ngày"]
                );
              }
              if (existing) {
                // Compare old and new data
                const oldData = existing.data || {};
                const newData = item;
                const changedFields = Object.keys({ ...oldData, ...newData }).filter(
                  key => oldData[key] !== newData[key]
                );
                const fieldDiffs = changedFields.map(key => ({
                  field: key,
                  oldValue: oldData[key],
                  newValue: newData[key]
                }));
                if (fieldDiffs.length > 0) {
                  diffs.push({
                    id: existing.id,
                    maCK: oldData["Mã CK"],
                    ngay: oldData["Ngày"],
                    changes: fieldDiffs,
                    sheet: sheetInfo.label
                  });
                }
                if (sheetInfo.key === 'fin_ratio_nganhang') {
                  await updateFinRatioNganhang(existing.id, payload);
                } else if (sheetInfo.key === 'fin_ratio_baohiem') {
                  await updateFinRatioBaohiem(existing.id, payload);
                } else if (sheetInfo.key === 'fin_ratio_chungkhoan') {
                  await updateFinRatioChungkhoan(existing.id, payload);
                } else if (sheetInfo.key === 'company_report') {
                  await updateCompanyReport(existing.id, payload);
                } else if (sheetInfo.key === 'industry_report') {
                  await updateIndustryReport(existing.id, payload);
                } else if (sheetInfo.key === 'macro_report') {
                  await updateMacroReport(existing.id, payload);
                } else if (sheetInfo.key === 'strategy_report') {
                  await updateStrategyReport(existing.id, payload);
                } else if (sheetInfo.key === 'IR_report') {
                  await updateIRReport(existing.id, payload);
                } else if (sheetInfo.key === 'bctc_consol') {
                  await updateBctcConsol(existing.id, payload);
                } else if (sheetInfo.key === 'fin_ratio_list') {
                  await updateFinRatioList(existing.id, payload);
                } else if (sheetInfo.key === 'full_name_company') {
                  await updateFullNameCompany(existing.id, payload);
                } else if (sheetInfo.key === 'company_info') {
                  await updateCompanyInfo(existing.id, payload);
                } else if (sheetInfo.key === 'company_event') {
                  await updateCompanyEvent(existing.id, payload);
                // } else if (sheetInfo.key === 'VNINDEX') {
                //   await updateVNIndex(existing.id, payload);
                } else {
                  await updateFinRatio(existing.id, payload);
                }
                return true;
              } else {
                if (sheetInfo.key === 'fin_ratio_nganhang') {
                  await createFinRatioNganhang(payload);
                } else if (sheetInfo.key === 'fin_ratio_baohiem') {
                  await createFinRatioBaohiem(payload);
                } else if (sheetInfo.key === 'fin_ratio_chungkhoan') {
                  await createFinRatioChungkhoan(payload);
                } else if (sheetInfo.key === 'company_report') {
                  await createCompanyReport(payload);
                } else if (sheetInfo.key === 'industry_report') {
                  await createIndustryReport(payload);
                } else if (sheetInfo.key === 'macro_report') {
                  await createMacroReport(payload);
                } else if (sheetInfo.key === 'strategy_report') {
                  await createStrategyReport(payload);
                } else if (sheetInfo.key === 'IR_report') {
                  await createIRReport(payload);
                } else if (sheetInfo.key === 'bctc_consol') {
                  await createBctcConsol(payload);
                } else if (sheetInfo.key === 'fin_ratio_list') {
                  await createFinRatioList(payload);
                } else if (sheetInfo.key === 'full_name_company') {
                  await createFullNameCompany(payload);
                } else if (sheetInfo.key === 'company_info') {
                  await createCompanyInfo(payload);
                } else if (sheetInfo.key === 'company_event') {
                  await createCompanyEvent(payload);
                // } else if (sheetInfo.key === 'VNINDEX') {
                //   await createVNIndex(payload);
                } else {
                  await createFinRatio(payload);
                }
                return false;
              }
            })
          );
          totalSuccess += results.filter(r => r.status === 'fulfilled').length;
          totalFail += results.length - results.filter(r => r.status === 'fulfilled').length;
          allDiffs = allDiffs.concat(diffs);
        }
      }
      if (totalSuccess + totalFail > 0) {
        alert(`Đã gửi ${totalSuccess} bản ghi thành công. Thất bại: ${totalFail}`);
      } else {
        alert('Không tìm thấy sheet fin_ratio, company_report, industry_report, hoặc macro_report hoặc không có dữ liệu.');
      }
      // Refresh all tables after import
      try {
        setFinRatios(await getAllFinRatios());
      } catch {}
      try {
        setFinRatioNganhangs(await getAllFinRatioNganhangs());
      } catch {}
      try {
        setFinRatioBaohiems(await getAllFinRatioBaohiems());
      } catch {}
      try {
        setFinRatioChungkhoans(await getAllFinRatioChungkhoans());
      } catch {}
      try {
        setCompanyReports(await getAllCompanyReports());
      } catch {}
      try {
        setIndustryReports(await getAllIndustryReports());
      } catch {}
      try {
        setMacroReports(await getAllMacroReports());
      } catch {}
      try {
        setStrategyReports(await getAllStrategyReports());
      } catch {}
      try {
        setIrReports(await getAllIRReports());
      } catch {}
      try {
        setBctcConsols(await getAllBctcConsols());
      } catch {}
      try {
        setFinRatioLists(await getAllFinRatioLists());
      } catch {}
      try {
        setFullNameCompanies(await getAllFullNameCompanies());
      } catch {}
      try {
        setCompanyInfos(await getAllCompanyInfos());
      } catch {}
      try {
        setCompanyEvents(await getAllCompanyEvents());
      } catch {}
      setUpdateDiffs(allDiffs);
    } catch (error) {
      console.error('Error fetching, parsing, or posting Excel file:', error);
    }
  };

  // Top-level tab for table selection
  const [activeTable, setActiveTable] = useState('fin_ratio');

  // Fetch all data for each table
  const [finRatioNganhangs, setFinRatioNganhangs] = useState([]);
  const [finRatioBaohiems, setFinRatioBaohiems] = useState([]);
  const [finRatioChungkhoans, setFinRatioChungkhoans] = useState([]);
  const [companyReports, setCompanyReports] = useState([]);
  const [industryReports, setIndustryReports] = useState([]);
  const [macroReports, setMacroReports] = useState([]);
  const [strategyReports, setStrategyReports] = useState([]);
  const [irReports, setIrReports] = useState([]);
  // const [vnindexData, setVnindexData] = useState([]);
  const [bctcConsols, setBctcConsols] = useState([]);
  const [finRatioLists, setFinRatioLists] = useState([]);
  const [fullNameCompanies, setFullNameCompanies] = useState([]);
  const [companyInfos, setCompanyInfos] = useState([]);
  const [companyEvents, setCompanyEvents] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setFinRatioNganhangs(await getAllFinRatioNganhangs());
      } catch {}
      try {
        setFinRatioBaohiems(await getAllFinRatioBaohiems());
      } catch {}
      try {
        setFinRatioChungkhoans(await getAllFinRatioChungkhoans());
      } catch {}
      try {
        setCompanyReports(await getAllCompanyReports());
      } catch {}
      try {
        setIndustryReports(await getAllIndustryReports());
      } catch {}
      try {
        setMacroReports(await getAllMacroReports());
      } catch {}
      try {
        setStrategyReports(await getAllStrategyReports());
      } catch {}
      try {
        setIrReports(await getAllIRReports());
      } catch {}
      try {
        setBctcConsols(await getAllBctcConsols());
      } catch {}
      try {
        setFinRatioLists(await getAllFinRatioLists());
      } catch {}
      try {
        setFullNameCompanies(await getAllFullNameCompanies());
      } catch {}
      try {
        setCompanyInfos(await getAllCompanyInfos());
      } catch {}
      try {
        setCompanyEvents(await getAllCompanyEvents());
      } catch {}
      // try {
      //   setVnindexData(await getAllVNIndex());
      // } catch {}
    };
    fetchAll();
  }, []);

  // Data source by table
  const tableDataMap = {
    fin_ratio: finRatios,
    fin_ratio_nganhang: finRatioNganhangs,
    fin_ratio_baohiem: finRatioBaohiems,
    fin_ratio_chungkhoan: finRatioChungkhoans,
    company_report: companyReports,
    industry_report: industryReports,
    macro_report: macroReports,
    strategy_report: strategyReports,
    IR_report: irReports,
    bctc_consol: bctcConsols,
    // fin_ratio_list: finRatioLists,
    full_name_company: fullNameCompanies,
    company_info: companyInfos,
    company_event: companyEvents,
    // VNINDEX: vnindexData,
  };
  const tableLabelMap = {
    fin_ratio: 'FinRatio',
    fin_ratio_nganhang: 'FinRatioNganhang',
    fin_ratio_baohiem: 'FinRatioBaohiem',
    fin_ratio_chungkhoan: 'FinRatioChungkhoan',
    company_report: 'CompanyReport',
    industry_report: 'IndustryReport',
    macro_report: 'MacroReport',
    strategy_report: 'StrategyReport',
    IR_report: 'IRReport',
    bctc_consol: 'BctcConsol',
    // fin_ratio_list: 'FinRatioList',
    full_name_company: 'FullNameCompany',
    company_info: 'CompanyInfo',
    company_event: 'CompanyEvent',
    // VNINDEX: 'VNINDEX',
  };
  const currentTableData = tableDataMap[activeTable] || [];

  // Show all data, not filtered by gd_url
  const filteredTableData = currentTableData;

  // Compute all unique column names in data for the selected tab
  const allColumns = useMemo(() => {
    const cols = new Set();
    filteredTableData.forEach(r => {
      if (r.data && typeof r.data === 'object') {
        Object.keys(r.data).forEach(k => cols.add(k));
      }
    });
    return Array.from(cols);
  }, [filteredTableData]);

  // Prepare ag-Grid columns (remove gd_url)
  const agGridColumns = useMemo(() => [
    {
      headerName: '',
      field: 'checkbox',
      pinned: 'left',
      width: 50,
      minWidth: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      suppressMenu: true,
      sortable: false,
      filter: false
    },
    { 
      headerName: 'ID', 
      field: 'id', 
      pinned: 'left', 
      width: 90, 
      minWidth: 90,
      filter: 'agTextColumnFilter',
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
        defaultOption: 'contains'
      }
    },
    ...allColumns.map(col => {
      // Determine filter type based on column name or content
      let filterType = 'agTextColumnFilter';
      let filterParams = {
        filterOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
        defaultOption: 'contains'
      };
      
      // Use number filter for numeric columns
      if (col.toLowerCase().includes('tỷ lệ') || 
          col.toLowerCase().includes('ratio') || 
          col.toLowerCase().includes('số') ||
          col.toLowerCase().includes('giá') ||
          col.toLowerCase().includes('vốn') ||
          col.toLowerCase().includes('lợi nhuận') ||
          col.toLowerCase().includes('doanh thu')) {
        filterType = 'agNumberColumnFilter';
        filterParams = {
          filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
          defaultOption: 'equals'
        };
      }
      
      // Use date filter for date columns
      if (col.toLowerCase().includes('ngày') || 
          col.toLowerCase().includes('date') ||
          col.toLowerCase().includes('thời gian')) {
        filterType = 'agDateColumnFilter';
        filterParams = {
          filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
          defaultOption: 'equals'
        };
      }
      
      return {
        headerName: col, 
        field: col, 
        flex: 1, 
        minWidth: 200,
        filter: filterType,
        filterParams: filterParams,
        sortable: true,
        resizable: true
      };
    }),
    {
      headerName: 'Đã phân tích',
      field: 'isAnalyzed',
      pinned: 'right',
      width: 120,
      minWidth: 120,
      cellRenderer: CustomButtonComponent,
      suppressMenu: true,
      sortable: false,
      filter: false
    }
    // { headerName: 'gd_url', field: 'gd_url', minWidth: 200 }
  ], [allColumns]);

  // Get analyzed item IDs and summary mapping for current table
  const analyzedItemsMap = useMemo(() => {
    console.log('AI Summaries:', aiSummaries);
    console.log('Active Table:', activeTable);
    
    const currentTableSummaries = aiSummaries.filter(summary => 
      summary.info && summary.info.sheetName === activeTable
    );
    
    console.log('Current Table Summaries:', currentTableSummaries);
    
    const itemsMap = new Map();
          currentTableSummaries.forEach(summary => {
        let itemId = null;
        // Use uppercase 'ID' (e.g., 20227) not lowercase 'id' (e.g., 10)
        if (summary.info && summary.info.itemData && summary.info.itemData.ID) {
          itemId = summary.info.itemData.ID;
        } else if (summary.info && summary.info.itemData && summary.info.itemData.id) {
          itemId = summary.info.itemData.id;
        }
        
        if (itemId) {
          itemsMap.set(itemId, summary.id);
        }
      });
    
    console.log('Analyzed Items Map:', itemsMap);
    return itemsMap;
  }, [aiSummaries, activeTable]);

  // Prepare ag-Grid row data (remove gd_url)
  const agGridRows = useMemo(() => {
    console.log('Filtered Table Data:', filteredTableData);
    console.log('Analyzed Items Map:', analyzedItemsMap);
    
    const rows = filteredTableData.map(r => {
      // Check if the row has an ID field in its data
      const rowId = r.data?.ID || r.id;
      const summaryId = analyzedItemsMap.get(rowId);
      const isAnalyzed = !!summaryId;
      console.log(`Row ID ${rowId} (from ${r.data?.ID ? 'data.ID' : 'r.id'}) isAnalyzed: ${isAnalyzed}, summaryId: ${summaryId}`);
      
      return { 
        id: r.id, 
        ...(r.data || {}),
        // Add flags to indicate if this item has been analyzed and its summary ID
        isAnalyzed: isAnalyzed,
        summaryId: summaryId
      };
    });
    
    console.log('Final ag-Grid rows:', rows);
    return rows;
  }, [filteredTableData, analyzedItemsMap]);

  // Filter updateDiffs for the selected table and gd_url
  const filteredUpdateDiffs = useMemo(() =>
    updateDiffs.filter(diff => {
      const r = currentTableData.find(x => x.id === diff.id);
      return r && r.gd_url === googleDriveUrl;
    }),
    [updateDiffs, currentTableData, googleDriveUrl]
  );

  // Helper to extract Google Drive file ID from URL
  function extractGDriveId(url) {
    if (!url) return '';
    // Handles URLs like https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const match = url.match(/\/d\/([\w-]+)/);
    if (match) return match[1];
    // Handles URLs like https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([\w-]+)/);
    if (match2) return match2[1];
    // Handles URLs like https://drive.google.com/uc?id=FILE_ID&export=download
    const match3 = url.match(/id=([\w-]+)/);
    if (match3) return match3[1];
    return url;
  }

  // Handle opening summary modal
  const handleOpenSummary = async (itemId) => {
    try {
      setIsLoadingSummary(true);
      // Get all summaries for this item
      const allSummaries = await getAllAISummaries();
      const itemSummaries = allSummaries.filter(summary => {
        try {
          const info = typeof summary.info === 'string' ? JSON.parse(summary.info) : summary.info;
          return info && info.itemData && info.itemData.ID === itemId;
        } catch {
          return false;
        }
      });
      setSelectedSummary({ itemId, summaries: itemSummaries });
      setIsSummaryModalOpen(true);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      alert('Có lỗi khi tải tóm tắt');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Handle Tổng quan button click for FinRatio data
  const handleTongQuan = async () => {
    try {
      // Get all FinRatio data
      const allFinRatioData = finRatios.map(item => item.data).filter(data => data);

      if (allFinRatioData.length === 0) {
        alert('Không có dữ liệu FinRatio để phân tích');
        return;
      }

      const systemMessage = `
Bạn sẽ nhận toàn bộ nội dung của một báo cáo dưới dạng văn bản. Hãy đọc và trả về kết quả theo định dạng sau:

[SUMMARY_DETAILED]
(Viết đoạn tổng quan chi tiết, khoảng 1 trang A4, phân tích bối cảnh, mục tiêu, phương pháp thực hiện, các bước tiếp cận, kết quả và kết luận chính.)

[SUMMARY_SHORT]
(Dựa trên nội dung [SUMMARY_DETAILED], viết đoạn tóm tắt ngắn gọn, 7–10 câu, nêu bật mục tiêu và các điểm chính của báo cáo.)

Chỉ trả về nội dung theo đúng định dạng trên, không thêm phần thừa. Đảm bảo giữ nguyên nhãn [SUMMARY_DETAILED] và [SUMMARY_SHORT].
`;
      const model = "gemini-2.5-pro-preview-06-05";

      console.log('Processing FinRatio data items individually...');
      console.log('Total items to process:', allFinRatioData.length);

      let successCount = 0;
      let errorCount = 0;

      // Process each item individually
      for (let i = 0; i < allFinRatioData.length; i++) {
        const item = allFinRatioData[i];
        try {
          console.log(`Processing item ${i + 1}/${allFinRatioData.length}`);

          // Convert single item to JSON string for prompt
          const prompt = JSON.stringify(item, null, 2);

          console.log(`Item ${i + 1} prompt length:`, prompt.length);

          const response = await aiGen(prompt, systemMessage, model, 'text');

          console.log(`Item ${i + 1} AI Response:`, response);

          // Parse the result to extract summary1 and summary2
          if (response && response.result) {
            const resultText = response.result;

            // Extract SUMMARY_SHORT section
            const shortMatch = resultText.match(/\[SUMMARY_SHORT\]\s*\n([\s\S]*?)(?=\n\[SUMMARY_DETAILED\]|$)/);
            const summary1 = shortMatch ? shortMatch[1].trim() : '';

            // Extract SUMMARY_DETAILED section
            const detailedMatch = resultText.match(/\[SUMMARY_DETAILED\]\s*\n([\s\S]*?)$/);
            const summary2 = detailedMatch ? detailedMatch[1].trim() : '';

            console.log(`Item ${i + 1} - Extracted summary1:`, summary1);
            console.log(`Item ${i + 1} - Extracted summary2:`, summary2);

            // Save to aiSummary table
            if (summary1 || summary2) {
              const aiSummaryData = {
                summary1: summary1 || null,
                summary2: summary2 || null,
                info: {
                  sheetName: 'fin_ratio',
                  itemIndex: i + 1,
                  totalItems: allFinRatioData.length,
                  dataType: 'FinRatio',
                  itemData: item
                }
              };

              try {
                const savedSummary = await createAISummary(aiSummaryData);
                console.log(`Item ${i + 1} - Saved to aiSummary table:`, savedSummary);
                successCount++;
              } catch (saveError) {
                console.error(`Item ${i + 1} - Lỗi khi lưu vào aiSummary table:`, saveError);
                errorCount++;
              }
            } else {
              console.warn(`Item ${i + 1} - Không thể trích xuất summary từ kết quả AI`);
              errorCount++;
            }
          } else {
            console.warn(`Item ${i + 1} - Response không có result field`);
            errorCount++;
          }
        } catch (itemError) {
          console.error(`Item ${i + 1} - Lỗi khi xử lý:`, itemError);
          errorCount++;
        }
      }

      console.log(`Processing completed. Success: ${successCount}, Errors: ${errorCount}`);
      alert(`Phân tích hoàn thành! Thành công: ${successCount}, Lỗi: ${errorCount}`);

    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu FinRatio:', error);
      alert('Có lỗi xảy ra khi phân tích dữ liệu');
    }
  };

  // Handle Tổng quan button click for CompanyReport data
  const handleTongQuanCompanyReport = async () => {
    try {
      // Get all CompanyReport data
      const allCompanyReportData = companyReports.map(item => item.data).filter(data => data);

      if (allCompanyReportData.length === 0) {
        alert('Không có dữ liệu CompanyReport để phân tích');
        return;
      }

      // Convert data to JSON string for prompt
      const prompt = JSON.stringify(allCompanyReportData, null, 2);
      const systemMessage = `
Bạn sẽ nhận toàn bộ nội dung của một báo cáo dưới dạng văn bản. Hãy đọc và trả về kết quả theo định dạng sau:

[SUMMARY_SHORT]
(Viết đoạn tóm tắt ngắn, 7–10 câu, nêu mục tiêu hoặc nội dung chính của báo cáo.)

[SUMMARY_DETAILED]
(Viết đoạn tổng quan chi tiết hơn, 15–20 câu, phân tích bối cảnh, cách tiếp cận và các kết luận chính.)

Chỉ trả về nội dung theo đúng định dạng trên, không thêm phần thừa. Đảm bảo giữ nguyên nhãn [SUMMARY_SHORT] và [SUMMARY_DETAILED].
`;
      const model = "gemini-2.5-pro-preview-06-05";

      console.log('Sending CompanyReport data to AI for analysis...');
      console.log('Prompt length:', prompt.length);
      console.log('System message:', systemMessage);
      console.log('Model:', model);

      const response = await aiGen(prompt, systemMessage, model, 'text');

      console.log('AI Response:', response);

      // Parse the result to extract summary1 and summary2
      if (response && response.result) {
        const resultText = response.result;

        // Extract SUMMARY_SHORT section
        const shortMatch = resultText.match(/\[SUMMARY_SHORT\]\s*\n([\s\S]*?)(?=\n\[SUMMARY_DETAILED\]|$)/);
        const summary1 = shortMatch ? shortMatch[1].trim() : '';

        // Extract SUMMARY_DETAILED section
        const detailedMatch = resultText.match(/\[SUMMARY_DETAILED\]\s*\n([\s\S]*?)$/);
        const summary2 = detailedMatch ? detailedMatch[1].trim() : '';

        console.log('Extracted summary1:', summary1);
        console.log('Extracted summary2:', summary2);

        // Save to aiSummary table
        if (summary1 || summary2) {
          const aiSummaryData = {
            summary1: summary1 || null,
            summary2: summary2 || null,
            info: {
              sheetName: 'company_report',
              numberOfRows: allCompanyReportData.length,
              dataType: 'CompanyReport'
            }
          };

          try {
            const savedSummary = await createAISummary(aiSummaryData);
            console.log('Saved to aiSummary table:', savedSummary);
            alert('Phân tích hoàn thành và đã lưu vào cơ sở dữ liệu!');
          } catch (saveError) {
            console.error('Lỗi khi lưu vào aiSummary table:', saveError);
            alert('Phân tích hoàn thành nhưng có lỗi khi lưu vào cơ sở dữ liệu');
          }
        } else {
          console.warn('Không thể trích xuất summary từ kết quả AI');
          alert('Phân tích hoàn thành nhưng không thể trích xuất nội dung tóm tắt');
        }
      } else {
        console.warn('Response không có result field');
        alert('Phân tích hoàn thành nhưng không nhận được kết quả hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu CompanyReport:', error);
      alert('Có lỗi xảy ra khi phân tích dữ liệu');
    }
  };

  // Handle OCR File button click
  const handleOcrFile = async () => {
    try {
      if (selectedRows.length === 0) {
        alert('Vui lòng chọn ít nhất một dòng để thực hiện OCR');
        return;
      }

      setIsOcrLoading(true);
      console.log('Starting OCR process for selected rows:', selectedRows);

      const results = [];

      for (const row of selectedRows) {
        try {
          // Check if the row has a file URL
          if (!row.URL) {
            console.warn(`Row ${row.id} does not have a URL, skipping...`);
            continue;
          }

          console.log(`Processing file: ${row.name || row.id} from URL: ${row.URL}`);

          // Fetch the file from the URL
          const response = await fetch(row.URL);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();
          const fileObj = new File([blob], row.name || `file_${row.id}.pdf`, { type: 'application/pdf' });

          // Upload the file for OCR processing
          const result = await uploadPdfFile(fileObj);

          console.log(`OCR completed for file ${row.name || row.id}:`, result);

          // Process OCR result with AI if text is available
          if (result.text) {
            console.log(`Starting AI analysis for file ${row.name || row.id}...`);

            const systemMessage = customSystemMessage;

            const model = "google/gemini-2.5-pro" +
                "";
            const prompt = result.text;

            console.log(`Sending AI analysis request for file ${row.name || row.id}...`);
            console.log(`Prompt length: ${prompt.length} characters`);

            const aiResponse = await aiGen(prompt, systemMessage, model, 'text');

            console.log(`AI Response for file ${row.name || row.id}:`, aiResponse);

            // Parse the AI result to extract summary1 and summary2
            if (aiResponse && aiResponse.result) {
              const resultText = aiResponse.result;

              // Extract SUMMARY_DETAILED section
              const detailedMatch = resultText.match(/\[SUMMARY_DETAILED\]\s*\n([\s\S]*?)(?=\n\[SUMMARY_SHORT\]|$)/);
              const summary2 = detailedMatch ? detailedMatch[1].trim() : '';

              // Extract SUMMARY_SHORT section
              const shortMatch = resultText.match(/\[SUMMARY_SHORT\]\s*\n([\s\S]*?)$/);
              const summary1 = shortMatch ? shortMatch[1].trim() : '';

              console.log(`File ${row.name || row.id} - Extracted summary1:`, summary1);
              console.log(`File ${row.name || row.id} - Extracted summary2:`, summary2);

              // Save to aiSummary table
              if (summary1 || summary2) {
                const aiSummaryData = {
                  summary1: summary1 || null,
                  summary2: summary2 || null,
                  info: {
                    sheetName: activeTable,
                    itemIndex: results.length + 1,
                    title: row["Tên báo cáo"] || row.name || `File ${row.id}`,
                    URLReport: row.URL,
                    itemData: row
                  }
                };

                try {
                  const savedSummary = await createAISummary(aiSummaryData);
                  console.log(`File ${row.name || row.id} - Saved to aiSummary table:`, savedSummary);
                } catch (saveError) {
                  console.error(`File ${row.name || row.id} - Lỗi khi lưu vào aiSummary table:`, saveError);
                }
              }

              results.push({
                id: row.id,
                type: row.type || 'unknown',
                name: row.name || `file_${row.id}`,
                text: result.text,
                url: row.URL,
                summary1: summary1,
                summary2: summary2,
                aiResponse: aiResponse
              });
            } else {
              console.warn(`File ${row.name || row.id} - AI response không có result field`);
              results.push({
                id: row.id,
                type: row.type || 'unknown',
                name: row.name || `file_${row.id}`,
                text: result.text,
                url: row.URL,
                summary1: null,
                summary2: null,
                aiError: 'No AI result'
              });
            }
          } else {
            console.warn(`File ${row.name || row.id} - OCR result không có text`);
            results.push({
              id: row.id,
              type: row.type || 'unknown',
              name: row.name || `file_${row.id}`,
              text: null,
              url: row.URL,
              summary1: null,
              summary2: null,
              error: 'No OCR text'
            });
          }

        } catch (error) {
          console.error(`Error processing file ${row.name || row.id}:`, error);
          results.push({
            id: row.id,
            type: row.type || 'unknown',
            name: row.name || `file_${row.id}`,
            text: null,
            url: row.URL,
            summary1: null,
            summary2: null,
            error: error.message
          });
        }
      }

      console.log('OCR and AI processing completed. Final Results:', results);
      alert(`OCR và AI phân tích hoàn thành! Đã xử lý ${results.length} file. Kiểm tra console để xem kết quả.`);

      // Refresh AI summaries to update the UI
      try {
        const updatedSummaries = await getAllAISummaries();
        setAiSummaries(updatedSummaries);
      } catch (refreshError) {
        console.error('Error refreshing AI summaries:', refreshError);
      }

    } catch (error) {
      console.error('Error during OCR process:', error);
      alert('Có lỗi xảy ra trong quá trình OCR');
    } finally {
      setIsOcrLoading(false);
    }
  };

  // Handle Tổng quan button click for IndustryReport data
  const handleTongQuanIndustryReport = async () => {
    try {
      // Get all IndustryReport data
      const allIndustryReportData = industryReports.map(item => item.data).filter(data => data);

      if (allIndustryReportData.length === 0) {
        alert('Không có dữ liệu IndustryReport để phân tích');
        return;
      }

      // Convert data to JSON string for prompt
      const prompt = JSON.stringify(allIndustryReportData, null, 2);
      const systemMessage = `
Bạn sẽ nhận toàn bộ nội dung của một báo cáo dưới dạng văn bản. Hãy đọc và trả về kết quả theo định dạng sau:

[SUMMARY_SHORT]
(Viết đoạn tóm tắt ngắn, 7–10 câu, nêu mục tiêu hoặc nội dung chính của báo cáo.)

[SUMMARY_DETAILED]
(Viết đoạn tổng quan chi tiết hơn, 15–20 câu, phân tích bối cảnh, cách tiếp cận và các kết luận chính, trả về dạng markdown)

Chỉ trả về nội dung theo đúng định dạng trên, không thêm phần thừa. Đảm bảo giữ nguyên nhãn [SUMMARY_SHORT] và [SUMMARY_DETAILED].
`;
      const model = "google/gemini-2.5-pro";

      console.log('Sending IndustryReport data to AI for analysis...');
      console.log('Prompt length:', prompt.length);
      console.log('System message:', systemMessage);
      console.log('Model:', model);

      const response = await aiGen(prompt, systemMessage, model, 'text');

      console.log('AI Response:', response);

      // Parse the result to extract summary1 and summary2
      if (response && response.result) {
        const resultText = response.result;

        // Extract SUMMARY_SHORT section
        const shortMatch = resultText.match(/\[SUMMARY_SHORT\]\s*\n([\s\S]*?)(?=\n\[SUMMARY_DETAILED\]|$)/);
        const summary1 = shortMatch ? shortMatch[1].trim() : '';

        // Extract SUMMARY_DETAILED section
        const detailedMatch = resultText.match(/\[SUMMARY_DETAILED\]\s*\n([\s\S]*?)$/);
        const summary2 = detailedMatch ? detailedMatch[1].trim() : '';

        console.log('Extracted summary1:', summary1);
        console.log('Extracted summary2:', summary2);

        // Save to aiSummary table
        if (summary1 || summary2) {
          const aiSummaryData = {
            summary1: summary1 || null,
            summary2: summary2 || null,
            info: {
              sheetName: 'industry_report',
              numberOfRows: allIndustryReportData.length,
              dataType: 'IndustryReport'
            }
          };

          try {
            const savedSummary = await createAISummary(aiSummaryData);
            console.log('Saved to aiSummary table:', savedSummary);
            alert('Phân tích hoàn thành và đã lưu vào cơ sở dữ liệu!');
          } catch (saveError) {
            console.error('Lỗi khi lưu vào aiSummary table:', saveError);
            alert('Phân tích hoàn thành nhưng có lỗi khi lưu vào cơ sở dữ liệu');
          }
        } else {
          console.warn('Không thể trích xuất summary từ kết quả AI');
          alert('Phân tích hoàn thành nhưng không thể trích xuất nội dung tóm tắt');
        }
      } else {
        console.warn('Response không có result field');
        alert('Phân tích hoàn thành nhưng không nhận được kết quả hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu IndustryReport:', error);
      alert('Có lỗi xảy ra khi phân tích dữ liệu');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
      <h2>Excel Data Fetcher</h2>
      {/*<input*/}
      {/*  type="text"*/}
      {/*  placeholder="Google Drive URL (tùy chọn)"*/}
      {/*  value={googleDriveUrl}*/}
      {/*  onChange={e => setGoogleDriveUrl(e.target.value)}*/}
      {/*  style={{ padding: '8px', fontSize: 16, marginBottom: 16, width: 400 }}*/}
      {/*/>*/}
      {/* <button onClick={handleClick} style={{ padding: '10px 20px', fontSize: 16 }}>
        Fetch Excel Data
      </button> */}
      {/* <h3 style={{ marginTop: 40 }}>Danh sách FinRatio</h3>
      <div style={{ maxWidth: 1200, width: '100%', overflowX: 'auto', marginTop: 16 }}>
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Mã CK</th>
              <th>Ngày</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {finRatios.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
            ) : (
              finRatios.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.data?.["Mã CK"] || ''}</td>
                  <td>{r.data?.["Ngày"] || ''}</td>
                  <td></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div> */}
      <h3 style={{ marginTop: 40 }}>Bảng dữ liệu</h3>
      <Tabs
        activeKey={activeTable}
        onChange={key => { setActiveTable(key); }}
        type="card"
        style={{ maxWidth: 1200, margin: '0 auto 16px', width: '100%' }}
        items={Object.keys(tableLabelMap).map(key => ({
          key,
          label: tableLabelMap[key],
        }))}
      />
      {activeTable === 'fin_ratio' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            fontSize: 16, 
            color: '#666', 
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            Chọn các file để bắt đầu phân tích
          </div>
          {selectedRows.length > 0 && (
            <>
              {/* Custom System Message Input */}
              <div style={{ 
                maxWidth: 800, 
                width: '100%', 
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'left'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#495057' }}>
                  Tùy chỉnh System Message cho AI
                </h4>
                <textarea
                  value={customSystemMessage}
                  onChange={(e) => setCustomSystemMessage(e.target.value)}
                  placeholder="Nhập system message tùy chỉnh cho AI..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  System message này sẽ được sử dụng khi phân tích file qua OCR. Đảm bảo giữ nguyên định dạng [SUMMARY_DETAILED] và [SUMMARY_SHORT].
                </div>
              </div>
              <button
                onClick={handleOcrFile}
                disabled={isOcrLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: 16,
                  backgroundColor: isOcrLoading ? '#d9d9d9' : '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isOcrLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isOcrLoading ? 'Đang phân tích...' : 'Phân tích'}
              </button>
            </>
          )}
        </div>
      )}
      {activeTable === 'company_report' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            fontSize: 16, 
            color: '#666', 
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            Chọn các file để bắt đầu phân tích
          </div>
          {selectedRows.length > 0 && (
            <>
              {/* Custom System Message Input */}
              <div style={{ 
                maxWidth: 800, 
                width: '100%', 
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'left'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#495057' }}>
                  Tùy chỉnh System Message cho AI
                </h4>
                <textarea
                  value={customSystemMessage}
                  onChange={(e) => setCustomSystemMessage(e.target.value)}
                  placeholder="Nhập system message tùy chỉnh cho AI..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  System message này sẽ được sử dụng khi phân tích file qua OCR. Đảm bảo giữ nguyên định dạng [SUMMARY_DETAILED] và [SUMMARY_SHORT].
                </div>
              </div>
              <button
                onClick={handleOcrFile}
                disabled={isOcrLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: 16,
                  backgroundColor: isOcrLoading ? '#d9d9d9' : '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isOcrLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isOcrLoading ? 'Đang phân tích...' : 'OCR File'}
              </button>
            </>
          )}
        </div>
      )}
      {activeTable === 'industry_report' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            fontSize: 16, 
            color: '#666', 
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            Chọn các file để bắt đầu phân tích
          </div>
          {selectedRows.length > 0 && (
            <>
              {/* Custom System Message Input */}
              <div style={{ 
                maxWidth: 800, 
                width: '100%', 
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'left'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#495057' }}>
                  Tùy chỉnh System Message cho AI
                </h4>
                <textarea
                  value={customSystemMessage}
                  onChange={(e) => setCustomSystemMessage(e.target.value)}
                  placeholder="Nhập system message tùy chỉnh cho AI..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  System message này sẽ được sử dụng khi phân tích file qua OCR. Đảm bảo giữ nguyên định dạng [SUMMARY_DETAILED] và [SUMMARY_SHORT].
                </div>
              </div>
              <button
                onClick={handleOcrFile}
                disabled={isOcrLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: 16,
                  backgroundColor: isOcrLoading ? '#d9d9d9' : '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isOcrLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isOcrLoading ? 'Đang phân tích...' : 'OCR File'}
              </button>
            </>
          )}
        </div>
      )}
      {activeTable === 'fin_ratio_nganhang' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            fontSize: 16, 
            color: '#666', 
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            Dữ liệu tỷ lệ tài chính ngân hàng - Chọn các dòng để phân tích
          </div>
          {selectedRows.length > 0 && (
            <>
              {/* Custom System Message Input */}
              <div style={{ 
                maxWidth: 800, 
                width: '100%', 
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'left'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#495057' }}>
                  Tùy chỉnh System Message cho AI
                </h4>
                <textarea
                  value={customSystemMessage}
                  onChange={(e) => setCustomSystemMessage(e.target.value)}
                  placeholder="Nhập system message tùy chỉnh cho AI..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  System message này sẽ được sử dụng khi phân tích dữ liệu tỷ lệ tài chính ngân hàng.
                </div>
              </div>
              <button
                onClick={handleOcrFile}
                disabled={isOcrLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: 16,
                  backgroundColor: isOcrLoading ? '#d9d9d9' : '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isOcrLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isOcrLoading ? 'Đang phân tích...' : 'Phân tích dữ liệu'}
              </button>
            </>
          )}
        </div>
      )}
      {activeTable === 'fin_ratio_baohiem' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            fontSize: 16, 
            color: '#666', 
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            Dữ liệu tỷ lệ tài chính bảo hiểm - Chọn các dòng để phân tích
          </div>
          {selectedRows.length > 0 && (
            <>
              {/* Custom System Message Input */}
              <div style={{ 
                maxWidth: 800, 
                width: '100%', 
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'left'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#495057' }}>
                  Tùy chỉnh System Message cho AI
                </h4>
                <textarea
                  value={customSystemMessage}
                  onChange={(e) => setCustomSystemMessage(e.target.value)}
                  placeholder="Nhập system message tùy chỉnh cho AI..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  System message này sẽ được sử dụng khi phân tích dữ liệu tỷ lệ tài chính bảo hiểm.
                </div>
              </div>
              <button
                onClick={handleOcrFile}
                disabled={isOcrLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: 16,
                  backgroundColor: isOcrLoading ? '#d9d9d9' : '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isOcrLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isOcrLoading ? 'Đang phân tích...' : 'Phân tích dữ liệu'}
              </button>
            </>
          )}
        </div>
      )}
      {activeTable === 'fin_ratio_chungkhoan' && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            fontSize: 16, 
            color: '#666', 
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            Dữ liệu tỷ lệ tài chính chứng khoán - Chọn các dòng để phân tích
          </div>
          {selectedRows.length > 0 && (
            <>
              {/* Custom System Message Input */}
              <div style={{ 
                maxWidth: 800, 
                width: '100%', 
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'left'
              }}>
                <h4 style={{ 
                  marginTop: 0, 
                  marginBottom: '12px', 
                  color: '#495057' 
                }}>
                  Tùy chỉnh System Message cho AI
                </h4>
                <textarea
                  value={customSystemMessage}
                  onChange={(e) => setCustomSystemMessage(e.target.value)}
                  placeholder="Nhập system message tùy chỉnh cho AI..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  System message này sẽ được sử dụng khi phân tích dữ liệu tỷ lệ tài chính chứng khoán.
                </div>
              </div>
              <button
                onClick={handleOcrFile}
                disabled={isOcrLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: 16,
                  backgroundColor: isOcrLoading ? '#d9d9d9' : '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isOcrLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isOcrLoading ? 'Đang phân tích...' : 'Phân tích dữ liệu'}
              </button>
            </>
          )}
        </div>
      )}
      {/* OCR File button for tables without Tổng quan button */}
      {selectedRows.length > 0 && !['fin_ratio', 'company_report', 'industry_report', 'macro_report', 'strategy_report', 'IR_report', 'fin_ratio_nganhang', 'fin_ratio_baohiem', 'fin_ratio_chungkhoan'].includes(activeTable) && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {/* Custom System Message Input */}
          <div style={{ 
            maxWidth: 800, 
            width: '100%', 
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            textAlign: 'left'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#495057' }}>
              Tùy chỉnh System Message cho AI
            </h4>
            <textarea
              value={customSystemMessage}
              onChange={(e) => setCustomSystemMessage(e.target.value)}
              placeholder="Nhập system message tùy chỉnh cho AI..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
            <div style={{ 
              marginTop: '8px', 
              fontSize: '12px', 
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              System message này sẽ được sử dụng khi phân tích file qua OCR. Đảm bảo giữ nguyên định dạng [SUMMARY_DETAILED] và [SUMMARY_SHORT].
            </div>
          </div>
          <button
            onClick={handleOcrFile}
            disabled={isOcrLoading}
            style={{
              padding: '10px 20px',
              fontSize: 16,
              backgroundColor: isOcrLoading ? '#d9d9d9' : '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isOcrLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isOcrLoading ? 'Đang phân tích...' : 'OCR File'}
          </button>
        </div>
      )}
      {selectedRows.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 16, color: '#1677ff', fontWeight: 'bold' }}>
          Đã chọn {selectedRows.length} dòng
        </div>
      )}
      {analyzedItemsMap.size > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 16, color: '#52c41a', fontWeight: 'bold' }}>
          Đã phân tích {analyzedItemsMap.size} dòng
        </div>
      )}
      <div className="ag-theme-alpine" style={{ width: '100%', maxWidth: 1200, height: 500, margin: '0 auto', marginBottom: 16 }}>
        <AgGridReact
          rowData={agGridRows}
          columnDefs={agGridColumns}
          domLayout="autoHeight"
          pagination={true}
          paginationPageSize={20}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          enableFilter={true}
          enableSorting={true}
          enableColResize={true}
          enableRangeSelection={true}
          suppressMenuHide={false}
          floatingFilters={true}
          suppressFilterResetOnNewData={false}
          animateRows={true}
          context={{
            handleOpenSummary: handleOpenSummary
          }}
          onSelectionChanged={(event) => {
            const selectedNodes = event.api.getSelectedNodes();
            const selectedData = selectedNodes.map(node => node.data);
            setSelectedRows(selectedData);
          }}
        />
      </div>


      {filteredUpdateDiffs.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '32px auto', width: '100%' }}>
          <h3>Các thay đổi khi cập nhật dữ liệu:</h3>
          {filteredUpdateDiffs.map(diff => (
            <div key={diff.id} style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8, background: '#fafbfc' }}>
              <div><b>ID:</b> {diff.id} | <b>Mã CK:</b> {diff.maCK} | <b>Ngày:</b> {diff.ngay} | <b>Sheet:</b> {diff.sheet}</div>
              <ul style={{ marginTop: 8 }}>
                {diff.changes.map(change => (
                  <li key={change.field}>
                    <b>{change.field}:</b> <span style={{ color: '#b1143c' }}>{String(change.oldValue)}</span> → <span style={{ color: '#1677ff' }}>{String(change.newValue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Summary Modal */}
      <Modal
        title="Chi tiết AI Summary"
        open={isSummaryModalOpen}
        onCancel={() => setIsSummaryModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsSummaryModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={800}
        centered={true}
      >
        {isLoadingSummary ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Đang tải...</div>
          </div>
        ) : selectedSummary && selectedSummary.summaries ? (
          <div style={{ maxHeight: 600, overflowY: 'auto', fontSize: 15 }}>
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '6px' }}>
              <div><b>Item ID:</b> {selectedSummary.itemId}</div>
              <div><b>Tổng số tóm tắt:</b> {selectedSummary.summaries.length}</div>
            </div>
            
            {selectedSummary.summaries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Không có tóm tắt nào cho item này
              </div>
            ) : (
              selectedSummary.summaries.map((summary, index) => (
                <div key={summary.id} style={{ 
                  marginBottom: '24px', 
                  padding: '16px', 
                  border: '1px solid #e8e8e8', 
                  borderRadius: '8px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ 
                    marginBottom: '12px', 
                    padding: '8px 12px', 
                    backgroundColor: '#1890ff', 
                    color: 'white', 
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    Tóm tắt #{index + 1} (ID: {summary.id})
                  </div>
                  
                  <div><b>Title:</b> {(() => {
                    try {
                      const info = typeof summary.info === 'string' ? JSON.parse(summary.info) : summary.info;
                      return info?.title || '-';
                    } catch {
                      return '-';
                    }
                  })()}</div>
                  
                  <div><b>URLReport:</b> {(() => {
                    try {
                      const info = typeof summary.info === 'string' ? JSON.parse(summary.info) : summary.info;
                      return info?.URLReport ? <a href={info.URLReport} target="_blank" rel="noopener noreferrer">{info.URLReport}</a> : '-';
                    } catch {
                      return '-';
                    }
                  })()}</div>
                  
                  <div style={{ margin: '12px 0' }}><b>Summary:</b><br />
                    <div style={{ background: '#f6f8fa', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap' }}>{summary.summary1 || '-'}</div>
                  </div>
                  
                  <div style={{ margin: '12px 0' }}><b>Detail:</b><br />
                    <div style={{ background: '#f6f8fa', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap' }}>{summary.summary2 || '-'}</div>
                  </div>
                  
                  <div><b>Created At:</b> {summary.created_at ? new Date(summary.created_at).toLocaleString() : '-'}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Không tìm thấy tóm tắt
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExcelData;

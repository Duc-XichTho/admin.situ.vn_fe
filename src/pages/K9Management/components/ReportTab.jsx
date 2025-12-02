import React from 'react';
import { Table } from 'antd';

const ReportTab = ({ 
  aiSummaryData, 
  loading, 
  getAISummaryColumns 
}) => {
  return (
    <Table
      key="ai-summary-table"
      columns={getAISummaryColumns()}
      dataSource={aiSummaryData}
      rowKey="id"
      loading={loading}
      pagination={{
        total: aiSummaryData.length,
        pageSize: 100,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} mục`
      }}
      scroll={{ x: 800 }}
    />
  );
};

export default ReportTab; 
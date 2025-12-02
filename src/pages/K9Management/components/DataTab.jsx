import React from 'react';
import { Table } from 'antd';

const DataTab = ({ 
  data, 
  loading, 
  tableKey, 
  getColumns, 
  selectedRowKeys, 
  setSelectedRowKeys 
}) => {
  return (
    <Table
      key={tableKey}
      columns={getColumns()}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        total: data.length,
        pageSize: 100,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} của ${total} mục`
      }}
      scroll={{ x: 1800 }}
      rowSelection={{
        type: 'checkbox',
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
          setSelectedRowKeys(newSelectedRowKeys);
        },
      }}
    />
  );
};

export default DataTab; 
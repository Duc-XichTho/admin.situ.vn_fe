import React from 'react';
import { Modal } from 'antd';
import TableEditForm from './TableEditForm';

const TableEditModal = ({
  tableModalVisible,
  setTableModalVisible,
  editingTable,
  setEditingTable,
  handleSaveTable,
  generateTableDataStructure
}) => {
  const handleClose = () => {
    setTableModalVisible(false);
    setEditingTable(null);
  };

  return (
    <Modal
      title={editingTable?.id ? "Chỉnh sửa bảng thông số" : "Thêm bảng thông số mới"}
      open={tableModalVisible}
      onCancel={handleClose}
      footer={null}
      width={800}
      centered={true}
      styles={{
        body: {
          height: '60vh',
          overflowY: 'auto',
          padding: '0px'
        }
      }}
    >
      {editingTable && (
        <TableEditForm
          table={editingTable}
          onSave={handleSaveTable}
          onCancel={handleClose}
          generateTableDataStructure={generateTableDataStructure}
        />
      )}
    </Modal>
  );
};

export default TableEditModal; 
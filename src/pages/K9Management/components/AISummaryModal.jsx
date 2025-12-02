import React from 'react';
import { Modal, Button, Table } from 'antd';

const AISummaryModal = ({
  aiSummaryModalVisible,
  setAiSummaryModalVisible,
  aiSummaryData,
  aiSummaryLoading,
  getAISummaryColumns,
  setSelectedAISummary,
  setAISummaryDetailModalVisible
}) => {
  return (
    <Modal
      title="AI Summary"
      open={aiSummaryModalVisible}
      onCancel={() => setAiSummaryModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setAiSummaryModalVisible(false)}>
          Đóng
        </Button>
      ]}
      width={1200}
      centered={true}
    >
      <Table
        columns={getAISummaryColumns()}
        dataSource={aiSummaryData}
        rowKey="id"
        loading={aiSummaryLoading}
        pagination={{
          pageSize: 1000,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} mục`
        }}
        scroll={{ x: 1400, y: 500 }}
        onRow={record => ({
          onClick: () => {
            setSelectedAISummary(record);
            setAISummaryDetailModalVisible(true);
          }
        })}
        style={{ cursor: 'pointer' }}
      />
    </Modal>
  );
};

export default AISummaryModal; 
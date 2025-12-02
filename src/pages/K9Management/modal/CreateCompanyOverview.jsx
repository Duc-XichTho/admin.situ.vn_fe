import { Modal, Input, Button, Spin, Table } from 'antd';
import { SearchOutlined, RobotOutlined } from '@ant-design/icons';

export default function CreateCompanyOverview({ companySummaryModalVisible, setCompanySummaryModalVisible, companySummarySearchTerm, setCompanySummarySearchTerm, companySummaryLoading, companySummaryData, handleCompanySummarySearch, handleCreateCompanySummaryReport }) {
    return (
        <Modal
        title="Tạo tổng quan công ty"
        open={companySummaryModalVisible}
        onCancel={() => setCompanySummaryModalVisible(false)}
        footer={null}
        width={1000}
        centered={true}
      >
        <div style={{ padding: '20px' }}>
          {/* Search Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <Input
                placeholder="Nhập mã chứng khoán (VD: VNM, FPT, VIC...)"
                value={companySummarySearchTerm}
                onChange={(e) => setCompanySummarySearchTerm(e.target.value)}
                onPressEnter={handleCompanySummarySearch}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                onClick={handleCompanySummarySearch}
                loading={companySummaryLoading}
                icon={<SearchOutlined />}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          {/* Results Section */}
          {companySummaryLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>Đang tải dữ liệu...</div>
            </div>
          ) : companySummaryData ? (
            <div>
              {/* Data Summary */}
              <div style={{
                backgroundColor: '#f6f8fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e1e4e8'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#24292e' }}>
                  📊 Dữ liệu tìm thấy cho mã {companySummaryData.searchTerm}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e1e4e8'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#586069', fontSize: '12px' }}>Báo cáo định giá</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#24292e' }}>
                      {companySummaryData.valuationData.length}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e1e4e8'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#586069', fontSize: '12px' }}>Tỷ số tài chính</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#24292e' }}>
                      {companySummaryData.financialRatioData.length}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e1e4e8'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#586069', fontSize: '12px' }}>Thông tin công ty</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#24292e' }}>
                      {companySummaryData.companyInfo ? 'Có' : 'Không có'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              {companySummaryData.companyInfo && (
                <div style={{ marginBottom: '20px', height: '30vh', overflowY: 'scroll' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#24292e' }}>Thông tin công ty</h4>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e1e4e8'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {Object.entries(companySummaryData.companyInfo).map(([key, value]) => (
                        <div key={key}>
                          <div style={{ fontWeight: 'bold', color: '#586069', fontSize: '12px' }}>{key}</div>
                          <div style={{ color: '#24292e' }}>{value || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Valuation Data Preview */}
              {companySummaryData.valuationData.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#24292e' }}>
                    📈 Báo cáo định giá ({companySummaryData.valuationData.length} báo cáo)
                  </h4>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e1e4e8',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <Table
                      dataSource={companySummaryData.valuationData.slice(0, 5)}
                      columns={[
                        { title: 'Nguồn', dataIndex: 'Nguồn', key: 'nguon' },
                        {
                          title: 'Giá mục tiêu',
                          dataIndex: 'Giá mục tiêu (đồng)',
                          key: 'giaMucTieu',
                          render: (value) => value ? value.toLocaleString('vi-VN') + ' VNĐ' : 'N/A'
                        },
                        { title: 'Ngày', dataIndex: 'Ngày công bố', key: 'ngayCongBo' }
                      ]}
                      pagination={false}
                      size="small"
                    />
                    {companySummaryData.valuationData.length > 5 && (
                      <div style={{ textAlign: 'center', marginTop: '8px', color: '#586069', fontSize: '12px' }}>
                        ... và {companySummaryData.valuationData.length - 5} báo cáo khác
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleCreateCompanySummaryReport}
                  disabled={!companySummaryData.hasData}
                  icon={<RobotOutlined />}
                >
                  Thêm vào hàng đợi tạo tổng quan
                </Button>
                {!companySummaryData.hasData && (
                  <div style={{ marginTop: '8px', color: '#ff4d4f', fontSize: '12px' }}>
                    Không có đủ dữ liệu để tạo tổng quan
                  </div>
                )}
                <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                  Bản ghi sẽ được thêm vào hàng đợi và xử lý tự động
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#586069' }}>
              <SearchOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>Nhập mã chứng khoán và nhấn tìm kiếm để bắt đầu</div>
            </div>
          )}
        </div>
      </Modal>
    )
}
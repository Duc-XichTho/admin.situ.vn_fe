import React from 'react';
import { Modal } from 'antd';
import styles from './TermsModal.module.css';

const TermsModal = ({ open, onCancel }) => {
  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <div className={styles.modalTitleMain}>Điều khoản & Dịch vụ</div>
          <div className={styles.modalTitleSub}>AiMBA - Nền tảng kiến thức toàn diện</div>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={600}
      centered
      footer={null}
      className={styles.customModal}
    >
      <div className={styles.termsContent}>
        <div className={styles.termsSection}>
          <h3>1. Điều khoản sử dụng</h3>
          <p>
            Bằng việc đăng ký và sử dụng dịch vụ của AiMBA, bạn đồng ý tuân thủ các điều khoản và điều kiện sau:
          </p>
          <ul>
            <li>Sử dụng dịch vụ một cách hợp pháp và phù hợp với mục đích giáo dục</li>
            <li>Không chia sẻ thông tin đăng nhập với người khác</li>
            <li>Không sử dụng dịch vụ để vi phạm quyền sở hữu trí tuệ</li>
            <li>Không thực hiện các hành vi gây hại đến hệ thống</li>
          </ul>
        </div>

        <div className={styles.termsSection}>
          <h3>2. Quyền riêng tư</h3>
          <p>
            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn:
          </p>
          <ul>
            <li>Thu thập thông tin cần thiết để cung cấp dịch vụ</li>
            <li>Không chia sẻ thông tin cá nhân với bên thứ ba</li>
            <li>Bảo mật thông tin theo tiêu chuẩn quốc tế</li>
            <li>Cho phép bạn kiểm soát thông tin cá nhân</li>
          </ul>
        </div>

        <div className={styles.termsSection}>
          <h3>3. Dịch vụ miễn phí</h3>
          <p>
            AiMBA cung cấp dịch vụ dùng thử miễn phí trong 3 ngày:
          </p>
          <ul>
            <li>Truy cập đầy đủ nội dung kiến thức</li>
            <li>Tham gia các bài tập tình huống</li>
            <li>Sử dụng các tính năng cơ bản</li>
            <li>Hỗ trợ kỹ thuật trong thời gian dùng thử</li>
          </ul>
        </div>

        <div className={styles.termsSection}>
          <h3>4. Trách nhiệm pháp lý</h3>
          <p>
            AiMBA không chịu trách nhiệm về:
          </p>
          <ul>
            <li>Việc sử dụng sai mục đích của người dùng</li>
            <li>Thông tin không chính xác do người dùng cung cấp</li>
            <li>Thiệt hại gián tiếp từ việc sử dụng dịch vụ</li>
            <li>Gián đoạn dịch vụ do lý do khách quan</li>
          </ul>
        </div>

        <div className={styles.termsSection}>
          <h3>5. Thay đổi điều khoản</h3>
          <p>
            Chúng tôi có quyền thay đổi điều khoản này và sẽ thông báo trước cho người dùng.
            Việc tiếp tục sử dụng dịch vụ sau khi thay đổi được coi là đồng ý với điều khoản mới.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TermsModal;


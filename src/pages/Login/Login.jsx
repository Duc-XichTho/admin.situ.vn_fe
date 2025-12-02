import React, { useContext, useEffect, useState } from 'react';
import { Button, Divider, Form, Input, message, Modal, Radio, Checkbox } from 'antd';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserLogin } from '../../apis/userService.jsx';
import { loginWithUsername, registerAccountPublic } from '../../apis/public/publicService.jsx';
import { MyContext } from '../../MyContext.jsx';

export default function Login() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [registerType, setRegisterType] = useState('gmail'); // 'username' hoặc 'gmail'
  const [registerForm] = Form.useForm();
  const [loginForm] = Form.useForm();
  const navigate = useNavigate();
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await getCurrentUserLogin();
      setCurrentUser(data);
      if (data?.id) {
        navigate('/home');
      }
    };
    fetchUser();
  }, []);

  const handleSubmitRegister = async (values) => {
    // Kiểm tra checkbox trước khi submit
    if (!termsAccepted) {
      message.error('Vui lòng đồng ý với Điều khoản & Dịch vụ!');
      return;
    }

    setRegisterLoading(true);

    try {
      // Format dữ liệu theo cấu trúc của UserManagement
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00 hôm nay

      const startDate = today.toISOString();
      const durationDays = 2; // 2 ngày

      // Tính ngày hết hạn: startDate + durationDays - 1 (vì tính theo ngày)
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + durationDays - 1);
      expiryDate.setHours(23, 59, 59, 999); // Kết thúc vào cuối ngày

      const formattedData = {
        name: values.name,
        phone: values.phone,
        ...(registerType === 'gmail' && {
          email: values.gmail,
        }),
        ...(registerType === 'username' && {
          username: values.username,
          password: values.password,
        }),
        info: {
          startDate: startDate,
          durationDays: durationDays,
          expiryDate: expiryDate.toISOString(),
          termsAccepted: termsAccepted || false,
          termsAcceptedDate: termsAccepted ? new Date().toISOString() : null,
        },
        account_type: 'Dùng thử',
      };

      const res = await registerAccountPublic(formattedData);
      if (res.code === 'USER_EXIST') {
        message.error(res.message);
      } else {
        message.success('Tài khoản đã được tạo thành công! Bạn có thể sử dụng ngay từ hôm nay. Đăng nhập để sử dụng');
        setTimeout(() => {
          setIsRegisterModalOpen(false);
          registerForm.resetFields();
          setRegisterType('username');
          setTermsAccepted(false);
        }, 1000);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogin = async (values) => {
    try {
      const response = await loginWithUsername(values.username, values.password);

      if (response.success) {
        message.success('Đăng nhập thành công');
        setCurrentUser(response.user);

        setTimeout(() => {
          navigate('/home');
          setIsLoginModalOpen(false);
          loginForm.resetFields();
        }, 1000);
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      message.error('Đăng nhập thất bại!');
    }
  };


  const handleGmailLogin = () => {
    const currentPath = '/home';
    window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
  };

  return (
    <div className={styles.loginBg}>
      <div className={styles.loginCard}>
        <div className={styles.logoRow}>
          <img src="/AiMBA1.png" alt="" style={{
            width: '180px',
            height: '45px'
          }} />
          {/* <div className={styles.logoText}>AiMBA</div> */}
          <div>
            <div className={styles.brandDesc}>Expert-Grade Knowledge</div>
            <div className={styles.brandDesc}>Situation Training</div>
          </div>
        </div>
        <div className={styles.brandDescSub}>
          Nền tảng kiến thức toàn diện - chuyên sâu về quản trị kinh doanh
        </div>
        <div className={styles.brandDescSub}>
          & ứng dụng luyện tập kỹ năng theo tình huống
        </div>
        <div className={styles.hr} />
        <div className={styles.loginSwitch}>
          Đăng ký <span style={{ color: '#888' }}>--</span> Đăng nhập
        </div>
        <div className={styles.loginActions}>
          <div className={styles.actionBtnWrap}>
            <Button
              type='primary'
              size='large'
              className={styles.redBtn}
              onClick={() => setIsRegisterModalOpen(true)}
              block
            >
              <div className={styles.btnDescInBtn}>
                <span className={styles.btnDesc}>Đăng ký</span>
                <span className={styles.btnDescSmall}>và dùng thử miễn phí</span>
              </div>
            </Button>
          </div>
          <div className={styles.actionBtnWrap}>
            <Button
              size='large'
              className={styles.blackBtn}
              onClick={handleGmailLogin}
              block
            >
              <div className={styles.btnDescInBtn}>
                <span className={styles.btnDesc}>Đăng nhập</span>
                <span className={styles.btnDescSmall}>với Gmail</span>
              </div>
            </Button>
          </div>
          <div className={styles.actionBtnWrap}>
            <Button
              size='large'
              className={styles.blackBtn}
              onClick={() => setIsLoginModalOpen(true)}
              block
            >
              <div className={styles.btnDescInBtn}>
                <span className={styles.btnDesc}>Đăng nhập</span>
                <span className={styles.btnDescSmall}>bằng Username &amp; Password</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Đăng ký */}
      <Modal
        title={
          <div className={styles.modalTitle}>
            <div className={styles.modalTitleMain}>Đăng ký tài khoản mới</div>
            <div className={styles.modalTitleSub}>Chọn cách đăng ký phù hợp với bạn</div>
          </div>
        }
        open={isRegisterModalOpen}
        onCancel={() => {
          setIsRegisterModalOpen(false);
          registerForm.resetFields();
          setRegisterType('username');
          setTermsAccepted(false);
        }}
        footer={
          <div>
            <Checkbox
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            >
              <span className={styles.termsText}>
                Tôi đồng ý với{' '}
                <button
                  type='button'
                  className={styles.termsLink}
                  onClick={() => setIsTermsModalOpen(true)}
                >
                  Điều khoản & Dịch vụ
                </button>
                {' '}của AiMBA
              </span>
            </Checkbox>
            <Button
              type='primary'
              size='large'
              block
              onClick={() => registerForm.submit()}
              loading={registerLoading}
              className={styles.modalSubmitBtn}
              style={{ marginTop: '12px' }}
            >
              {registerType === 'username' ? 'Đăng ký' : 'Đăng ký với Gmail'}
            </Button>
          </div>
        }
        width={480}
        className={styles.customModal}
        centered
      >
        <div className={styles.modalScrollContent}>
          <div className={styles.registerOptions}>
            <Radio.Group
              value={registerType}
              onChange={(e) => setRegisterType(e.target.value)}
              className={styles.radioGroup}
            >  
             <Radio.Button value='gmail' className={styles.radioButton}>
                <div className={styles.radioContent}>
                  <div className={styles.radioTitle}>Gmail</div>
                  <div className={styles.radioDesc}>Đăng ký nhanh với Gmail</div>
                </div>
              </Radio.Button>
              <Radio.Button value='username' className={styles.radioButton}>
                <div className={styles.radioContent}>
                  <div className={styles.radioTitle}>Tài khoản & Mật khẩu</div>
                  <div className={styles.radioDesc}>Đăng ký bằng tài khoản mới</div>
                </div>
              </Radio.Button>
           
            </Radio.Group>
          </div>

          <Divider />

          {registerType === 'username' ? (
            <Form
              layout='vertical'
              className={styles.modalForm}
              form={registerForm}
              onFinish={handleSubmitRegister}
            >
              <Form.Item
                label='Họ tên'
                name='name'
                className={styles.formItem}
                rules={[
                  { required: true, message: 'Vui lòng nhập họ tên!' },
                  { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
                ]}
              >
                <Input size='large' placeholder='Nhập họ tên' />
              </Form.Item>
              <Form.Item
                label='Tài khoản'
                name='username'
                className={styles.formItem}
                rules={[
                  { required: true, message: 'Vui lòng nhập username!' },
                  { min: 3, message: 'Username phải có ít nhất 3 ký tự!' },
                  { max: 20, message: 'Username không được quá 20 ký tự!' },
                ]}
              >
                <Input size='large' placeholder='Nhập username' />
              </Form.Item>
              <Form.Item
                label='Số điện thoại (thông tin đi kèm)'
                name='phone'
                className={styles.formItem}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' },
                ]}
              >
                <Input size='large' placeholder='Nhập số điện thoại' />
              </Form.Item>
              <Form.Item
                label='Mật khẩu'
                name='password'
                className={styles.formItem}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                ]}
              >
                <Input.Password size='large' placeholder='Nhập mật khẩu' />
              </Form.Item>
              <Form.Item
                label='Nhập lại mật khẩu'
                name='confirmPassword'
                className={styles.formItem}
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password size='large' placeholder='Nhập lại mật khẩu' />
              </Form.Item>


            </Form>
          ) : (
            <div className={styles.gmailRegister}>
        
              <Form
                layout='vertical'
                className={styles.modalForm}
                form={registerForm}
                onFinish={handleSubmitRegister}
              >
                <Form.Item
                  label='Họ tên'
                  name='name'
                  className={styles.formItem}
                  rules={[
                    { required: true, message: 'Vui lòng nhập họ tên!' },
                    { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
                  ]}
                >
                  <Input size='large' placeholder='Nhập họ tên' />
                </Form.Item>
                <Form.Item
                  label='Gmail'
                  name='gmail'
                  className={styles.formItem}
                  rules={[
                    { required: true, message: 'Vui lòng nhập Gmail!' },
                    { type: 'email', message: 'Gmail không hợp lệ!' },
                  ]}
                >
                  <Input size='large' placeholder='Nhập Gmail' />
                </Form.Item>
                <Form.Item
                  label='Số điện thoại (thông tin đi kèm)'
                  name='phone'
                  className={styles.formItem}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' },
                  ]}
                >
                  <Input size='large' placeholder='Nhập số điện thoại' />
                </Form.Item>


              </Form>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Đăng nhập Username/Password */}
      <Modal
        title={
          <div className={styles.modalTitle}>
            <div className={styles.modalTitleMain}>Đăng nhập</div>
            <div className={styles.modalTitleSub}>Nhập thông tin để đăng nhập</div>
          </div>
        }
        open={isLoginModalOpen}
        onCancel={() => {
          setIsLoginModalOpen(false);
          loginForm.resetFields();
        }}
        footer={null}
        width={480}
        className={styles.customModal}
        centered
      >
        <Form
          layout='vertical'
          className={styles.modalForm}
          form={loginForm}
          onFinish={handleLogin}
        >
          <Form.Item
            label='Tài khoản'
            name='username'
            className={styles.formItem}
            rules={[
              { required: true, message: 'Vui lòng nhập username!' },
            ]}
          >
            <Input size='large' placeholder='Nhập username' />
          </Form.Item>
          <Form.Item
            label='Mật khẩu'
            name='password'
            className={styles.formItem}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
            ]}
          >
            <Input.Password size='large' placeholder='Nhập mật khẩu' />
          </Form.Item>
          <Button
            type='primary'
            size='large'
            block
            htmlType='submit'
            className={styles.modalSubmitBtn}
            loading={loginMessage}
          >
            Đăng nhập
          </Button>
        </Form>
      </Modal>

      {/* Modal Điều khoản & Dịch vụ */}
      <Modal
        title={
          <div className={styles.modalTitle}>
            <div className={styles.modalTitleMain}>Điều khoản & Dịch vụ</div>
            <div className={styles.modalTitleSub}>AiMBA - Nền tảng kiến thức toàn diện</div>
          </div>
        }
        open={isTermsModalOpen}
        onCancel={() => setIsTermsModalOpen(false)}
        width={600}
        className={styles.customModal}
        centered
        footer={null}
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
              AiMBA cung cấp dịch vụ dùng thử miễn phí trong 2 ngày:
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
    </div>
  );
}

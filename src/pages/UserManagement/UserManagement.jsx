import React, { useState, useEffect, useContext } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Space,
  Card,
  Typography,
  Tag,
  Tooltip,
  Select,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  CrownOutlined,
  ReloadOutlined,
  StarOutlined,
  FireOutlined,
  SearchOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllUser, createUser, updateUser, deleteUser } from '../../apis/userService';
import { getAllUserClass, createUserClass, updateUserClass, deleteUserClass } from '../../apis/userClassService';
import { MyContext } from '../../MyContext';
import styles from './UserManagement.module.css';
import dayjs from 'dayjs';
import { createTimestamp } from "../../generalFunction/format.js";



const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(MyContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectionType] = useState('checkbox');
  const [userClasses, setUserClasses] = useState([]);
  const [userClassListModalVisible, setUserClassListModalVisible] = useState(false);
  const [editingUserClass, setEditingUserClass] = useState(null);
  const [userClassForm] = Form.useForm();
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [accountTypeFilter, setAccountTypeFilter] = useState(null);
  const [paymentHistoryModalVisible, setPaymentHistoryModalVisible] = useState(false);
  const [selectedUserPaymentHistory, setSelectedUserPaymentHistory] = useState(null);

  // Hàm tìm kiếm users
  const handleSearch = (value) => {
    setSearchValue(value);
  };

  // Hàm kiểm tra thời hạn tài khoản
  const checkAccountExpiry = (user) => {
    if (user.isAdmin) return false; // Admin không bị giới hạn thời hạn

    try {
      if (user.info) {
        let infoObj = {};
        if (typeof user.info === 'string') {
          infoObj = JSON.parse(user.info);
        } else if (typeof user.info === 'object') {
          infoObj = user.info;
        }

        const expiryDate = infoObj.expiryDate;
        if (!expiryDate) return false; // Không có thời hạn = không giới hạn

        const now = new Date();
        const expiry = new Date(expiryDate);
        return now > expiry; // Trả về true nếu đã hết hạn
      }
    } catch (error) {
      console.warn('Error checking account expiry:', error);
    }
    return false;
  };

  // Hàm lấy thời hạn kết thúc từ info
  const getExpiryDate = (user) => {
    try {
      if (user.info) {
        let infoObj = {};
        if (typeof user.info === 'string') {
          infoObj = JSON.parse(user.info);
        } else if (typeof user.info === 'object') {
          infoObj = user.info;
        }
        return infoObj.expiryDate;
      }
    } catch (error) {
      console.warn('Error getting expiry date:', error);
    }
    return null;
  };

  // Hàm lấy ngày bắt đầu từ info
  const getStartDate = (user) => {
    try {
      if (user.info) {
        let infoObj = {};
        if (typeof user.info === 'string') {
          infoObj = JSON.parse(user.info);
        } else if (typeof user.info === 'object') {
          infoObj = user.info;
        }
        return infoObj.startDate;
      }
    } catch (error) {
      console.warn('Error getting start date:', error);
    }
    return null;
  };

  // Hàm lấy số ngày từ info
  const getDurationDays = (user) => {
    try {
      if (user.info) {
        let infoObj = {};
        if (typeof user.info === 'string') {
          infoObj = JSON.parse(user.info);
        } else if (typeof user.info === 'object') {
          infoObj = user.info;
        }
        return infoObj.durationDays || 10;
      }
    } catch (error) {
      console.warn('Error getting duration days:', error);
    }
    return 10;
  };

  // Hàm lấy số điện thoại từ user (không còn trong info)
  const getPhone = (user) => {
    return user.phone || '';
  };

  // Hàm lấy ghi chú từ info
  const getNote = (user) => {
    try {
      if (user.info) {
        let infoObj = {};
        if (typeof user.info === 'string') {
          infoObj = JSON.parse(user.info);
        } else if (typeof user.info === 'object') {
          infoObj = user.info;
        }
        return infoObj.note || '';
      }
    } catch (error) {
      console.warn('Error getting note:', error);
    }
    return '';
  };

  // Hàm lấy lịch sử thanh toán từ user
  const getHistoryPayment = (user) => {
    try {
      // Kiểm tra trường historyPayment
      if (user.historyPayment && Array.isArray(user.historyPayment)) {
        return user.historyPayment;
      }
      
      // Kiểm tra trong info object
      if (user.info) {
        let infoObj = {};
        if (typeof user.info === 'string') {
          infoObj = JSON.parse(user.info);
        } else if (typeof user.info === 'object') {
          infoObj = user.info;
        }
        
        if (infoObj.historyPayment && Array.isArray(infoObj.historyPayment)) {
          return infoObj.historyPayment;
        }
      }
    } catch (error) {
      console.warn('Error getting history payment:', error);
    }
    return [];
  };

  // Hàm format thời gian thanh toán
  const formatPaidAt = (paidAt) => {
    if (!paidAt) return 'N/A';
    
    try {
      // Format: "2026-01-04 04:28:05.638000 +00:00"
      // Chuyển sang Date object và format lại
      const date = new Date(paidAt);
      if (isNaN(date.getTime())) {
        return paidAt; // Trả về nguyên bản nếu không parse được
      }
      
      // Format: DD/MM/YYYY HH:mm
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.warn('Error formatting paidAt:', error);
      return paidAt;
    }
  };

  // Hàm kiểm tra user đã được setup thời gian chưa
  const isUserTimeSetup = (user) => {
    if (user.isAdmin) return true; // Admin không cần setup thời gian

    try {
      if (user.info) {
        let infoObj = {};
        if (typeof user.info === 'string') {
          infoObj = JSON.parse(user.info);
        } else if (typeof user.info === 'object') {
          infoObj = user.info;
        }

        // Kiểm tra có đủ thông tin thời gian không
        return !!(infoObj.startDate && infoObj.durationDays && infoObj.expiryDate);
      }
    } catch (error) {
      console.warn('Error checking user time setup:', error);
    }
    return false;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const values = await getAllUser();
      const data = values.result;
      // Đảm bảo data luôn là array
      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data);
      } else if (data && Array.isArray(data.data)) {
        // Nếu API trả về { data: [...] }
        setUsers(data.data);
        setFilteredUsers(data.data);
      } else if (data && Array.isArray(data.users)) {
        // Nếu API trả về { users: [...] }
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        // Fallback: set empty array
        console.warn('API response is not an array:', data);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách người dùng');
      console.error('Error fetching users:', error);
      setUsers([]); // Đảm bảo luôn có array
      setFilteredUsers([]); // Cập nhật filteredUsers
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserClasses();
  }, []);

  const fetchUserClasses = async () => {
    try {
      const classes = await getAllUserClass();
      setUserClasses(classes);
    } catch (error) {
      console.error('Error fetching user classes:', error);
    }
  };

  // Cập nhật filteredUsers khi users, searchValue hoặc accountTypeFilter thay đổi
  useEffect(() => {
    let filtered = [...users];

    // Lọc theo account_type
    if (accountTypeFilter) {
      filtered = filtered.filter(user => user.account_type === accountTypeFilter);
    }

    // Tìm kiếm theo text
    if (searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase().trim();
      filtered = filtered.filter(user => {
        // Tìm kiếm theo tên
        if (user.name && user.name.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Tìm kiếm theo email
        if (user.email && user.email.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Tìm kiếm theo username
        if (user.username && user.username.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Tìm kiếm theo số điện thoại
        if (user.phone && user.phone.includes(searchTerm)) {
          return true;
        }
        return false;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchValue, accountTypeFilter]);

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setSelectedAccountType(null);
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);

    // Lấy user group, level và thời hạn từ info object
    let userGroup = 'normal';
    let userLevel = ['elementary'];
    let startDate = null;
    let durationDays = 10;
    let expiryDate = null;
    let phone = user.phone || ''; // Lấy phone từ user object
    let note = '';
    // Lấy account_type từ cột riêng, không phải từ info
    let accountType = user.account_type || null;

    try {
      if (user.info) {
        if (typeof user.info === 'string') {
          // Nếu info là JSON string, parse để lấy thông tin
          const infoObj = JSON.parse(user.info);
          userGroup = infoObj.userGroup || 'normal';
          userLevel = Array.isArray(infoObj.level) ? infoObj.level : [infoObj.level || 'elementary'];
          startDate = infoObj.startDate || null;
          durationDays = infoObj.durationDays || 10;
          expiryDate = infoObj.expiryDate || null;
          note = infoObj.note || '';
        } else if (typeof user.info === 'object') {
          // Nếu info là object
          userGroup = user.info.userGroup || 'normal';
          userLevel = Array.isArray(user.info.level) ? user.info.level : [user.info.level || 'elementary'];
          startDate = user.info.startDate || null;
          durationDays = user.info.durationDays || 10;
          expiryDate = user.info.expiryDate || null;
          note = user.info.note || '';
        } else {
          // Fallback: coi như là string userGroup
          userGroup = user.info || 'normal';
        }
      }
    } catch (error) {
      // Nếu parse JSON fail, fallback về norma
      userGroup = 'normal';
      userLevel = ['elementary'];
      startDate = null;
      durationDays = 10;
      expiryDate = null;
      note = '';
    }

    form.setFieldsValue({
      name: user.name,
      email: user.email,
      username: user.username || '',
      isAdmin: user.isAdmin,
      userGroup: userGroup,
      level: userLevel,
      startDate: startDate ? dayjs(startDate) : dayjs(),
      durationDays: durationDays,
      expiryDate: expiryDate ? dayjs(expiryDate) : null,
      phone: phone,
      note: note,
      id_user_class: user.id_user_class || [],
      accountType: accountType
    });
    setSelectedAccountType(accountType);
    setModalVisible(true);
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      message.success('Xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi xóa người dùng');
      console.error('Error deleting user:', error);
    }
  };

  // User Class management functions
  const handleAddUserClass = () => {
    setEditingUserClass(null);
    userClassForm.resetFields();
    setUserClassListModalVisible(true);
  };

  const handleEditUserClass = (userClass) => {
    setEditingUserClass(userClass);
    userClassForm.setFieldsValue({
      name: userClass.name
    });
    setUserClassModalVisible(true);
  };

  const handleDeleteUserClass = async (id) => {
    try {
      await deleteUserClass(id);
      message.success('Xóa user class thành công');
      fetchUserClasses();
    } catch (error) {
      message.error('Lỗi khi xóa user class');
      console.error('Error deleting user class:', error);
    }
  };

  const handleSaveUserClass = async () => {
    try {
      const values = await userClassForm.validateFields();

      if (editingUserClass) {
        await updateUserClass(editingUserClass.id, values);
        message.success('Cập nhật user class thành công');
      } else {
        await createUserClass(values);
        message.success('Tạo user class thành công');
      }

      setEditingUserClass(null);
      userClassForm.resetFields();
      fetchUserClasses();
    } catch (error) {
      message.error(editingUserClass ? 'Lỗi khi cập nhật user class' : 'Lỗi khi tạo user class');
      console.error('Error saving user class:', error);
    }
  };

  // Xóa nhiều user cùng lúc
  const handleDeleteMultipleUsers = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một người dùng để xóa');
      return;
    }

    try {
      // Xóa từng user một
      for (const id of selectedRowKeys) {
        await deleteUser(id);
      }

      message.success(`Đã xóa thành công ${selectedRowKeys.length} người dùng`);
      setSelectedRowKeys([]); // Reset selection
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi xóa người dùng');
      console.error('Error deleting multiple users:', error);
    }
  };

  // Xử lý khi chọn/bỏ chọn rows
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: record.id === currentUser?.id, // Không cho chọn chính mình
    }),
  };

  // Kiểm tra email đã tồn tại (không phân biệt hoa thường)
  const checkEmailExists = (email) => {
    if (!email) return false;
    const emailLower = email.toLowerCase();
    return users.some(user => user?.email?.toLowerCase() === emailLower);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log(values);

      // Kiểm tra ít nhất một trong hai trường email hoặc username có giá trị
      const hasEmail = values.email && values.email.trim() !== '';
      const hasUsername = values.username && values.username.trim() !== '';

      if (!hasEmail && !hasUsername) {
        message.error('Vui lòng nhập ít nhất một trong hai trường: Email hoặc Tên đăng nhập');
        return;
      }
      if (editingUser) {
        // Cập nhật user - lưu info dạng object
        // Lấy info cũ để merge với dữ liệu mới
        let existingInfo = {};
        try {
          if (editingUser.info) {
            if (typeof editingUser.info === 'string') {
              existingInfo = JSON.parse(editingUser.info);
            } else if (typeof editingUser.info === 'object') {
              existingInfo = { ...editingUser.info };
            }
          }
        } catch (error) {
          console.warn('Error parsing existing user info:', error);
        }

        // Tính toán expiryDate từ startDate và durationDays
        let startDate;
        let durationDays;
        
        // Nếu có account_type Pro được chọn, dùng thời điểm hiện tại làm mốc và tự động set số ngày
        const accountTypeMap = {
          'Pro 90': 90,
          'Pro 365': 365,
          'Pro 730': 730
        };
        
        if (values.accountType && accountTypeMap[values.accountType]) {
          // Gói Pro: dùng thời điểm hiện tại (khi sửa) làm mốc, tự động set số ngày
          startDate = dayjs(); // Đặt startDate = ngày hiện tại khi sửa
          durationDays = accountTypeMap[values.accountType];
        } else {
          // Dùng thử hoặc không chọn gói: dùng giá trị từ form
          startDate = values.startDate || dayjs();
          durationDays = values.durationDays || 10;
        }
        
        // Tính ngày kết thúc: startDate + durationDays - 1 (vì tính theo ngày)
        // Ví dụ: bắt đầu 3/7, 10 ngày thì hết hạn vào cuối ngày 12/7
        let expiryDate = startDate.add(durationDays - 1, 'day').endOf('day');

        // Xử lý logic password
        const updateData = {
          ...values,
          updated_at: createTimestamp(),
          user_update: currentUser?.email,
          account_type: values.accountType || null, // Lưu vào cột riêng
          info: {
            ...existingInfo, // Giữ lại dữ liệu cũ
            userGroup: values.userGroup || 'normal',
            level: Array.isArray(values.level) ? values.level : [values.level || 'elementary'],
            startDate: startDate.toISOString(),
            durationDays: durationDays,
            expiryDate: expiryDate.toISOString(),
            note: values.note || ''
            // Có thể thêm các trường khác ở đây trong tương lai
            // ví dụ: preferences: {}, settings: {}, etc.
          }
        };

        // Xử lý password: nếu user chưa có password thì gửi "9999", nếu có rồi thì bỏ trường password
        if (!editingUser.password) {
          updateData.password = '9999';
        } else {
          // Nếu user đã có password, không gửi trường password về để giữ nguyên password cũ
          delete updateData.password;
        }

        const res = await updateUser(editingUser.id, updateData);
        if (res.code === 'USER_EXIST') {
          message.warning(res.message);
          return;
        }
        message.success('Cập nhật người dùng thành công');
      } else {
        // Kiểm tra email đã tồn tại khi tạo mới
        if (checkEmailExists(values.email)) {
          message.error('Email này đã tồn tại trong hệ thống!');
          return;
        }

        // Tạo user mới - lưu info dạng object
        // Tính toán expiryDate từ startDate và durationDays
        let startDate;
        let durationDays;
        
        // Nếu có account_type Pro được chọn, luôn dùng thời điểm hiện tại làm mốc
        const accountTypeMap = {
          'Pro 90': 90,
          'Pro 365': 365,
          'Pro 730': 730
        };
        
        if (values.accountType && accountTypeMap[values.accountType]) {
          // Gói Pro: dùng thời điểm hiện tại (khi sửa) làm mốc, tự động set số ngày
          startDate = dayjs(); // Đặt startDate = ngày hiện tại
          durationDays = accountTypeMap[values.accountType];
        } else {
          // Dùng thử hoặc không chọn gói: dùng giá trị từ form
          startDate = values.startDate || dayjs();
          durationDays = values.durationDays || 10;
        }
        
        // Tính ngày kết thúc: startDate + durationDays - 1 (vì tính theo ngày)
        // Ví dụ: bắt đầu 3/7, 10 ngày thì hết hạn vào cuối ngày 12/7
        let expiryDate = startDate.add(durationDays - 1, 'day').endOf('day');

        const createData = {
          ...values,
          created_at: createTimestamp(),
          user_create: currentUser?.email,
          account_type: values.accountType || null, // Lưu vào cột riêng
          info: {
            userGroup: values.userGroup || 'normal',
            level: Array.isArray(values.level) ? values.level : [values.level || 'elementary'],
            startDate: startDate.toISOString(),
            durationDays: durationDays,
            expiryDate: expiryDate.toISOString(),
            note: values.note || ''
            // Có thể thêm các trường khác ở đây trong tương lai
            // ví dụ: preferences: {}, settings: {}, etc.
          }
        };

        const res = await createUser(createData);
        if (res.code === 'USER_EXIST') {
          message.warning(res.message);
          return;
        }
        message.success('Tạo người dùng thành công');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      if (error.errorFields) {
        message.error('Vui lòng kiểm tra lại thông tin');
      } else {
        message.error(editingUser ? 'Lỗi khi cập nhật người dùng' : 'Lỗi khi tạo người dùng');
        console.error('Error saving user:', error);
      }
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
    setSelectedAccountType(null);
  };

  // Hàm lấy user group từ info object
  const getUserGroup = (user) => {
    try {
      if (user.info) {
        if (typeof user.info === 'string') {
          // Thử parse JSON trước
          try {
            const infoObj = JSON.parse(user.info);
            return infoObj.userGroup || 'normal';
          } catch {
            // Nếu không phải JSON, fallback về normal
            return 'normal';
          }
        } else if (typeof user.info === 'object') {
          return user.info.userGroup || 'normal';
        }
      }
    } catch (error) {
      console.warn('Error parsing user info:', error);
    }
    return 'normal';
  };

  // Hàm lấy user level từ info object
  const getUserLevel = (user) => {
    try {
      if (user.info) {
        if (typeof user.info === 'string') {
          // Thử parse JSON trước
          try {
            const infoObj = JSON.parse(user.info);
            return infoObj.level || ['elementary'];
          } catch {
            // Nếu không phải JSON, fallback về elementary
            return ['elementary'];
          }
        } else if (typeof user.info === 'object') {
          return user.info.level || ['elementary'];
        }
      }
    } catch (error) {
      console.warn('Error parsing user info:', error);
    }
    return ['elementary'];
  };

  // Mapping level values to Vietnamese labels
  const getLevelLabel = (level) => {
    const levelMap = {
      'kindergarten': 'Mầm non',
      'elementary': 'Cơ bản',
      'intermediate': 'Trung bình',
      'advanced': 'Nâng cao'
    };
    return levelMap[level] || level;
  };

  // Get level color
  const getLevelColor = (level) => {
    const colorMap = {
      'kindergarten': '#722ed1', // Màu tím cho mầm non
      'elementary': '#52c41a',
      'intermediate': '#fa8c16',
      'advanced': '#f5222d'
    };
    return colorMap[level] || '#1890ff';
  };

  // Hàm render user group tag với màu sắc và icon phù hợp
  const renderUserGroupTag = (userGroup) => {
    switch (userGroup) {
      case 'vip':
        return (
          <Tag
            color='red'
            icon={<StarOutlined />}
          >
            VIP
          </Tag>
        );
      case 'premium':
        return (
          <Tag
            color="orange"
            icon={<FireOutlined />}
          >
            Premium
          </Tag>
        );
      default:
        return (
          <Tag
            color="default"
            icon={<UserOutlined />}
          >
            Thường
          </Tag>
        );
    }
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className={styles.userInfo}>
          <UserOutlined className={styles.userIcon} />
          <span title={text}>{text || 'Chưa có tên'}</span>
        </div>
      ),
    }, 
    // {
    //   title: 'Username',
    //   dataIndex: 'username',
    //   key: 'username',
    //   render: (text) => (
    //     <div className={styles.emailInfo}>
    //       <span>{text}</span>
    //     </div>
    //   ),
    // },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 250,
      key: 'email',
      render: (text) => (
        <div className={styles.emailInfo}>
          <MailOutlined className={styles.emailIcon} />
          <span>{text}</span>
        </div>
      ),
    },

    {
      title: 'Số điện thoại',
      key: 'phone',
      render: (_, record) => {
        const phone = getPhone(record);
        return phone ? (
          <div className={styles.phoneInfo}>
            <span>{phone}</span>
          </div>
        ) : (
          <span style={{ color: '#999', fontStyle: 'italic' }}>Chưa có</span>
        );
      },
    },
    {
      title: 'Vai trò',
      dataIndex: 'isAdmin',
      key: 'isAdmin',
      render: (isAdmin) => (
        <Tag
          color={isAdmin ? 'red' : 'blue'}
          icon={isAdmin ? <CrownOutlined /> : <UserOutlined />}
        >
          {isAdmin ? 'Admin' : 'User'}
        </Tag>
      ),
    },
    {
      title: 'Gói tài khoản',
      dataIndex: 'account_type',
      key: 'account_type',
      render: (accountType) => {
        if (!accountType) {
          return <Tag color="default">Chưa chọn</Tag>;
        }
        const colorMap = {
          'Dùng thử': 'default',
          'Pro 90': 'blue',
          'Pro 365': 'cyan',
          'Pro 730': 'purple',
          'M12': 'cyan',
          'M24': 'purple'
        };
        return (
          <Tag color={colorMap[accountType] || 'default'}>
            {accountType}
          </Tag>
        );
      },
    },
    // {
    //   title: 'Nhóm',
    //   key: 'userGroup',
    //   render: (_, record) => {
    //     const userGroup = getUserGroup(record);
    //     return renderUserGroupTag(userGroup);
    //   },
    // },
    // {
    //   title: 'Cấp độ',
    //   key: 'level',
    //   render: (_, record) => {
    //     const userLevels = getUserLevel(record);
    //     return (
    //         <div>
    //           {userLevels.map((level, index) => (
    //               <Tag
    //                   key={index}
    //                   style={{
    //                     backgroundColor: getLevelColor(level),
    //                     color: 'white',
    //                     border: 'none',
    //                     marginBottom: '2px'
    //                   }}
    //               >
    //                 {getLevelLabel(level)}
    //               </Tag>
    //           ))}
    //         </div>
    //     );
    //   },
    // },
    {
      title: 'Thời hạn',
      key: 'expiryDate',
      render: (_, record) => {
        const expiryDate = getExpiryDate(record);
        const startDate = getStartDate(record);
        const durationDays = getDurationDays(record);
        const isExpired = checkAccountExpiry(record);

        if (record.isAdmin) {
          return <Tag color="green">Không giới hạn</Tag>;
        }

        // Kiểm tra xem user có được setup thời gian chưa
        if (!isUserTimeSetup(record)) {
          return (
            <div>
              <Tag color="orange">Chưa setup thời gian</Tag>
              <br />
              <small style={{ color: '#ff4d4f', fontSize: '11px' }}>
                ⚠️ Cần thiết lập thời hạn sử dụng
              </small>
            </div>
          );
        }

        const endDate = new Date(expiryDate);
        const startDateObj = startDate ? new Date(startDate) : null;
        const now = new Date();
        const timeDiff = endDate - now;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));
        const minutesLeft = Math.ceil(timeDiff / (1000 * 60));

        // Kiểm tra xem user có quyền sử dụng chưa (ngày hiện tại >= ngày bắt đầu)
        const canUseNow = now >= startDateObj;

        let color = 'green';
        let timeDisplay = '';

        if (!canUseNow) {
          // Chưa đến ngày bắt đầu
          const daysUntilStart = Math.ceil((startDateObj - now) / (1000 * 60 * 60 * 24));
          color = 'blue';
          timeDisplay = `Bắt đầu sau ${daysUntilStart} ngày`;
        } else if (isExpired) {
          color = 'red';
          timeDisplay = 'Đã hết hạn';
        } else if (daysLeft <= 1) {
          // Còn 1 ngày hoặc ít hơn - hiển thị thời gian chi tiết
          if (daysLeft === 1) {
            color = 'orange';
            timeDisplay = `${hoursLeft} giờ còn lại`;
          } else {
            color = 'red';
            timeDisplay = `${minutesLeft} phút còn lại`;
          }
        } else if (daysLeft <= 7) {
          color = 'orange';
          timeDisplay = `${daysLeft} ngày còn lại`;
        } else if (daysLeft <= 30) {
          color = 'gold';
          timeDisplay = `${daysLeft} ngày còn lại`;
        } else {
          timeDisplay = `${daysLeft} ngày còn lại`;
        }

        return (
          <div>
            <Tag color={color}>
              {timeDisplay}
            </Tag>
            <br />
            <small style={{ color: '#666' }}>
              Ngày bắt đầu: {startDateObj && `${startDateObj.toLocaleDateString('vi-VN')} ${startDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
            </small>
            <br />
            <small style={{ color: '#999' }}>
              Hết hạn: {endDate.toLocaleDateString('vi-VN')} {daysLeft <= 1 ? endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </small>
          </div>
        );
      },
    },
    {
      title: 'Mã thanh toán',
      key: 'historyPayment',
      width: 150,
      render: (_, record) => {
        const historyPayment = getHistoryPayment(record);
        if (!historyPayment || historyPayment.length === 0) {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>Không có</span>;
        }
        
        return (
          <Button
            type="link"
            onClick={() => {
              setSelectedUserPaymentHistory({
                user: record,
                history: historyPayment
              });
              setPaymentHistoryModalVisible(true);
            }}
            style={{ padding: 0 }}
          >
            <Tag color="blue" style={{ cursor: 'pointer' }}>
              {historyPayment.length} giao dịch
            </Tag>
          </Button>
        );
      },
    },
    {
      title: 'Ghi chú',
      key: 'note',
      render: (_, record) => {
        const note = getNote(record);
        return note ? (
          <Tooltip title={note}>
            <div className={styles.noteInfo}>
              <span>{note.length > 30 ? `${note.substring(0, 30)}...` : note}</span>
            </div>
          </Tooltip>
        ) : (
          <span style={{ color: '#999', fontStyle: 'italic' }}>Không có</span>
        );
      },
    },
    {
      title: 'Người tạo',
      dataIndex: 'user_create',
      key: 'user_create',
      render: (text) => text || 'N/A',
    },
    {
      title: 'User Class',
      key: 'id_user_class',
      render: (_, record) => {
        const classes = record.id_user_class || [];
        if (classes.length === 0) {
          return <Tag>Không có</Tag>;
        }

        const classNames = classes
          .map(id => {
            const userClass = userClasses.find(c => c.id === id);
            return userClass?.name || `Class #${id}`;
          })
          .join(', ');

        return (
          <Tooltip title={classNames}>
            <Tag color="blue">
              {classes.length} nhóm
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDeleteUser([record.id])}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Tooltip title="Xóa">
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={record.id === currentUser?.id} // Không cho xóa chính mình
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {/* Back to Visao Button */}

      <Card>
        <div className={styles.header}>
          <Title level={2}>
            👥 Quản lý người dùng
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate('/home')}
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                borderRadius: '6px',
              }}
            >
              Back to Home
            </Button>
            <Input
              placeholder="Tìm kiếm theo tên, email, username, số điện thoại..."
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Lọc theo gói tài khoản"
              value={accountTypeFilter}
              onChange={setAccountTypeFilter}
              allowClear
              style={{ width: 200 }}
            >
              <Option value="Dùng thử">Dùng thử</Option>
              <Option value="Pro 90">Pro 90</Option>
              <Option value="Pro 365">Pro 365</Option>
              <Option value="Pro 730">Pro 730</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              loading={loading}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<TagsOutlined />}
              onClick={handleAddUserClass}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Quản lý User Class
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddUser}
            >
              Thêm người dùng
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title="Xác nhận xóa nhiều"
                description={`Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} người dùng đã chọn?`}
                onConfirm={handleDeleteMultipleUsers}
                okText="Xóa"
                cancelText="Hủy"
                okType="danger"
              >
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                >
                  Xóa {selectedRowKeys.length} người dùng
                </Button>
              </Popconfirm>
            )}
          </Space>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredUsers || []}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1400, y: 'calc(100vh - 200px)' }}
          size="small"
        />
      </Card>

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingUser ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        width={600}
        style={{ top: 20 }}
        className={styles.modalBodyScroll}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isAdmin: false,
            userGroup: 'normal',
            level: ['elementary'],
            startDate: dayjs(),
            durationDays: 10,
            username: '',
            password: '9999'
          }}
        >
          <Form.Item
            name="name"
            label="Tên người dùng"
            rules={[
              { required: true, message: 'Vui lòng nhập tên người dùng' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên người dùng" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  // Kiểm tra username đã tồn tại (chỉ khi tạo mới)
                  if (!editingUser && users.some(user => user.username === value)) {
                    return Promise.reject(new Error('Tên đăng nhập này đã tồn tại trong hệ thống!'));
                  }

                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="Nhập tên đăng nhập (tùy chọn)" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              extra="Mật khẩu mặc định: 9999"
            >
              <Input.Password
                placeholder="Mật khẩu mặc định: 9999"
                disabled
                value="9999"
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Email không hợp lệ' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  // Kiểm tra email đã tồn tại (chỉ khi tạo mới)
                  if (!editingUser && checkEmailExists(value)) {
                    return Promise.reject(new Error('Email này đã tồn tại trong hệ thống!'));
                  }

                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="Nhập email (tùy chọn)" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, pattern: /^[0-9+\-\s()]*$/, message: 'Số điện thoại không hợp lệ' }
            ]}
          >
            <Input placeholder="Nhập số điện thoại (tùy chọn)" />
          </Form.Item>

          {/*<Form.Item*/}
          {/*    name="userGroup"*/}
          {/*    label="Nhóm người dùng"*/}
          {/*    rules={[*/}
          {/*      { required: true, message: 'Vui lòng chọn nhóm người dùng' }*/}
          {/*    ]}*/}
          {/*>*/}
          {/*  <Select placeholder="Chọn nhóm người dùng">*/}
          {/*    <Option value="normal">*/}
          {/*      <UserOutlined /> Người dùng thường*/}
          {/*    </Option>*/}
          {/*    <Option value="premium">*/}
          {/*      <FireOutlined /> Người dùng Premium*/}
          {/*    </Option>*/}
          {/*    <Option value="vip">*/}
          {/*      <StarOutlined /> Người dùng VIP*/}
          {/*    </Option>*/}
          {/*  </Select>*/}
          {/*</Form.Item>*/}

          {/*<Form.Item*/}
          {/*    name="level"*/}
          {/*    label="Cấp độ người dùng"*/}
          {/*    rules={[*/}
          {/*      { required: true, message: 'Vui lòng chọn ít nhất một cấp độ' },*/}
          {/*      { type: 'array', min: 1, message: 'Vui lòng chọn ít nhất một cấp độ' }*/}
          {/*    ]}*/}
          {/*>*/}
          {/*  <Select*/}
          {/*      mode="multiple"*/}
          {/*      placeholder="Chọn cấp độ người dùng"*/}
          {/*      style={{ width: '100%' }}*/}
          {/*  >*/}
          {/*    <Option value="kindergarten">*/}
          {/*      🟣 Mầm non*/}
          {/*    </Option>*/}
          {/*    <Option value="elementary">*/}
          {/*      🟢 Cơ bản*/}
          {/*    </Option>*/}
          {/*    <Option value="intermediate">*/}
          {/*      🟠 Trung bình*/}
          {/*    </Option>*/}
          {/*    <Option value="advanced">*/}
          {/*      🔴 Nâng cao*/}
          {/*    </Option>*/}
          {/*  </Select>*/}
          {/*</Form.Item>*/}

          <Form.Item
            name="accountType"
            label="Gói tài khoản"
            extra="Chọn gói Pro để tự động tính thời gian hết hạn từ thời điểm hiện tại. Chọn 'Dùng thử' để nhập thủ công."
          >
            <Select
              placeholder="Chọn gói tài khoản (tùy chọn)"
              allowClear
              onChange={(value) => {
                const accountTypeMap = {
                  'Pro 90': 90,
                  'Pro 365': 365,
                  'Pro 730': 820
                };
                // Chỉ tự động tính toán cho các gói Pro
                if (value && accountTypeMap[value]) {
                  // Tự động set startDate = ngày hiện tại và durationDays
                  form.setFieldsValue({
                    startDate: dayjs(),
                    durationDays: accountTypeMap[value],
                    accountType: value
                  });
                  setSelectedAccountType(value);
                } else {
                  // Nếu chọn "Dùng thử" hoặc clear, set thành "Dùng thử" để cho phép custom
                  const finalValue = value || 'Dùng thử';
                  form.setFieldsValue({
                    accountType: finalValue
                  });
                  setSelectedAccountType(finalValue);
                  // Reset durationDays nếu đang clear
                  if (!value) {
                    form.setFieldsValue({
                      durationDays: undefined
                    });
                  }
                }
              }}
            >
              <Option value="Dùng thử">Dùng thử (nhập thủ công)</Option>
              <Option value="Pro 90">Pro 90 (90 ngày)</Option>
              <Option value="Pro 365">Pro 365 (365 ngày)</Option>
              <Option value="Pro 730">Pro 730 (730 ngày)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[
              { required: true, message: 'Vui lòng chọn ngày bắt đầu' }
            ]}
            extra={selectedAccountType && ['Pro 90', 'Pro 365', 'Pro 730'].includes(selectedAccountType) ? 'Tự động đặt bằng thời điểm hiện tại' : ''}
          >
            <DatePicker
              placeholder="Chọn ngày bắt đầu"
              style={{ width: '100%' }}
              showTime={false}
              format="DD/MM/YYYY"
              disabled={selectedAccountType && ['Pro 90', 'Pro 365', 'Pro 730'].includes(selectedAccountType)}
              onChange={(date) => {
                // Nếu user tự chỉnh sửa startDate (không bị disabled), set thành "Dùng thử"
                if (date && (!selectedAccountType || !['Pro 90', 'Pro 365', 'Pro 730'].includes(selectedAccountType))) {
                  form.setFieldsValue({
                    accountType: 'Dùng thử'
                  });
                  setSelectedAccountType('Dùng thử');
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="durationDays"
            label="Số ngày sử dụng"
            rules={[
              { required: true, message: 'Vui lòng nhập số ngày' },
              { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0' }
            ]}
            extra={selectedAccountType && ['Pro 90', 'Pro 365', 'Pro 730'].includes(selectedAccountType) ? 'Tự động tính theo gói đã chọn' : 'Hệ thống sẽ tự động tính ngày kết thúc'}
          >
            <InputNumber
              placeholder="Nhập số ngày (mặc định: 10)"
              style={{ width: '100%' }}
              min={1}
              max={3650}
              disabled={selectedAccountType && ['Pro 90', 'Pro 365', 'Pro 730'].includes(selectedAccountType)}
              parser={(value) => value.replace(/[^\d]/g, '')}
              formatter={(value) => (value ? `${value}` : '')}
              onChange={(value) => {
                // Nếu user tự chỉnh sửa durationDays (không bị disabled), set thành "Dùng thử"
                if (value && (!selectedAccountType || !['Pro 90', 'Pro 365', 'Pro 730'].includes(selectedAccountType))) {
                  form.setFieldsValue({
                    accountType: 'Dùng thử'
                  });
                  setSelectedAccountType('Dùng thử');
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault(); // Chặn phím không phải số
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú"
          >
            <Input.TextArea
              placeholder="Nhập ghi chú về người dùng (tùy chọn)"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="id_user_class"
            label="Nhóm User Class"
            extra="Chọn các nhóm user class cho người dùng (lưu dạng mảng ID)"
          >
            <Select
              mode="multiple"
              placeholder="Chọn nhóm user class"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {userClasses.map(cls => (
                <Option key={cls.id} value={cls.id}>
                  {cls.name || `Class #${cls.id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isAdmin"
            label="Quyền Admin"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Admin"
              unCheckedChildren="User"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* User Class List Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Danh sách User Class</span>
          
          </div>
        }
        open={userClassListModalVisible}
        onCancel={() => {
          setUserClassListModalVisible(false);
          setEditingUserClass(null);
          userClassForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        {/* Create/Edit Form */}
        <div style={{ height: '70vh', overflow: 'auto' }}>

          <Card
            type="inner"
            title={editingUserClass ? 'Chỉnh sửa User Class' : 'Tạo User Class mới'}
            size="small"
            style={{ marginBottom: 16, }}
          >
            <Form
              form={userClassForm}
              layout="vertical"
            >
              <Form.Item
                name="name"
                label="Tên User Class"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên user class' },
                  { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                ]}
              >
                <Input placeholder="Nhập tên user class" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button type="primary" onClick={handleSaveUserClass}>
                    {editingUserClass ? 'Cập nhật' : 'Tạo mới'}
                  </Button>
                  {editingUserClass && (
                    <Button onClick={() => {
                      setEditingUserClass(null);
                      userClassForm.resetFields();
                    }}>
                      Hủy
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Form>
          </Card>

          {/* User Classes List */}
          <Table
            dataSource={userClasses}
            columns={[
              {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                width: 80,
              },
              {
                title: 'Tên',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Thao tác',
                key: 'actions',
                render: (_, record) => (
                  <Space size="middle">
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => handleEditUserClass(record)}
                    >
                      Sửa
                    </Button>
                    <Popconfirm
                      title="Xác nhận xóa"
                      description="Bạn có chắc chắn muốn xóa user class này?"
                      onConfirm={() => handleDeleteUserClass(record.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okType="danger"
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        Xóa
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            rowKey="id"
            pagination={false}
            scroll={{ y: 300 }}
          />
        </div>

      </Modal>

      {/* Payment History Modal */}
      <Modal
        title={
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#1890ff' }}>
              💳 Lịch sử thanh toán
            </div>
            {selectedUserPaymentHistory?.user && (
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <UserOutlined />
                <span>
                  {selectedUserPaymentHistory.user.name || 'Chưa có tên'} 
                  {selectedUserPaymentHistory.user.email && ` (${selectedUserPaymentHistory.user.email})`}
                </span>
              </div>
            )}
          </div>
        }
        open={paymentHistoryModalVisible}
        onCancel={() => {
          setPaymentHistoryModalVisible(false);
          setSelectedUserPaymentHistory(null);
        }}
        footer={[
          <Button 
            key="close" 
            type="primary"
            onClick={() => {
              setPaymentHistoryModalVisible(false);
              setSelectedUserPaymentHistory(null);
            }}
          >
            Đóng
          </Button>
        ]}
        width={1200}
      >
        {selectedUserPaymentHistory?.history && selectedUserPaymentHistory.history.length > 0 ? (
          <div>
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#f0f8ff', 
              borderRadius: '6px',
              border: '1px solid #91d5ff'
            }}>
              <div style={{ fontSize: '14px', color: '#1890ff', fontWeight: 500 }}>
                Tổng số giao dịch: <strong>{selectedUserPaymentHistory.history.length}</strong>
              </div>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table
                dataSource={selectedUserPaymentHistory.history}
                rowKey={(record, index) => index}
                pagination={false}
                size="middle"
                columns={[
                  {
                    title: 'Mã đơn hàng',
                    key: 'orderCode',
                    width: 150,
                    render: (_, record) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag color="blue" style={{ fontSize: '13px', padding: '4px 10px', fontWeight: 600 }}>
                          {record.orderCode || 'Không có mã'}
                        </Tag>
                      </div>
                    ),
                  },
                  {
                    title: 'Trạng thái',
                    key: 'status',
                    width: 120,
                    render: (_, record) => {
                      const statusConfig = {
                        'success': { color: 'green', icon: <CheckCircleOutlined />, text: 'Thành công' },
                        'paid': { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã thanh toán' },
                        'pending': { color: 'orange', icon: <ClockCircleOutlined />, text: 'Đang chờ' },
                        'failed': { color: 'red', icon: <CloseCircleOutlined />, text: 'Thất bại' },
                        'cancelled': { color: 'red', icon: <CloseCircleOutlined />, text: 'Đã hủy' },
                      };
                      const config = statusConfig[record.status] || { color: 'default', icon: null, text: record.status || 'Không xác định' };
                      return (
                        <Tag 
                          color={config.color} 
                          style={{ fontSize: '13px', padding: '4px 10px' }}
                          icon={config.icon}
                        >
                          {config.text}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: 'Số tiền',
                    key: 'amount',
                    width: 150,
                    align: 'right',
                    render: (_, record) => (
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: 600, 
                        color: '#1890ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '6px'
                      }}>
                        <DollarOutlined />
                        <span>{new Intl.NumberFormat('vi-VN').format(record.amount || 0)} đ</span>
                      </div>
                    ),
                  },
                  {
                    title: 'Mô tả',
                    key: 'description',
                    render: (_, record) => (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <FileTextOutlined style={{ color: '#999' }} />
                        <span>{record.description || 'Không có mô tả'}</span>
                      </div>
                    ),
                  },
                  {
                    title: 'Thời gian tạo',
                    key: 'created_at',
                    width: 180,
                    render: (_, record) => (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CalendarOutlined style={{ color: '#999' }} />
                        <span>{record.created_at ? formatPaidAt(record.created_at) : 'Không có'}</span>
                      </div>
                    ),
                  },
                  {
                    title: 'Thời gian thanh toán',
                    key: 'paidAt',
                    width: 180,
                    render: (_, record) => (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CalendarOutlined style={{ color: '#999' }} />
                        <span>{record.paidAt ? formatPaidAt(record.paidAt) : 'Chưa thanh toán'}</span>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#999' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
              Không có lịch sử thanh toán
            </div>
            <div style={{ fontSize: '14px', color: '#bbb' }}>
              Người dùng này chưa có giao dịch thanh toán nào
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement; 
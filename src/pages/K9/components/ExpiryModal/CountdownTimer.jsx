import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Tag, Tooltip } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { MyContext } from '../../../../MyContext';
import styles from './CountdownTimer.module.css';

const CountdownTimer = () => {
  const { currentUser } = useContext(MyContext);
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('active'); // 'active', 'warning', 'expired', 'not_started', 'no_setup'

  // Hàm tính toán thời gian còn lại
  const calculateTimeLeft = useCallback(() => {
    if (!currentUser) {
      setTimeLeft(null);
      setStatus('no_setup');
      return;
    }

    // Admin không cần đếm ngược
    if (currentUser.isAdmin) {
      setTimeLeft(null);
      setStatus('admin');
      return;
    }

    try {
      if (currentUser.info) {
        const userInfo = typeof currentUser.info === 'string' ? JSON.parse(currentUser.info) : currentUser.info;
        
        // Kiểm tra xem user đã được setup thời gian chưa
        if (!userInfo.startDate || !userInfo.durationDays || !userInfo.expiryDate) {
          setStatus('no_setup');
          setTimeLeft(null);
          return;
        }

        const now = new Date();
        const startDate = new Date(userInfo.startDate);
        const expiryDate = new Date(userInfo.expiryDate);

        // Kiểm tra tính hợp lệ của ngày
        if (isNaN(startDate.getTime()) || isNaN(expiryDate.getTime())) {
          setStatus('no_setup');
          setTimeLeft(null);
          return;
        }

        // Nếu chưa đến ngày bắt đầu
        if (now < startDate) {
          const timeUntilStart = startDate - now;
          const daysUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60 * 24));
          setStatus('not_started');
          setTimeLeft({ days: daysUntilStart, hours: 0, minutes: 0 });
          return;
        }

        // Nếu đã hết hạn
        if (now > expiryDate) {
          setStatus('expired');
          setTimeLeft(null);
          return;
        }

        // Tính thời gian còn lại
        const timeRemaining = expiryDate - now;
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        setTimeLeft({ days, hours, minutes });

        // Xác định trạng thái
        if (days <= 0 && hours <= 1) {
          setStatus('warning'); // Còn ít hơn 1 giờ
        } else if (days <= 1) {
          setStatus('warning'); // Còn 1 ngày hoặc ít hơn
        } else {
          setStatus('active');
        }
      } else {
        setStatus('no_setup');
        setTimeLeft(null);
      }
    } catch (error) {
      console.warn('Error calculating time left:', error);
      setStatus('no_setup');
      setTimeLeft(null);
    }
  }, [currentUser]);

  // Cập nhật thời gian khi currentUser thay đổi
  useEffect(() => {
    calculateTimeLeft();
  }, [calculateTimeLeft]);

  // Cập nhật interval thông minh
  useEffect(() => {
    if (!currentUser) return;

    // Tính toán ngay lập tức
    calculateTimeLeft();

    // Cập nhật thời gian thông minh
    let interval;
    if (status === 'warning') {
      // Nếu sắp hết hạn, cập nhật mỗi 15 giây
      interval = setInterval(calculateTimeLeft, 15000);
    } else if (status === 'active') {
      // Nếu đang hoạt động, cập nhật mỗi 30 giây
      interval = setInterval(calculateTimeLeft, 30000);
    } else {
      // Các trường hợp khác cập nhật mỗi phút
      interval = setInterval(calculateTimeLeft, 60000);
    }

    return () => clearInterval(interval);
  }, [currentUser, status, calculateTimeLeft]);



  const getStatusConfig = () => {
    switch (status) {
      case 'admin':
        return {
          color: '#52c41a',
          icon: <ClockCircleOutlined />,
          text: 'Admin',
          tooltip: 'Tài khoản Admin - Không giới hạn thời gian'
        };
      case 'active':
        return {
          color: '#52c41a',
          icon: <ClockCircleOutlined />,
          text: timeLeft ? (timeLeft.days > 0 ? `${timeLeft.days}d ${timeLeft.hours}h` : `${timeLeft.hours}h ${timeLeft.minutes}m`) : '0d 0h',
          tooltip: timeLeft ? (timeLeft.days > 0 ? `Còn ${timeLeft.days} ngày ${timeLeft.hours} giờ sử dụng` : `Còn ${timeLeft.hours} giờ ${timeLeft.minutes} phút sử dụng`) : 'Không có thông tin thời gian'
        };
      case 'warning':
        return {
          color: '#faad14',
          icon: <WarningOutlined />,
          text: timeLeft ? (timeLeft.days > 0 ? `${timeLeft.days}d ${timeLeft.hours}h` : `${timeLeft.hours}h ${timeLeft.minutes}m`) : '0h 0m',
          tooltip: timeLeft ? `Còn ${timeLeft.days > 0 ? `${timeLeft.days} ngày ${timeLeft.hours} giờ` : `${timeLeft.hours} giờ ${timeLeft.minutes} phút`} - Sắp hết hạn!` : 'Không có thông tin thời gian'
        };
      case 'expired':
        return {
          color: '#ff4d4f',
          icon: <ExclamationCircleOutlined />,
          text: 'Hết hạn',
          tooltip: 'Tài khoản đã hết hạn - Vui lòng liên hệ quản trị viên'
        };
      case 'not_started':
        return {
          color: '#1890ff',
          icon: <ClockCircleOutlined />,
          text: timeLeft ? `${timeLeft.days}d` : '0d',
          tooltip: timeLeft ? `Tài khoản sẽ được kích hoạt sau ${timeLeft.days} ngày` : 'Không có thông tin thời gian'
        };
      case 'no_setup':
      default:
        return {
          color: '#faad14',
          icon: <ExclamationCircleOutlined />,
          text: 'Chưa setup',
          tooltip: 'Tài khoản chưa được thiết lập thời gian sử dụng'
        };
    }
  };

  const config = getStatusConfig();

  // Không render nếu không có currentUser
  if (!currentUser) return null;

  // Fallback nếu config không hợp lệ
  if (!config) {
    return (
      <Tooltip title="Không có thông tin thời gian" placement="bottom">
        <Tag
          className={`${styles.countdownTimer} ${styles['status-no_setup']}`}
          color="#faad14"
          icon={<ExclamationCircleOutlined />}
        >
          <span className={styles.timerText}>N/A</span>
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={config.tooltip} placement="bottom">
      <Tag
        className={`${styles.countdownTimer} ${styles[`status-${status}`]}`}
        color={config.color}
        icon={config.icon}
      >
        <span className={styles.timerText}>{config.text}</span>
      </Tag>
    </Tooltip>
  );
};

export default CountdownTimer; 
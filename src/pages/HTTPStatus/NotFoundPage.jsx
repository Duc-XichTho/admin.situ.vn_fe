import css from './common.module.css'
import { useNavigate } from "react-router-dom";
import React from 'react';
import { Button } from 'antd';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className={css.main}>
      <div className={css.img}>
        <img src='/notFound.png' />
      </div>
      <div className={css.button}>
        <Button onClick={handleBack}>Trở lại</Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
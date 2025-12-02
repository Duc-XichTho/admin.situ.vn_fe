import React, { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { getCurrentUserLogin } from "./../apis/userService";

const fetchCurrentUserLogin = async () => {
  const { data, error } = await getCurrentUserLogin();
  if (error) {
    return null;
  }
  return data;
};

const PublicRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await fetchCurrentUserLogin();
      setCurrentUser(user);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return currentUser?.email ? <Navigate to="/visao" replace /> : <Outlet />;
};

export default PublicRoute;

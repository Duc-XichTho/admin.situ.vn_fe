// AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import React, { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { MyContext } from '../MyContext.jsx';
import { getCurrentUserLogin } from '../apis/userService.jsx';

export default function AdminRoute({ children }) {
	const { currentUser , setCurrentUser } = useContext(MyContext);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchUser = async () => {
			const { data, error } = await getCurrentUserLogin();
			setCurrentUser(data);
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

	if (!currentUser || !currentUser.isAdmin) {
		return <Navigate to="/login" replace />;
	} else if (currentUser?.isAdmin) {
		return <Outlet />;

	}

	return children;
}

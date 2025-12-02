import { useEffect, useState, useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { getCurrentUserLogin } from "../apis/userService";
import NotAuthorized from "../pages/HTTPStatus/NotAuthorized.jsx";
import { MyContext } from '../MyContext';

const AuthRouteAdmin = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState(null);
	const location = useLocation();

	const fetchCurrentUserLogin = async () => {
		setIsLoading(true);
		try {
			const { data } = await getCurrentUserLogin();
			if (data) {
				setCurrentUser(data);
			}
		} catch (error) {
			console.error('Error fetching current user:', error);
		} finally {
			setTimeout(() => {
				setIsLoading(false);
			}, 500);
		}
	};

	useEffect(() => {
		fetchCurrentUserLogin();
	}, []);

	if (isLoading) {
		return (
			<div
				style={{
					width: '100vw',
					height: '100vh',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Spin size='large' />
			</div>
		);
	}

	// Kiểm tra đăng nhập
	if (!currentUser?.email) {
		return <Navigate to='/' replace />;
	}

	// Kiểm tra quyền Admin
	if (!currentUser.isAdmin) {
		return <NotAuthorized />;
	}

	return (
		<div className='zoomIn'>
			<Outlet />
		</div>
	);
};

export default AuthRouteAdmin; 
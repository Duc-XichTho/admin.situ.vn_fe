import { Spin } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUserLogin } from '../apis/userService.jsx';
import { MyContext } from '../MyContext.jsx';

const AuthRoute = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [currentUserData, setCurrentUserData] = useState(null);
	const {currentUser, setCurrentUser} = useContext(MyContext);

	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		const fetchUser = async () => {
			const { data } = await getCurrentUserLogin();
			setCurrentUserData(data);
			if (data?.id) {
				setCurrentUser(data);
				const timeout = setTimeout(() => {
					setIsLoading(false);
				}, 1000);

				return () => clearTimeout(timeout);
			} else {
				navigate('/');
			}
		};
		fetchUser();
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

	if (!currentUserData?.id) {
		const isFormTemplateRoute = /^\/form-template\/\d+$/.test(location.pathname);

		if (isFormTemplateRoute) {
			return <Navigate to={location.pathname} replace />;
		} else {
			return <Navigate to='/' replace />;
		}
	}

	return (
		<div className='zoomIn'>
			<Outlet />
		</div>
	);
};

export default AuthRoute;
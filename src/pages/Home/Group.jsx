import React, { useContext, useEffect, useState } from 'react';
import css from './Home.module.css';
import { Button, Form, Input, message, Modal, Typography } from 'antd';
import {
	createNewRequestPagePublic,
	getNoteChartDataPublic,
	sendRequestEmailPublic,
	getPageDataByPathPublic,
	getSettingByTypePublic,
	createNewSettingPublic,
} from '../../apis/public/publicService';
import { getContentPageDataById } from '../../apis/contentPageService.jsx';
import TipTapHome from '../PageViewer/SectionPageDetail/TipTap/TipTapHome.jsx';
import TipTapGroup from '../PageViewer/SectionPageDetail/TipTap/TipTapGroup.jsx';
import { logout } from '../../apis/userService';
import { LogIn, LogOut } from 'lucide-react';
import { MyContext } from '../../MyContext.jsx';
import { createTimestamp } from '../../generalFunction/format.js';
import { getAllPageSectionDataShare } from '../../apis/pageSectionService';
import { Card, Col, Row, Space } from 'antd';
import { Home_Icon } from '../../icon/IconSvg.jsx';
import { FileOutlined, FolderOutlined, FilterOutlined } from '@ant-design/icons';
const { TextArea } = Input;
const { Text, Title } = Typography;


export default function Home() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [dataTiptap, setDataTiptap] = useState(null);
	const { currentUser } = useContext(MyContext);
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);
	const [sharedData, setSharedData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [itemContents, setItemContents] = useState({});
	const [themeColor, setThemeColor] = useState('#b1143c');
	const [settingTheme, setSettingTheme] = useState(null);
	const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
	const [selectedTab, setSelectedTab] = useState('group');
	const showModal = () => setIsModalOpen(true);
	const handleCancel = () => {
		form.resetFields();
		setIsModalOpen(false);
	};
	const [tag1Filter, setTag1Filter] = useState(null);
	const [tag2Filter, setTag2Filter] = useState(null);
	const tag1List = Array.from(new Set(sharedData.map(item => item.tag1).filter(Boolean)));
	const tag2List = Array.from(new Set(sharedData.map(item => item.tag2).filter(Boolean)));
	const handleFilterByTag1 = (tagValue) => {
		setTag1Filter(tagValue);
	};
	const filteredData = sharedData.filter(item => {
		const tag1Match = tag1Filter ? item.tag1 === tag1Filter : true;
		const tag2Match = tag2Filter ? item.tag2 === tag2Filter : true;
		return tag1Match && tag2Match;
	});

	const fetchData = async () => {
		const data = await getNoteChartDataPublic(`Group`);
		if (data.length > 0) {
			const newNote = data.find(e => e.chartTitle == `Group`);
			setDataTiptap(newNote);
		}
		const result = await getAllPageSectionDataShare();
		setSharedData(result);
		const contents = {};
		for (const item of result) {
			contents[item.id] = item.contentPage || '';
		}
		setItemContents(contents);
		console.log('Fetched contents:', contents);
	};

	useEffect(() => {
		const fetchContents = async () => {
			const contents = {};
			for (const item of sharedData) {
				// Replace with your actual API call to fetch content by id
				const content = await  getContentPageDataById(item.id); // or another function if needed
				contents[item.id] = content?.content_page || '';
			}

		};
		if (sharedData.length > 0) fetchContents();
	}, [sharedData]);

	useEffect(() => {
		fetchData();
	}, []);

	function formatDateDDMMYYYY(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	}

	const fetchDataColor = async () => {
		try {
			let data = await getSettingByTypePublic('settingTheme');

			if (!data) {
				const defaultSetting = {type: 'settingTheme', setting: {themeColor: '#b1143c'}};
				data = await createNewSettingPublic(defaultSetting);
			}
			setThemeColor(data.setting.themeColor);
			setSettingTheme(data); // Save for update
		} catch (error) {
			console.error('Error fetching theme color:', error);
		}
	};

	useEffect(() => {
		fetchDataColor();
	}, []);




	const handleLogin = () => {
		const currentPath = window.location.pathname + window.location.search;
		window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
	};

	const handleLogout = async () => {
		await logout();
		window.location.href = '/';
	};

	const [isMobile, setIsMobile] = useState(false);



	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleSubmit = async (values) => {
		try {
			setSubmitting(true);

			// Check if the website path is already used by trying to fetch a page with that path
			try {
				const existingPage = await getPageDataByPathPublic(values.websitePath);
				if (existingPage && Object.keys(existingPage).length > 0) {
					message.error('Đường dẫn này đã được sử dụng. Vui lòng chọn đường dẫn khác.');
					setSubmitting(false);
					return;
				}
			} catch (error) {
				// If the API returns an error (404), it means the path is available
				// Continue with form submission
			}

			const formattedValues = {
				website_name: values.websiteName,
				website_path: values.websitePath,
				email: values.email,
				phone: values.phone,
				purpose: values.purpose,
				created_at: createTimestamp(),
				status: 'pendding',
			};

			const result = await sendRequestEmailPublic(formattedValues);
			const data = await createNewRequestPagePublic(formattedValues);
			if (result.success) {
				message.success('Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn qua email.');
				handleCancel();
			} else {
				message.error(result.error);
			}
		} catch (error) {
			message.error('Có lỗi xảy ra khi đăng ký');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className={css.homeContainer}>
			<div className={css.homeHeader} style={{ backgroundColor: '#f5f5f5' }}>
				<Home_Icon style={{ marginRight: 8 }} />
				<span className={css.logo}>HONGKY.INFO</span>
				{!isMobile && (
					<nav className={css.homeNav}>
				  <span
					  style={{
						  fontSize: 22,
						  cursor: 'pointer',
						  fontWeight: selectedTab === 'personal' ? 'bold' : 'normal'
					  }}
					  onClick={() => {
						  setSelectedTab('personal');
						  window.location.href = '/';
					  }}
				  >
					Giới thiệu trang cá nhân
				  </span>
						<span
							style={{
								fontSize: 22,
								cursor: 'pointer',
								fontWeight: selectedTab === 'group' ? 'bold' : 'normal'
							}}
							onClick={() => {
								setSelectedTab('group');
								window.location.href = '/group';
							}}
						>
						Giới thiệu trang nhóm
					  </span>
						<span className={css.registerLink} onClick={showModal}>
						Đăng ký tạo trang
					  </span>
					</nav>
				)}
				<div className={css.authButton} onClick={currentUser?.email ? handleLogout : handleLogin}>
					{currentUser?.email ? (
						<>
							<div style={{ marginRight: 15 }}>
								<span>{currentUser.name}</span>
							</div>
							<LogOut size={20} />
							<span>Đăng xuất</span>
						</>
					) : (
						<>
							<LogIn size={20} />
							<span>Đăng nhập</span>
						</>
					)}
				</div>
			</div>

			{isMobile && (
				<div className={css.mobileNavRow}>
					<span className={css.mobileNavItem} onClick={() => window.location.href = '/'}>Home</span>
					<div className={css.mobileDivider} />
					<span className={`${css.mobileNavItem} ${css.registerLink}`} onClick={showModal}>
						Đăng ký tạo trang
					</span>
				</div>
			)}

			<div className={css.homeBody} style={{ height: isMobile ? '83%' : '90%' }}>
				<div className={css.homeBodyContent} style={{ display: 'flex', height: '100%' }}>
					<TipTapGroup dataTiptap={dataTiptap}/>

					{/*<div style={{*/}
					{/*	width: '66%',*/}
					{/*	padding: '40px 20px',*/}
					{/*	height: '100%',*/}
					{/*	display: 'flex',*/}
					{/*	flexDirection: 'column',*/}
					{/*}}>*/}
					{/*	<div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 100 }}>*/}
					{/*		<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>*/}
					{/*			<span>Các chủ đề</span>*/}
					{/*			{tag1List.map(tag => (*/}
					{/*				<Button*/}
					{/*					key={tag}*/}
					{/*					type={tag1Filter === tag ? 'primary' : 'default'}*/}
					{/*					onClick={() => setTag1Filter(tag1Filter === tag ? null : tag)}*/}
					{/*					className={css.tag1}*/}
					{/*				>*/}
					{/*					{tag}*/}
					{/*				</Button>*/}
					{/*			))}*/}
					{/*		</div>*/}
					{/*		<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>*/}
					{/*			<span>Phù hợp</span>*/}
					{/*			{tag2List.map(tag => (*/}
					{/*				<Button*/}
					{/*					key={tag}*/}
					{/*					type={tag2Filter === tag ? 'primary' : 'default'}*/}
					{/*					onClick={() => setTag2Filter(tag2Filter === tag ? null : tag)}*/}
					{/*					className={css.tag2}*/}
					{/*				>*/}
					{/*					{tag}*/}
					{/*				</Button>*/}
					{/*			))}*/}
					{/*		</div>*/}
					{/*	</div>*/}


					{/*	<div style={{*/}
					{/*		overflowY: 'auto',*/}
					{/*		height: '100%',*/}
					{/*		padding: '5 20px',*/}
					{/*	}}>*/}
					{/*		<Row gutter={[24, 24]}>*/}
					{/*			{filteredData.map((item) => (*/}
					{/*				<Col xs={24} sm={24} md={24} lg={24} key={item.id}>*/}
					{/*					<Card*/}
					{/*						hoverable*/}
					{/*						// onClick={() => window.location.href = `/shared/${item.id}`}*/}
					{/*						style={{*/}
					{/*							width: '100%',  // Ensure card takes full column width*/}
					{/*							// boxShadow: '0 2px 8px rgba(0,0,0,0.09)'*/}
					{/*						}}*/}
					{/*						// actions={[*/}
					{/*						// 	<div style={{ fontSize: '12px', color: '#999', padding: '0 25px', display: 'flex', justifyContent: 'space-between' }}>*/}
					{/*						// 		<div>Icon</div>*/}
					{/*						//*/}
					{/*						// 	</div>*/}
					{/*						// ]}*/}
					{/*					>*/}
					{/*						<Card.Meta*/}
					{/*							title={*/}
					{/*								<div style={{ display: 'flex', alignItems: 'center' }}>*/}
					{/*									<div className={css.itemBox}></div>*/}
					{/*									<div style={{*/}
					{/*										marginLeft: '20px',*/}
					{/*										display: 'flex',*/}
					{/*										flexDirection: 'column',*/}
					{/*									}}>*/}
					{/*										<div>{item.name}</div>*/}
					{/*										/!*<div style={{ fontSize: '12px', color: '#fff', backgroundColor: '#F15C86', padding: '5px', borderRadius: '10px' }}>*!/*/}
					{/*										/!*	Update*!/*/}
					{/*										/!*</div>*!/*/}
					{/*										<div style={{ display: 'flex', gap: '14px' }}>*/}
					{/*											{item.tag1 &&*/}
					{/*												<div className={css.tag1}>{item.tag1}</div>}*/}
					{/*											{item.tag2 &&*/}
					{/*												<div className={css.tag2}>{item.tag2}</div>}*/}
					{/*										</div>*/}
					{/*									</div>*/}
					{/*								</div>*/}
					{/*							}*/}
					{/*							// description={*/}
					{/*							// 	<Space direction="vertical" size={0}>*/}
					{/*							// 		<Text type="secondary">Type: {item.type}</Text>*/}
					{/*							// 	</Space>*/}
					{/*							// }*/}
					{/*						/>*/}
					{/*					</Card>*/}
					{/*					<div style={{ marginLeft: '40px' }} className={css.card}>*/}
					{/*						{Array.isArray(itemContents[item.id])*/}
					{/*							? itemContents[item.id].map((content, idx) => (*/}
					{/*								<div key={idx} className={css.content}>*/}
					{/*									<div style={{ display: 'flex', alignItems: 'flex-start' }}>*/}
					{/*										<div style={{ width: 36, height: 36 }}*/}
					{/*											 className={css.itemBox}></div>*/}
					{/*										<div style={{ marginLeft: 20, flex: 1 }}>*/}
					{/*											<div style={{*/}
					{/*												display: 'flex',*/}
					{/*												justifyContent: 'space-between',*/}
					{/*												alignItems: 'center',*/}
					{/*											}}>*/}
					{/*												<div style={{*/}
					{/*													display: 'flex',*/}
					{/*													alignItems: 'center',*/}
					{/*													gap: 8,*/}
					{/*												}}>*/}

					{/*													<div className={css.title}>{content.name}</div>*/}
					{/*												</div>*/}


					{/*												<div className={css.update}>*/}
					{/*													<svg width="13" height="13" viewBox="0 0 13 13"*/}
					{/*														 fill="none"*/}
					{/*														 xmlns="http://www.w3.org/2000/svg" style={{*/}
					{/*														marginRight: 6,*/}
					{/*														verticalAlign: 'middle',*/}
					{/*													}}>*/}
					{/*														<path fill-rule="evenodd"*/}
					{/*															  clip-rule="evenodd"*/}
					{/*															  d="M1.06333 0.00998794C0.959569 0.0249634 0.765462 0.0845339 0.683572 0.126545C0.499546 0.220944 0.322812 0.38077 0.200431 0.563474C0.115351 0.690503 0.0777062 0.776861 0.0297457 0.955061L0 1.06558V5.69362V10.3217L0.0305467 10.4362C0.154611 10.9013 0.491688 11.2362 0.954556 11.3542L1.07714 11.3854H2.61C3.81418 11.3854 4.15531 11.3816 4.20097 11.3678C4.31759 11.3324 4.45192 11.197 4.48231 11.0844C4.50917 10.9848 4.50127 10.8628 4.46247 10.778C4.41678 10.6782 4.32095 10.5864 4.22479 10.5504C4.14972 10.5223 4.12946 10.522 2.67413 10.522C1.01717 10.522 1.10654 10.5273 0.991814 10.4215C0.957718 10.3901 0.916359 10.3392 0.899912 10.3085L0.87 10.2526V5.69362V1.13466L0.900533 1.07755C0.939407 1.00482 1.0026 0.941605 1.07529 0.902716L1.13238 0.872171L4.08022 0.868593C6.77107 0.865318 7.03413 0.866976 7.0976 0.887492C7.16155 0.908159 7.234 0.976695 7.99859 1.73985C8.68364 2.42361 8.83561 2.58204 8.86168 2.63965C8.89311 2.70909 8.89338 2.71465 8.90024 3.45558C8.9071 4.19695 8.90734 4.20195 8.9383 4.25992C9.03334 4.43785 9.20966 4.52687 9.406 4.49606C9.53776 4.4754 9.65141 4.39057 9.71725 4.26376L9.74953 4.20159L9.75342 3.42795C9.7577 2.57702 9.75526 2.54372 9.67269 2.32953C9.58722 2.10782 9.5501 2.06532 8.66694 1.17802C8.21422 0.723176 7.79816 0.314264 7.74235 0.269338C7.62036 0.171099 7.43063 0.0762863 7.27072 0.0336393L7.15334 0.00233441L4.14976 0.000193085C2.4978 -0.000995008 1.10891 0.0034258 1.06333 0.00998794ZM1.90571 3.2598C1.79807 3.30203 1.70637 3.38108 1.65921 3.4723C1.62325 3.54186 1.60856 3.6605 1.62462 3.75167C1.65028 3.89737 1.78295 4.04453 1.92398 4.08371C1.9578 4.09312 2.94673 4.09786 4.8846 4.0979C7.77478 4.09798 7.79495 4.09779 7.86934 4.06995C7.96955 4.03244 8.0752 3.92674 8.1127 3.8265C8.1929 3.61204 8.09509 3.37162 7.88851 3.27541L7.81619 3.24173L4.88167 3.24264C2.66674 3.24333 1.93698 3.24754 1.90571 3.2598ZM1.96675 5.67303C1.83515 5.69532 1.70592 5.79874 1.64937 5.92702C1.60577 6.02593 1.60798 6.17031 1.65466 6.2723C1.70092 6.37339 1.7963 6.46483 1.89338 6.50116C1.96965 6.52971 1.97835 6.52983 3.68477 6.52618L5.39952 6.52252L5.46436 6.49057C5.5431 6.45177 5.63331 6.36404 5.67222 6.28837C5.71239 6.21025 5.72136 6.04507 5.69045 5.952C5.66316 5.86982 5.57868 5.76873 5.49828 5.72209C5.46675 5.7038 5.40408 5.68215 5.35901 5.67396C5.26317 5.65655 2.06925 5.65568 1.96675 5.67303ZM9.135 5.66774C8.19954 5.72865 7.38829 6.09256 6.73829 6.7428C6.1862 7.29513 5.86087 7.9211 5.71524 8.71129C5.67266 8.94234 5.65597 9.43184 5.68129 9.70689C5.7546 10.503 6.11446 11.2808 6.68381 11.8736C7.27664 12.4909 8.04321 12.8734 8.90714 12.9831C9.10586 13.0083 9.58703 13.0047 9.79362 12.9764C10.489 12.8812 11.1039 12.6166 11.6489 12.178C11.9005 11.9755 12.1997 11.6521 12.2608 11.5167C12.2814 11.4711 12.2885 11.4273 12.2877 11.3525C12.2848 11.0966 12.0775 10.9058 11.8256 10.9269C11.6925 10.9381 11.6136 10.9848 11.4842 11.1293C11.1808 11.4678 10.9137 11.6763 10.5628 11.8486C9.68864 12.2779 8.66421 12.224 7.83691 11.7051C7.59784 11.5552 7.30645 11.2944 7.13999 11.0814C6.73359 10.5614 6.5332 9.98431 6.5332 9.33388C6.5332 8.91527 6.5974 8.60468 6.76454 8.21486C7.32718 6.90256 8.83036 6.22362 10.1883 6.66844C10.8663 6.8905 11.417 7.33956 11.7713 7.95929L11.8424 8.08362L11.1412 8.09053L10.44 8.09744L10.3672 8.13034C10.2758 8.17166 10.1678 8.28709 10.1377 8.37571C10.1093 8.45902 10.1093 8.59239 10.1377 8.67569C10.1678 8.76432 10.2758 8.87974 10.3672 8.92106L10.44 8.95397L11.5033 8.95818C12.244 8.96111 12.5918 8.95771 12.6495 8.94698C12.8152 8.91616 12.9551 8.77582 12.9873 8.60821C12.9987 8.54887 13.0019 8.17082 12.9989 7.26163L12.9948 5.99755L12.9587 5.92157C12.8826 5.76142 12.7415 5.67019 12.5681 5.66907C12.397 5.66796 12.2541 5.75742 12.173 5.91635L12.1386 5.98374L12.1343 6.47055L12.1301 6.95738L11.9694 6.79067C11.3797 6.17879 10.6258 5.79993 9.78941 5.69519C9.61922 5.67388 9.26741 5.65912 9.135 5.66774ZM1.93333 8.10903C1.61584 8.20167 1.51044 8.59686 1.74156 8.82807C1.77109 8.85761 1.82942 8.89802 1.87119 8.91787L1.94714 8.95397H3.05881H4.17048L4.24643 8.91787C4.40766 8.84125 4.49807 8.70034 4.49807 8.5257C4.49807 8.35107 4.40766 8.21015 4.24643 8.13353L4.17048 8.09744L3.07952 8.09517C2.2831 8.09353 1.97366 8.09727 1.93333 8.10903Z"*/}
					{/*															  fill="#454545" />*/}
					{/*													</svg>*/}
					{/*													{content.updated_at*/}
					{/*														? `Updated: ${formatDateDDMMYYYY(content.updated_at)}`*/}
					{/*														: ''}*/}
					{/*												</div>*/}
					{/*											</div>*/}
					{/*											<div className={css.desc}*/}
					{/*												 dangerouslySetInnerHTML={{ __html: content.content }} />*/}
					{/*										</div>*/}
					{/*									</div>*/}
					{/*								</div>*/}
					{/*							))*/}
					{/*							: <span style={{ color: '#aaa' }}>No content</span>*/}
					{/*						}*/}
					{/*					</div>*/}
					{/*				</Col>*/}
					{/*			))}*/}

					{/*			{sharedData.length === 0 && (*/}
					{/*				<Col span={24}>*/}
					{/*					<div style={{*/}
					{/*						textAlign: 'center',*/}
					{/*						padding: '40px 0',*/}
					{/*						background: '#f6f6f6',*/}
					{/*						borderRadius: 8,*/}
					{/*					}}>*/}
					{/*						No shared content available*/}
					{/*					</div>*/}
					{/*				</Col>*/}
					{/*			)}*/}
					{/*		</Row>*/}
					{/*	</div>*/}
					{/*</div>*/}
				</div>
			</div>
			<Modal
				title={
					<div className={css.modalTitle}>
						<h2>Đăng ký tạo trang </h2>
						<p>Điền thông tin chi tiết để chúng tôi có thể tạo trang web phù hợp nhất cho bạn</p>
					</div>
				}
				open={isModalOpen}
				onCancel={handleCancel}
				footer={null}
				width={800}
				centered
			>
				<div className={css.modalForm}>
					<Form
						form={form}
						layout='vertical'
						onFinish={handleSubmit}
						requiredMark='optional'
					>
						<div className={css.formSection}>
							<Text strong className={css.sectionTitle}>Thông tin trang</Text>
							<Form.Item
								label='Tên trang'
								name='websiteName'
								rules={[
									{ required: true, message: 'Vui lòng nhập tên trang' },
									{ min: 3, message: 'Tên trang phải có ít nhất 3 ký tự' },
								]}
							>
								<Input placeholder='VD: Xích Thố Truyền Thông' />
							</Form.Item>

							<Form.Item
								label='Đường dẫn trang'
								name='websitePath'
								rules={[
									{ required: true, message: 'Vui lòng nhập đường dẫn trang' },
									{
										pattern: /^[a-z0-9-]+$/,
										message: 'Chỉ được sử dụng chữ thường, số và dấu gạch ngang',
									},

								]}
								extra='Đường dẫn sẽ được sử dụng trong URL của trang (VD: xich-tho)'
							>
								<Input placeholder='VD: xich-tho' />
							</Form.Item>
						</div>

						<div className={css.formSection}>
							<Text strong className={css.sectionTitle}>Thông tin liên hệ</Text>
							<Form.Item
								label='Email'
								name='email'
								rules={[
									{ required: true, message: 'Vui lòng nhập email' },
									{ type: 'email', message: 'Email không hợp lệ' },
								]}
							>
								<Input placeholder='Email để chúng tôi liên hệ với bạn' />
							</Form.Item>

							<Form.Item
								label='Số điện thoại'
								name='phone'
								rules={[
									{ required: true, message: 'Vui lòng nhập số điện thoại' },
									{
										pattern: /^[0-9]{10,11}$/,
										message: 'Số điện thoại không hợp lệ',
									},
								]}
							>
								<Input placeholder='Số điện thoại liên hệ' />
							</Form.Item>
						</div>

						<div className={css.formSection}>
							<Text strong className={css.sectionTitle}>Chi tiết trang</Text>
							<Form.Item
								label='Mục đích trang'
								name='purpose'
								// rules={[
								// 	{ required: true, message: 'Vui lòng nhập mục đích trang' },
								// 	{ min: 10, message: 'Mục đích cần mô tả ít nhất 10 ký tự' },
								// ]}
							>
								<TextArea
									placeholder='Mô tả mục đích sử dụng trang của bạn'
									rows={3}
								/>
							</Form.Item>


						</div>

						<Form.Item className={css.formActions}>
							<Button onClick={handleCancel} style={{ marginRight: 10 }}>
								Hủy
							</Button>
							<Button
								type='primary'
								htmlType='submit'
								loading={submitting}
								style={{ backgroundColor: '#b1143c', color: '#fff', borderColor: '#b1143c' }}
							>
								Gửi đăng ký
							</Button>

						</Form.Item>
					</Form>
				</div>
			</Modal>
		</div>
	);
};

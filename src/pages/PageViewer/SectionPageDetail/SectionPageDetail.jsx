import { useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import TipTapContent from './TipTap/TipTapContent.jsx';
import TableCustom from './TableCustom/TableCustom.jsx';
import { getPageSectionDataByIdPublic } from '../../../apis/public/publicService.jsx';
import { MyContext } from '../../../MyContext.jsx';
import ListTipTap from './TipTap/ListTipTap.jsx';

export default function SectionPageDetail() {
	const { page, sectionPageID } = useParams();
	const [sectionPageData, setSectionPageData] = useState(null);
	const { currentUser, setCheckEditorPage ,  checkAdminPage, checkEditorPage, } = useContext(MyContext);

	const fetchDataSectionPage = async () => {
		const data = await getPageSectionDataByIdPublic(sectionPageID);
		if (data.editor && data.editor.includes(currentUser?.email)) {
			setCheckEditorPage(true);
		}
		setSectionPageData(data);
	};

	useEffect(() => {
		fetchDataSectionPage();
	}, [sectionPageID, currentUser]);


	if (!sectionPageData?.show) {
		return <p style={{ padding: 16 }}>Lỗi...</p>;
	}

	if (sectionPageData.is_editor === true &&
		!(currentUser?.isAdmin || checkAdminPage || checkEditorPage)) {
		return (
			<div style={{ padding: 16, textAlign: 'center' }}>
				<p>Bạn không có quyền truy cập vào nội dung này.</p>
				<p>Chỉ Admin và Editor mới có quyền xem.</p>
			</div>
		);
	}

	switch (sectionPageData.type) {
		case 'ListTipTap':
			return <ListTipTap sectionPageData={sectionPageData} />;
		case 'TipTap':
			return <TipTapContent sectionPageData={sectionPageData} />;
		case 'Table':
			return <TableCustom sectionPageData={sectionPageData} />;
		case 'Form':
			return <TableCustom sectionPageData={sectionPageData} />;
		case 'File':
			return <TableCustom sectionPageData={sectionPageData} />;
		case 'Album':
			return <TableCustom sectionPageData={sectionPageData} />;
		default:
			return <p style={{ padding: 16 }}>Đang tải dữ liệu... </p>;
	}
}
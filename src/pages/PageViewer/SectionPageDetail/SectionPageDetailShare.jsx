import { useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { getPageSectionDataByIdPublic } from '../../../apis/public/publicService.jsx';
import { MyContext } from '../../../MyContext.jsx';
import ListTipTapShare from './TipTap/ListTipTapShare.jsx';
import TableCustomShare from './TableCustom/TableCustomShare.jsx';

export default function SectionPageDetailShare() {
	const { page, sectionPageID } = useParams();
	const [sectionPageData, setSectionPageData] = useState(null);
	const { currentUser, setCheckEditorPage } = useContext(MyContext);

	const fetchDataSectionPage = async () => {
		const data = await getPageSectionDataByIdPublic(sectionPageID , currentUser);
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

	switch (sectionPageData.type) {
		case 'ListTipTap':
			return <ListTipTapShare sectionPageData={sectionPageData} />;
		case 'Table':
			return <TableCustomShare sectionPageData={sectionPageData} />;
		case 'Form':
			return <TableCustomShare sectionPageData={sectionPageData} />;
		case 'File':
			return <TableCustomShare sectionPageData={sectionPageData} />;
		case 'Album':
			return <TableCustomShare sectionPageData={sectionPageData} />;
		default:
			return <p style={{ padding: 16 }}>Đang tải dữ liệu... 123</p>;
	}
}
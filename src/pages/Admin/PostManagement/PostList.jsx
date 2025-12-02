import { Button, Layout, Tree, Typography } from 'antd';
import { FileOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { createNewPageSection, getAllPageSectionDataShare } from '../../../apis/pageSectionService';
import { InfoAlbum, InfoFile, InfoForm, InfoTable } from '../../../constain/Constain';
import { createTimestamp } from '../../../generalFunction/format';
import { MyContext } from '../../../MyContext';
import CreateSection from './CreateSection';
import { ICON_SIDEBAR_LIST } from '../../../icon/IconSvg.jsx';

const { Title } = Typography;
const { Sider, Content } = Layout;

export default function PostList() {
    const navigate = useNavigate();
    const [selectedKey, setSelectedKey] = useState(null);
    const [data, setData] = useState([]);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [sectionName, setSectionName] = useState('');
    const [sectionType, setSectionType] = useState('');
    const { currentUser, loadData, setLoadData } = useContext(MyContext);

    useEffect(() => {
        const fetchData = async () => {
            const result = await getAllPageSectionDataShare();
            setData(result);
        };
        fetchData();
    }, [loadData]);

    function renderSidebarIcon(iconName, style = { width: 15, height: 15 }) {
        const iconObj = ICON_SIDEBAR_LIST.find(i => i.name === iconName);
        if (iconObj && iconObj.icon) {
            // If icon is a string (SVG path), render as <img>
            if (typeof iconObj.icon === 'string') {
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
          <img src={iconObj.icon} alt={iconName} style={{ width: style.width, height: style.height }} />
        </span>
                );
            }
            // If icon is a React component, render as component
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        {React.createElement(iconObj.icon, style)}
      </span>
            );
        }
        return <div style={style} />;
    }

    // Transform API data for Tree component
    const transformDataToTree = (apiData) => {
        return apiData.map(item => ({
            title: item.name,
            key: item.id,
            icon: item.contentPage?.length > 0 ? <FolderOutlined /> : <FileOutlined />,
            isLeaf: item.contentPage?.length === 0,
            children: item.contentPage?.map(content => ({
                title: content.name,
                key: content.id,
                icon: renderSidebarIcon(content.icon),
                isLeaf: true,
                createdAt: new Date(content.created_at).toLocaleDateString(),
                content: content.content,
                type: item.type,
                info: content.info,
                userCreate: content.user_create
            }))
        }));
    };

    const closeModalCreateSection = () => {
        setSectionName('');
        setSectionType('');
        setCreateModalVisible(false);
    };

    const handleCreateSection = async () => {
        let sectionInfo;
        switch (sectionType) {
            case 'Table':
                sectionInfo = InfoTable;
                break;
            case 'Form':
                sectionInfo = InfoForm;
                break;
            case 'File':
                sectionInfo = InfoFile;
                break;
            case 'Album':
                sectionInfo = InfoAlbum;
                break;
            default:
                sectionInfo = [];
                break;
        }
        
        const updatedData = {
            id_page : null,
            type: sectionType,
            name: sectionName,
            created_at: createTimestamp(),
            user_create: currentUser.email,
            info: sectionInfo,
            origin_type: 'share'
        };
        const newSection = await createNewPageSection(updatedData);
        if (newSection) {
            setData(prevData => [...prevData, newSection]);
        }
        closeModalCreateSection();
    };

    const handleTreeSelect = (selectedKeys) => {
        if (selectedKeys.length > 0) {
            const key = selectedKeys[0];
            setSelectedKey(key);
            
            // Tìm item được chọn trong data
            const findPost = (data, targetKey) => {
                // Tìm section (folder)
                const section = data.find(item => item.id === targetKey);
                if (section) return { ...section, isFolder: true };
    
                // Tìm content (item)
                for (let item of data) {
                    if (item.contentPage) {
                        const content = item.contentPage.find(content => content.id === parseInt(targetKey));
                        if (content) return { ...content, parentType: item.type, isFolder: false };
                    }
                }
                return null;
            };
    
            const post = findPost(data, key);
            
            if (post) {
                if (post.isFolder) {
                    navigate(`folder/${post.id}`);
                } else {
                    navigate(`item/${post.id}`);
                }
            }
        }
    };

    return (
        <Layout style={{ height: '100%', background: '#fff' }}>
            <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: '16px' }}>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        style={{ marginBottom: '16px', width: '100%' }}
                        onClick={() => setCreateModalVisible(true)}
                    >
                        Tạo mới
                    </Button>
                    <Tree
                        treeData={transformDataToTree(data)}
                        defaultExpandAll
                        showIcon
                        onSelect={handleTreeSelect}
                    />
                </div>
            </Sider>
            <Content>
                <Outlet />
            </Content>

            <CreateSection
                createModalVisible={createModalVisible}
                sectionName={sectionName}
                sectionType={sectionType}
                setSectionName={setSectionName}
                setSectionType={setSectionType}
                handleCreateSection={handleCreateSection}
                closeModalCreateSection={closeModalCreateSection}
            />
        </Layout>
    );
} 
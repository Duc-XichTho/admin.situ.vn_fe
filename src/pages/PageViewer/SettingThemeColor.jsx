import css from './SettingThemeColor.module.css';
import { useState, useEffect } from 'react';
import { Modal, Button, ColorPicker, message } from 'antd';
import { getSettingByTypePublic, createNewSettingPublic } from '../../apis/public/publicService.jsx';
import { updateSetting } from "../../apis/settingService.jsx";
import { useParams } from 'react-router-dom';

const SettingThemeColor = ({ isOpen, onClose }) => {
    const { page } = useParams();
    const [themeColor, setThemeColor] = useState('#FFFFFF');
    const [fontColor, setFontColor] = useState('#000000');
    const [settingData, setSettingData] = useState(null);

    const fetchData = async () => {
        try {
            let data = await getSettingByTypePublic(`settingTheme_${page}`);
            if (!data) {
                data = await createNewSettingPublic({
                    type: `settingTheme_${page}`,
                    setting: { themeColor: '#FFFFFF', fontColor: '#000000' },
                });
            }
            setSettingData(data);
            setThemeColor(data.setting.themeColor || '#FFFFFF');
            setFontColor(data.setting.fontColor || '#000000');
        } catch (error) {
            console.error('Error fetching theme color:', error);
        }
    };

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen]);

    const handleThemeColorChange = (color) => {
        setThemeColor(color.toHexString().toUpperCase());
    };

    const handleFontColorChange = (color) => {
        setFontColor(color.toHexString().toUpperCase());
    };

    const handleSave = async () => {
        try {
            await updateSetting({
                ...settingData,
                type: `settingTheme_${page}`,
                setting: { themeColor, fontColor }
            });
            message.success('Theme and font color saved successfully');
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Error saving theme/font color:', error);
        }
    };

    return (
        <Modal
            title="Cài đặt màu Header và màu chữ Header"
            width={300}
            centered
            open={isOpen}
            footer={null}
            onCancel={onClose}
            className={css.modal}
        >
            <div className={css.colorPickerWrap}>
                <span>Màu Header</span>
                <ColorPicker
                    value={themeColor}
                    size="large"
                    showText
                    onChange={handleThemeColorChange}
                />
            </div>
            <div className={css.colorPickerWrap}>
                <span>Màu chữ Header</span>
                <ColorPicker
                    value={fontColor}
                    size="large"
                    showText
                    onChange={handleFontColorChange}
                />
            </div>
            <div className={css.footer}>
                <Button size="small" type="primary" onClick={handleSave}>
                    Save
                </Button>
                <Button size="small" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Modal>
    );
};

export default SettingThemeColor;
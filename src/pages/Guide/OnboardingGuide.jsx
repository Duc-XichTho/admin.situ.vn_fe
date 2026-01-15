import React, { useEffect, useState } from "react";
import Carousel from "react-material-ui-carousel";
import SlideManager from "./SlideManager";
import SlideEditor from './SlideEditor';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import { getSettingByType, createOrUpdateSetting } from "../../apis/settingService.jsx";
import css from "./guide.module.css";
const OnboardingGuide = ({ openSlideManager, setOpenSlideManager, componentName }) => {
    const [slides, setSlides] = useState([]);
    const [guidelineSettingId, setGuidelineSettingId] = useState(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const fetchData = async () => {
        try {
            const settingType = `GUIDELINE_${componentName}`;
            try {
                const setting = await getSettingByType(settingType);
                if (setting && setting.setting) {
                    setGuidelineSettingId(setting.id);
                    const guideData = setting.setting;
                    // Convert old format (src, type) to new format (content HTML)
                    const convertedSlides = (guideData.slides || []).map(slide => {
                        if (slide.content) {
                            return slide; // Already new format
                        }
                        // Convert old format to new format
                        let htmlContent = '';
                        if (slide.type === 'iframe') {
                            htmlContent = `<iframe src="${slide.src}" style="width: 100%; height: 600px; border: none;"></iframe>`;
                        } else if (slide.type === 'img') {
                            htmlContent = `<img src="${slide.src}" alt="${slide.title || ''}" style="max-width: 100%; height: auto;" />`;
                        }
                        return {
                            ...slide,
                            content: htmlContent || slide.src || ''
                        };
                    });
                    setSlides(convertedSlides);
                } else {
                    // Nếu chưa có setting, khởi tạo mặc định
                    setSlides([]);
                }
            } catch (error) {
                // Nếu không tìm thấy setting, khởi tạo mặc định
                console.log("Setting not found, initializing default:", error);
                setSlides([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    const saveSlidesToAPI = async (updatedSlides) => {
        try {
            const settingType = `GUIDELINE_${componentName}`;
            let currentSetting;

            try {
                currentSetting = await getSettingByType(settingType);
            } catch (error) {
                // Setting chưa tồn tại, sẽ tạo mới
            }

            const guideData = currentSetting?.setting || {};
            const updatedGuideData = {
                ...guideData,
                slides: updatedSlides
            };

            await createOrUpdateSetting({
                type: settingType,
                setting: updatedGuideData,
                ...(currentSetting?.id && { id: currentSetting.id })
            });

            if (!guidelineSettingId && currentSetting?.id) {
                setGuidelineSettingId(currentSetting.id);
            }

            console.log('Slides updated successfully:', updatedSlides);
        } catch (error) {
            console.error('Error updating slides:', error);
        }
    };


    useEffect(() => {
        fetchData();
    }, [componentName]);




    return (
        <div style={{ display: "flex", height: "95%", width: "100%" }} className={css.onboardingGuide}>
            {/* Main Content */}
            <div style={{ flex: 1, padding: "20px", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                    {slides.length > 0 ? (
                        <Carousel
                            className={css.carousel}
                            index={currentSlideIndex}
                            onChange={(index) => setCurrentSlideIndex(index)}
                            autoPlay={false}
                            animation="slide"
                            indicators
                            navButtonsAlwaysVisible
                            sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                            navButtonsProps={{
                                style: {
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    color: "#FFFFFF",
                                    borderRadius: "50%",
                                    width: "40px",
                                    height: "40px",
                                }
                            }}
                            indicatorContainerProps={{
                                style: {
                                    marginTop: "10px",
                                }
                            }}
                            activeIndicatorProps={{
                                style: {
                                    color: "#1976d2",
                                }
                            }}
                            indicatorProps={{
                                style: {
                                    color: "#9e9e9e",
                                }
                            }}
                        >
                            {slides
                                .sort((a, b) => a.order - b.order)
                                .map((slide, index) => (
                                    <div
                                        key={slide.order}
                                        style={{
                                            height: "100%",
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            padding: "20px 40px",
                                            boxSizing: "border-box",
                                            overflow: "auto",
                                        }}
                                    >
                                        <SlideEditor
                                            slide={slide}
                                            isEditable={false}
                                        />
                                    </div>
                                ))}
                        </Carousel>
                    ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography variant="body1" color="textSecondary">
                                Chưa có slide nào. Vui lòng thêm slide từ Slide Manager.
                            </Typography>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide Manager */}
            <Dialog
                open={openSlideManager}
                onClose={() => setOpenSlideManager(false)}
                fullWidth
                maxWidth="lg"
            >
                <DialogTitle>Manage Slides</DialogTitle>
                <DialogContent>
                    <SlideManager
                        slides={slides}
                        setSlides={(updatedSlides) => {
                            setSlides(updatedSlides);
                            saveSlidesToAPI(updatedSlides);
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenSlideManager(false)}
                        color="secondary"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default OnboardingGuide;


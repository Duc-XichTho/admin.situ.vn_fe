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
    IconButton,
    Box,
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import { Settings, ArrowBack, ArrowForward } from "@mui/icons-material";
import { getSettingByType, createOrUpdateSetting } from "../../apis/settingService.jsx";
import css from "./guide.module.css";
const OnboardingGuide = ({
    openSlideManager,
    setOpenSlideManager,
    componentName,
    currentUser,
    onClose,
    hideOnboarding,
    onCheckboxChange,
}) => {
    const [slides, setSlides] = useState([]);
    const [guidelineSettingId, setGuidelineSettingId] = useState(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePrevious = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    return (
        <div style={{ 
            display: "flex", 
            height: "100%", 
            width: "100%", 
            flexDirection: "column",
            overflow: "hidden",
            maxHeight: "100%"
        }} className={css.onboardingGuide}>
            {/* Header with Title, Buttons, and DialogActions */}
            <Box
                style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "stretch" : "center",
                    padding: isMobile ? "10px 12px" : "15px 20px",
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: "#EDEDED",
                    gap: isMobile ? "10px" : "0",
                    flexShrink: 0
                }}
            >
                {/* Left side: Title and Navigation Buttons */}
                <Box style={{ 
                    display: "flex", 
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "center", 
                    gap: isMobile ? "10px" : "10px",
                    width: isMobile ? "100%" : "auto",
                    flex: isMobile ? "none" : "1"
                }}>
                    {!isMobile && (
                        <Typography 
                            variant="h6" 
                            style={{ 
                                fontWeight: "bold", 
                                marginRight: "10px",
                                fontSize: "inherit"
                            }}
                        >
                            TUTORIAL SLIDE
                        </Typography>
                    )}
                    {isMobile && (
                        <Box style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%"
                        }}>
                            <Typography 
                                variant="h6" 
                                style={{ 
                                    fontWeight: "bold", 
                                    marginRight: "8px",
                                    fontSize: "14px",
                                    margin: 0,
                                    flexShrink: 0
                                }}
                            >
                                TUTORIAL SLIDE
                            </Typography>
                            
                            {/* Checkbox and Button on mobile */}
                            <Box style={{ 
                                display: "flex", 
                                flexDirection: "row",
                                alignItems: "center", 
                                gap: "6px",
                                flexShrink: 0,
                                marginLeft: "auto"
                            }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={hideOnboarding || false}
                                            onChange={onCheckboxChange}
                                            color="primary"
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Typography
                                            variant="body2"
                                            style={{
                                                color: 'rgba(0, 0, 0, 0.6)',
                                                fontWeight: 'normal',
                                                fontSize: "11px"
                                            }}
                                        >
                                            Không hiển thị lại
                                        </Typography>
                                    }
                                    style={{ 
                                        margin: 0, 
                                        width: "auto",
                                        padding: 0,
                                        flexShrink: 0
                                    }}
                                />
                                <Button
                                    onClick={onClose}
                                    color="primary"
                                    variant="contained"
                                    className={css.startUsingButton}
                                    size="small"
                                    style={{ 
                                        fontWeight: 'bold',
                                        width: "auto",
                                        padding: "4px 8px",
                                        fontSize: "10px",
                                        minHeight: "28px",
                                        whiteSpace: "nowrap",
                                        flexShrink: 0
                                    }}
                                >
                                    Bắt đầu sử dụng
                                </Button>
                            </Box>
                        </Box>
                    )}
                    <Box style={{ 
                        display: "flex", 
                        gap: isMobile ? "6px" : "8px",
                        width: isMobile ? "100%" : "auto",
                        alignItems: "center"
                    }}>
                        <div
                            onClick={currentSlideIndex === 0 || slides.length === 0 ? undefined : handlePrevious}
                            style={{
                                border: "1px solid #999",
                                borderRadius: "6px",
                                padding: isMobile ? "6px 10px" : "4px 10px",
                                backgroundColor: "#ffffff",
                                cursor: (currentSlideIndex === 0 || slides.length === 0) ? "not-allowed" : "pointer",
                                opacity: (currentSlideIndex === 0 || slides.length === 0) ? 0.5 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: isMobile ? "11px" : "13px",
                                flex: isMobile ? 1 : "none",
                                minHeight: isMobile ? "32px" : "auto"
                            }}
                        >
                            <span>Quay lại</span>
                        </div>
                        <div
                            onClick={currentSlideIndex === slides.length - 1 || slides.length === 0 ? undefined : handleNext}
                            style={{
                                border: "1px solid #999",
                                borderRadius: "6px",
                                padding: isMobile ? "6px 10px" : "4px 10px",
                                backgroundColor: "#ffffff",
                                cursor: (currentSlideIndex === slides.length - 1 || slides.length === 0) ? "not-allowed" : "pointer",
                                opacity: (currentSlideIndex === slides.length - 1 || slides.length === 0) ? 0.5 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: isMobile ? "11px" : "13px",
                                flex: isMobile ? 1 : "none",
                                minHeight: isMobile ? "32px" : "auto"
                            }}
                        >
                            <span>Tiếp theo</span>
                        </div>
                        {currentUser?.isAdmin && (
                            <IconButton
                                onClick={() => setOpenSlideManager(true)}
                                title="Quản lý Slide"
                                color="primary"
                                size={isMobile ? "small" : "small"}
                                style={{ 
                                    flexShrink: 0,
                                    padding: isMobile ? "6px" : undefined
                                }}
                            >
                                <Settings fontSize={isMobile ? "small" : "small"} />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {/* Right side: Checkbox and Button (desktop only) */}
                {!isMobile && (
                    <Box style={{ 
                        display: "flex", 
                        flexDirection: "row",
                        alignItems: "center", 
                        gap: "10px",
                        flexShrink: 0
                    }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={hideOnboarding || false}
                                    onChange={onCheckboxChange}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label={
                                <Typography
                                    variant="body2"
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.6)',
                                        fontWeight: 'normal',
                                        fontSize: "13px"
                                    }}
                                >
                                    Không hiển thị lại
                                </Typography>
                            }
                            style={{ 
                                margin: 0, 
                                width: "auto",
                                padding: 0,
                                flexShrink: 0
                            }}
                        />
                        <Button
                            onClick={onClose}
                            color="primary"
                            variant="contained"
                            className={css.startUsingButton}
                            size="small"
                            style={{ 
                                fontWeight: 'bold',
                                width: "auto",
                                padding: "6px 12px",
                                fontSize: "12px",
                                minHeight: "32px",
                                whiteSpace: "nowrap",
                                flexShrink: 0
                            }}
                        >
                            Bắt đầu sử dụng
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Main Content */}
            <div style={{ 
                flex: 1, 
                padding: isMobile ? "8px" : "0px", 
                paddingBottom: isMobile ? "8px" : "15px", 
                height: "100%", 
                overflow: "hidden", 
                display: "flex", 
                flexDirection: "column",
                minHeight: 0,
                maxHeight: "100%"
            }}>
                <div style={{ 
                    flex: 1, 
                    minHeight: 0, 
                    maxHeight: "100%",
                    display: "flex", 
                    flexDirection: "column",
                    overflow: "hidden"
                }}>
                    {slides.length > 0 ? (
                        <Carousel
                            className={css.carousel}
                            index={currentSlideIndex}
                            onChange={(index) => setCurrentSlideIndex(index)}
                            autoPlay={false}
                            animation="slide"
                            indicators
                            navButtonsAlwaysVisible={false}
                            sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                            // navButtonsProps={{
                            //     style: {
                            //         backgroundColor: "rgba(0, 0, 0, 0.5)",
                            //         color: "#FFFFFF",
                            //         borderRadius: "50%",
                            //         width: "40px",
                            //         height: "40px",
                            //     }
                            // }}
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
                                        key={`${slide.order}-${slide.content?.substring(0, 50) || ''}-${slide.title || ''}`}
                                        style={{
                                            height: "100%",
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            padding: isMobile ? "8px" : "0px 20px",
                                            boxSizing: "border-box",
                                            overflow: isMobile ? "auto" : "auto",
                                            maxHeight: "100%",
                                            minHeight: 0
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
                maxWidth={isMobile ? "sm" : "lg"}
                fullScreen={isMobile}
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


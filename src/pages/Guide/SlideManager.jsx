import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import React, { useState } from "react";
import SlideEditor from "./SlideEditor";
const SlideManager = ({ slides, setSlides, table = "Onboarding-Guide", tableId = 1 }) => {

    const [openDialog, setOpenDialog] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
    const [editingSlideData, setEditingSlideData] = useState({
        title: "",
        content: "",
        order: slides.length + 1,
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const [slideToDelete, setSlideToDelete] = useState(null);

    const handleOpenDialog = () => {
        setEditingSlide(null);
        setEditingSlideData({ title: "", content: "", order: slides.length + 1 });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSlideData({ title: "", content: "", order: slides.length + 1 });
    };

    const handleSlideContentChange = (content, title) => {
        if (title !== undefined && title !== null) {
            setEditingSlideData(prev => ({ ...prev, title }));
        }
        if (content !== undefined && content !== null) {
            setEditingSlideData(prev => ({ ...prev, content }));
        }
    };

    const handleSaveSlide = () => {
        const updatedSlides =
            editingSlide !== null
                ? slides.map((slide) =>
                    slide.order === editingSlide 
                        ? { ...editingSlideData, order: editingSlide } 
                        : slide
                )
                : [
                    ...slides,
                    {
                        ...editingSlideData,
                        order: slides.length + 1,
                    },
                ];

        setSlides(updatedSlides);
        setOpenDialog(false);
    };



    const handleEditSlide = (order) => {
        const slideToEdit = slides.find((slide) => slide.order === order);
        setEditingSlide(order);
        setEditingSlideData({
            title: slideToEdit.title || "",
            content: slideToEdit.content || "",
            order: slideToEdit.order
        });
        setOpenDialog(true);
    };

    const handleDeleteSlide = (order) => {
        const updatedSlides = slides
            .filter((slide) => slide.order !== order)
            .map((slide, index) => ({ ...slide, order: index + 1 })); // Cập nhật lại thứ tự
        setSlides(updatedSlides);
    };

    const handleOpenDeleteMenu = (event, slide) => {
        setAnchorEl(event.currentTarget);
        setSlideToDelete(slide);
    };

    const handleCloseDeleteMenu = () => {
        setAnchorEl(null);
        setSlideToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (slideToDelete) {
            const updatedSlides = slides
                .filter((slide) => slide.order !== slideToDelete.order)
                .map((slide, index) => ({ ...slide, order: index + 1 })); // Cập nhật lại thứ tự
            setSlides(updatedSlides);
        }
        handleCloseDeleteMenu();
    };

    const handleMoveSlide = (order, direction) => {
        const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
        const currentIndex = sortedSlides.findIndex((slide) => slide.order === order);
        
        if (direction === "up" && currentIndex > 0) {
            // Đổi chỗ với slide trước đó
            const newSlides = [...sortedSlides];
            [newSlides[currentIndex - 1], newSlides[currentIndex]] = [
                newSlides[currentIndex],
                newSlides[currentIndex - 1]
            ];
            // Cập nhật lại order
            newSlides.forEach((slide, index) => {
                slide.order = index + 1;
            });
            setSlides(newSlides);
        } else if (direction === "down" && currentIndex < sortedSlides.length - 1) {
            // Đổi chỗ với slide sau đó
            const newSlides = [...sortedSlides];
            [newSlides[currentIndex], newSlides[currentIndex + 1]] = [
                newSlides[currentIndex + 1],
                newSlides[currentIndex]
            ];
            // Cập nhật lại order
            newSlides.forEach((slide, index) => {
                slide.order = index + 1;
            });
            setSlides(newSlides);
        }
    };


    return (
        <div>
            <Button
                variant="contained"
                color="primary"
                size="small"
                style={{ marginBottom: "10px" }}
                onClick={handleOpenDialog}
            >
                Thêm slide
            </Button>

            {/* Dialog thêm/sửa */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                fullWidth 
                maxWidth="lg"
                PaperProps={{
                    style: {
                        height: '90vh',
                        maxHeight: '90vh',
                    },
                }}
            >
                <DialogTitle>{editingSlide !== null ? "Sửa slide" : "Thêm slide"}</DialogTitle>
                <DialogContent style={{ height: 'calc(90vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                    <SlideEditor
                        slide={editingSlideData}
                        onContentChange={handleSlideContentChange}
                        isEditable={true}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="secondary">
                        Hủy
                    </Button>
                    <Button onClick={handleSaveSlide} color="primary">
                        {editingSlide !== null ? "Lưu" : "Thêm"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Table */}
            <TableContainer component={Paper} style={{ marginTop: "20px" }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell style={{ width: '80px' }}>Order</TableCell>
                            <TableCell style={{ width: '200px' }}>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {slides
                            .sort((a, b) => a.order - b.order)
                            .map((slide, index) => {
                                const isFirstSlide = slide.order === 1;
                                const isSecondSlide = slide.order === 2;
                                const isLastSlide = slide.order === slides.length;

                                return (
                                    <TableRow key={slide.order}>
                                        <TableCell>{slide.title || "Chưa có tiêu đề"}</TableCell>
                                        <TableCell style={{ width: '80px' }}>{slide.order}</TableCell>
                                        <TableCell style={{ width: '200px' }}>
                                            {/* Nút sửa luôn khả dụng */}
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEditSlide(slide.order)}
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>

                                            {/* Nút xóa */}
                                            <IconButton
                                                color="secondary"
                                                onClick={(event) => handleOpenDeleteMenu(event, slide)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>

                                            {/* Nút di chuyển lên */}
                                            {!isFirstSlide && (
                                                <IconButton
                                                    color="default"
                                                    onClick={() => handleMoveSlide(slide.order, "up")}
                                                    size="small"
                                                >
                                                    <ArrowUpwardIcon />
                                                </IconButton>
                                            )}

                                            {/* Nút di chuyển xuống */}
                                            {!isLastSlide && (
                                                <IconButton
                                                    color="default"
                                                    onClick={() => handleMoveSlide(slide.order, "down")}
                                                    size="small"
                                                >
                                                    <ArrowDownwardIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>


                </Table>
            </TableContainer>

            {/* Menu xác nhận xóa */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseDeleteMenu}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body1">Bạn có chắc chắn muốn xóa?</Typography>
                    <Box sx={{ mt: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleConfirmDelete}
                            sx={{ mr: 1 }}
                        >
                            Xóa
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleCloseDeleteMenu}
                        >
                            Hủy
                        </Button>
                    </Box>
                </Box>
            </Menu>
        </div>
    );
};

export default SlideManager;


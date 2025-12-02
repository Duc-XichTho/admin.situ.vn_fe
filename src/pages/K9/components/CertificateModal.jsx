import { Avatar, Empty, Row, Col, Typography, Button, message } from 'antd';
import { CloseOutlined, UserOutlined, ShareAltOutlined } from '@ant-design/icons';
import React, { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CERTIFICATE_ICON } from '../../../icon/IconSvg';
import { QRCodeSVG } from 'qrcode.react';

const CertificateModal = ({
    publicMode = false,
    open,
    onCancel,
    currentUser,
    isMobile,
    tag4Options,
    checkProgramPass,
    getProgramCertificateStats
}) => {
    // Generate share URL for QR code
    const shareUrl = useMemo(() => {
        if (!currentUser?.id) return '';
        return `${window.location.origin}/k9?share_certificate=true&certificate_user=${currentUser.id}`;
    }, [currentUser?.id]);

    // Disable body scroll when modal is open
    useEffect(() => {
        if (open) {
            // Save current scroll position
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            // Get original styles
            const html = document.documentElement;
            const body = document.body;

            const htmlStyle = html.style;
            const bodyStyle = body.style;

            const originalHtmlOverflow = htmlStyle.overflow;
            const originalBodyOverflow = bodyStyle.overflow;
            const originalBodyPosition = bodyStyle.position;
            const originalBodyTop = bodyStyle.top;
            const originalBodyLeft = bodyStyle.left;
            const originalBodyWidth = bodyStyle.width;
            const originalBodyHeight = bodyStyle.height;

            // Disable scroll on both html and body
            htmlStyle.overflow = 'hidden';
            bodyStyle.overflow = 'hidden';
            bodyStyle.position = 'fixed';
            bodyStyle.top = `-${scrollY}px`;
            bodyStyle.left = `-${scrollX}px`;
            bodyStyle.width = '100%';
            bodyStyle.height = '100%';

            // Cleanup function to restore scroll
            return () => {
                htmlStyle.overflow = originalHtmlOverflow;
                bodyStyle.overflow = originalBodyOverflow;
                bodyStyle.position = originalBodyPosition;
                bodyStyle.top = originalBodyTop;
                bodyStyle.left = originalBodyLeft;
                bodyStyle.width = originalBodyWidth;
                bodyStyle.height = originalBodyHeight;

                // Restore scroll position
                window.scrollTo(scrollX, scrollY);
            };
        }
    }, [open]);

    if (!open) return null;

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10001,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '10px' : '20px',
                overflow: 'hidden'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onCancel();
                }
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '1500px',
                    height: isMobile ? '100%' : '95vh',
                    maxHeight: '98vh',
                    background: '#fff',
                    // borderRadius: isMobile ? '0' : '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 1001,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0, 0, 0, 0.5)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                >
                    <CloseOutlined style={{ fontSize: '16px' }} />
                </button>

                {/* Share Button */}
                {
                    !publicMode && (<Button
                        type="primary"
                        icon={<ShareAltOutlined />}
                        onClick={() => {
                            try {
                                const url = `${window.location.origin}/k9?share_certificate=true&certificate_user=${currentUser?.id}`;
                                navigator.clipboard.writeText(url);
                                window.alert('Đã copy link chia sẻ vào clipboard');
                            } catch (error) {
                                window.alert('Không thể copy link chia sẻ');
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: isMobile ? '48px' : '52px',
                            zIndex: 1001,
                            fontSize: isMobile ? '12px' : '14px',
                            height: isMobile ? '28px' : '32px',
                            padding: isMobile ? '0 8px' : '0 12px'
                        }}
                    >
                        {isMobile ? '' : 'Tạo link chia sẻ'}
                    </Button>
                    )
                }


                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0
                }}>
                    <div style={{ flex: 1, padding: 0, background: '#fff' }}>
                        {/* Certificate Header */}
                        <div style={{
                            background: 'linear-gradient(90deg, #066094 0%, #27345C 100%)',

                            padding: isMobile ? '24px 16px' : '32px 0px',
                            marginBottom: '20px',
                            // borderRadius: '12px 12px 0 0',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{ marginLeft: isMobile ? '16px' : '80px', marginRight: isMobile ? '16px' : '0' }}>
                                {/* Logo and Program Title */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '8px' : '12px',
                                    marginBottom: isMobile ? '12px' : '20px',
                                }}>
                                    <img
                                        src="/Favicon.png"
                                        alt="AIMBA Logo"
                                        style={{
                                            width: isMobile ? '32px' : '50px',
                                            height: isMobile ? '32px' : '50px',
                                            objectFit: 'contain',
                                            flexShrink: 0
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <Typography.Text style={{
                                            color: 'white',
                                            fontSize: isMobile ? '13px' : '16px',
                                            lineHeight: '1.4',
                                            display: 'block'
                                        }}>
                                            Agile & Immersive MBA-grade Training
                                        </Typography.Text>
                                        <Typography.Text style={{
                                            color: 'white',
                                            fontSize: isMobile ? '10px' : '12px',
                                            display: 'block'
                                        }}>
                                            Beyond Theory, Into Practice
                                        </Typography.Text>
                                    </div>
                                </div>

                                {/* Main Title */}
                                <div style={{
                                    marginBottom: '12px'
                                }}>
                                    <Typography.Title level={2} style={{
                                        color: 'white',
                                        margin: 0,
                                        fontSize: isMobile ? '24px' : '32px',
                                        fontWeight: 'bold',
                                        letterSpacing: '2px',
                                        textTransform: 'uppercase'
                                    }}>
                                        CERTIFICATE OF ACHIEVEMENT
                                    </Typography.Title>
                                </div>

                                {/* Subtitle */}
                                <div style={{
                                }}>
                                    <Typography.Text style={{
                                        color: 'white',
                                        fontSize: isMobile ? '11px' : '13px',
                                        opacity: 0.95
                                    }}>
                                        Chứng chỉ hoàn thành chương trình Đào tạo Thực chiến qua Tình huống & Mô phỏng Nhập vai                                    </Typography.Text>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Update Date */}
                        <div style={{
                            padding: isMobile ? '10px 16px 0 16px' : '10px 70px 0 70px',
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <Typography.Text style={{
                                fontSize: isMobile ? '12px' : '14px',
                                color: '#8c8c8c'
                            }}>
                                Certificate Update {(() => {
                                    const now = new Date();
                                    const day = String(now.getDate()).padStart(2, '0');
                                    const month = String(now.getMonth() + 1).padStart(2, '0');
                                    const year = now.getFullYear();
                                    return `${day}/${month}/${year}`;
                                })()}
                            </Typography.Text>
                        </div>

                        {/* User Info Display */}
                        <div style={{
                            marginBottom: '20px',
                            padding: isMobile ? '16px' : '20px 70px',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                                <Avatar
                                    size={isMobile ? 64 : 100}
                                    src={currentUser?.picture}
                                    icon={!currentUser?.picture && <UserOutlined />}
                                    style={{
                                        border: '3px solid #fff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        flexShrink: 0
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Typography.Text strong style={{
                                        fontSize: isMobile ? '16px' : '18px',
                                        color: '#262626',
                                        display: 'block',
                                        marginBottom: '6px'
                                    }}>
                                        {currentUser?.name || currentUser?.username || 'User'}
                                    </Typography.Text>
                                    <Typography.Text
                                        type="secondary"
                                        style={{
                                            fontSize: isMobile ? '12px' : '14px',
                                            color: '#8c8c8c',
                                            display: 'block',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        📧 {currentUser?.email || currentUser?.username || 'Chưa có email'}
                                    </Typography.Text>
                                </div>
                            </div>
                        </div>

                        {/* Passed Programs List */}
                        <div style={{ marginBottom: '24px', padding: isMobile ? '0 16px' : '0 20px' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#fff',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                {(() => {
                                    // Use real data only
                                    const programsToShow = tag4Options?.filter(program => {
                                        const passCheck = checkProgramPass(program.value);
                                        return passCheck.passed;
                                    }).map(program => {
                                        const passCheck = checkProgramPass(program.value);
                                        const stats = getProgramCertificateStats(program.value);
                                        return {
                                            label: program.label,
                                            description: program.description || 'Chương trình đào tạo chuyên nghiệp',
                                            level: passCheck.level,
                                            score: stats.averageScore
                                        };
                                    }) || [];

                                    return programsToShow.map((program, index, array) => {
                                        const getStatusColor = (level) => {
                                            if (level === 'Excellence') return '#722ed1';
                                            return '#52c41a';
                                        };
                                        const statusColor = getStatusColor(program.level);
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    padding: isMobile ? '16px' : '20px 130px',
                                                    borderBottom: index === array.length - 1 ? 'none' : '1px solid #f0f0f0'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? '12px' : '16px' }}>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: isMobile ? '8px' : '12px' }}>
                                                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <CERTIFICATE_ICON width={isMobile ? 24 : 35} height={isMobile ? 24 : 35} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <Typography.Title style={{ fontSize: isMobile ? '14px' : '17px', fontWeight: '500', margin: 0, marginBottom: '4px', color: '#262626' }}>
                                                                {program.label}
                                                            </Typography.Title>
                                                            <Typography.Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                                                                {program.description}
                                                            </Typography.Text>
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-end',
                                                        gap: '4px'
                                                    }}>
                                                        <div style={{
                                                            fontSize: isMobile ? '12px' : '14px',
                                                            fontWeight: '600',
                                                            color: statusColor
                                                        }}>
                                                            {program.level}
                                                        </div>
                                                        {/* <div style={{
                                                            fontSize: '12px',
                                                            color: '#8c8c8c'
                                                        }}>
                                                            {program.score}%
                                                        </div> */}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                                {(() => {
                                    const realPassedCount = tag4Options?.filter(program => {
                                        const passCheck = checkProgramPass(program.value);
                                        return passCheck.passed;
                                    }).length || 0;

                                    if (realPassedCount === 0) {
                                        return (
                                            <div style={{
                                                padding: '40px 20px',
                                                textAlign: 'center'
                                            }}>
                                                <Empty
                                                    description={
                                                        <Typography.Text style={{ color: '#666', fontSize: '14px' }}>
                                                            Chưa có chương trình nào đạt yêu cầu chứng chỉ
                                                        </Typography.Text>
                                                    }
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Footer - Always at bottom */}
                    <div style={{
                        background: '#f5f5f5',
                        padding: isMobile ? '16px' : '10px 70px',
                        borderRadius: '0 0 12px 12px',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? '16px' : '0' }}>
                            {/* Left Side - Program Info */}
                            <div style={{ flex: isMobile ? 'none' : 1 }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    <Typography.Text style={{
                                        fontSize: isMobile ? '11px' : '14px',
                                        color: '#757575',
                                        display: 'block'
                                    }}>
                                        AIMBA - Agile & Immersive MBA-level Training
                                    </Typography.Text>
                                    <Typography.Text style={{
                                        fontSize: isMobile ? '10px' : '14px',
                                        color: '#757575',
                                        display: 'block',
                                        lineHeight: '1.5'
                                    }}>
                                        A pioneering, innovative program in training with real-life situation
                                    </Typography.Text>
                                    <Typography.Text style={{
                                        fontSize: isMobile ? '10px' : '14px',
                                        color: '#757575',
                                        display: 'block',
                                        lineHeight: '1.5'
                                    }}>
                                        Bridging the gap and weaknesses of conventional learning methodology
                                    </Typography.Text>
                                    <Typography.Text style={{
                                        fontSize: isMobile ? '10px' : '14px',
                                        color: '#757575',
                                        display: 'block',
                                        lineHeight: '1.5'
                                    }}>
                                        For more information, visit: <a href="https://AIMBA.vn" target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>AIMBA.vn</a>
                                    </Typography.Text>
                                </div>
                            </div>
                            {/* Right Side - QR Code and Date */}
                            <div style={{ display: 'flex', width: isMobile ? '100%' : '25%', justifyContent: isMobile ? 'flex-start' : 'end', gap: isMobile ? '12px' : 20, flexDirection: isMobile ? 'row' : 'row' }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: isMobile ? '8px' : '12px',
                                    flex: isMobile ? 1 : 'none'
                                }}>
                                    <Typography.Text style={{
                                        fontSize: isMobile ? '11px' : '14px',
                                        color: '#757575',
                                        display: 'block',
                                        textAlign: isMobile ? 'left' : 'left'
                                    }}>
                                        Verify this by scanning the following QR Code
                                    </Typography.Text>

                                    <Typography.Text style={{
                                        fontSize: isMobile ? '11px' : '14px',
                                        color: '#595959',
                                        display: 'block',
                                        textAlign: isMobile ? 'left' : 'left'
                                    }}>
                                        Certificate Update {(() => {
                                            const now = new Date();
                                            const day = String(now.getDate()).padStart(2, '0');
                                            const month = String(now.getMonth() + 1).padStart(2, '0');
                                            const year = now.getFullYear();
                                            return `${day}/${month}/${year}`;
                                        })()}
                                    </Typography.Text>
                                </div>
                                {/* QR Code */}
                                {shareUrl ? (
                                    <div style={{
                                        width: isMobile ? '100px' : '150px',
                                        height: isMobile ? '100px' : '110px',
                                        background: '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <QRCodeSVG
                                            value={shareUrl}
                                            size={isMobile ? 84 : 100}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                ) : (
                                    <div style={{
                                        width: isMobile ? '100px' : '150px',
                                        height: isMobile ? '100px' : '110px',
                                        background: '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <Typography.Text type="secondary" style={{ fontSize: '10px', textAlign: 'center', padding: '8px' }}>
                                            QR Code
                                        </Typography.Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use React Portal to render directly to body
    return typeof window !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null;
};

export default CertificateModal;


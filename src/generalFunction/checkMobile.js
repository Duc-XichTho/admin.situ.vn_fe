export const checkMobile = () => {
	const isMobile = window.innerWidth < 768;
	if (isMobile) {
		return true;
	} else {
		return false;
	}
};

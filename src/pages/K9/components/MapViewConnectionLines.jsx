import React, { useEffect, useRef, useState } from 'react';

const MapViewConnectionLines = ({
									selectedItemId,
									allItems = [],
									containerRef,
									itemRefs,
									visibleItemIds = [],
									sourceType = null, // 'theory' or 'case'
									targetType = null,  // 'theory' or 'case'
									theoryItems = [], // Theory items array
									caseItems = [] // Case items array
								}) => {
	const svgRef = useRef(null);
	const [lines, setLines] = useState([]);
	const [containerRect, setContainerRect] = useState(null);

	// Main effect to handle container setup and observers
	useEffect(() => {
		if (!containerRef.current) return;

		// Initial container rect setup
		const rect = containerRef.current.getBoundingClientRect();
		setContainerRect(rect);

		// Create ResizeObserver for container
		const resizeObserver = new ResizeObserver(() => {
			if (containerRef.current) {
				const newRect = containerRef.current.getBoundingClientRect();
				setContainerRect(newRect);
			}
		});

		// Function to calculate lines
		const calculateLines = () => {
			if (!selectedItemId || !containerRef.current) {
				setLines([]);
				return;
			}

			const selectedItem = allItems.find(item => item.id === selectedItemId);
			if (!selectedItem || !selectedItem.cid) {
				setLines([]);
				return;
			}

			const selectedElement = itemRefs.current[selectedItemId];
			const selectedVisible = visibleItemIds.length === 0 || visibleItemIds.includes(selectedItemId);
			if (!selectedElement || !selectedVisible) {
				setLines([]);
				return;
			}

			const currentRect = containerRef.current.getBoundingClientRect();
			const selectedRect = selectedElement.getBoundingClientRect();
			const selectedStartX = selectedRect.right - currentRect.left;
			const selectedStartY = selectedRect.top - currentRect.top + selectedRect.height / 2;

			// Find all items with the same cid
			// If sourceType is 'theory' and targetType is 'case', only connect to case items
			let relatedItems = allItems.filter(item =>
				item.id !== selectedItemId &&
				item.cid === selectedItem.cid &&
				item.status === 'published'
			);

			// Filter: only connect from theory to case
			if (sourceType === 'theory' && targetType === 'case') {
				// Only show connections to case items (items that are in caseItems array)
				const caseItemIds = new Set(caseItems.map(item => item.id));
				relatedItems = relatedItems.filter(item => caseItemIds.has(item.id));
			}

			const newLines = [];
			relatedItems.forEach(relatedItem => {
				const relatedElement = itemRefs.current[relatedItem.id];
				const relatedVisible = visibleItemIds.length === 0 || visibleItemIds.includes(relatedItem.id);
				if (relatedElement && relatedVisible) {
					const relatedRect = relatedElement.getBoundingClientRect();
					const relatedEndX = relatedRect.left - currentRect.left;
					const relatedEndY = relatedRect.top - currentRect.top + relatedRect.height / 2;
					newLines.push({
						id: `${selectedItemId}-${relatedItem.id}`,
						x1: selectedStartX,
						y1: selectedStartY,
						x2: relatedEndX,
						y2: relatedEndY
					});
				}
			});

			setLines(newLines);
		};

		// Create IntersectionObserver for elements
		const intersectionObserver = new IntersectionObserver(() => {
			requestAnimationFrame(calculateLines);
		}, {
			root: containerRef.current,
			threshold: 0
		});

		// Observe container
		resizeObserver.observe(containerRef.current);

		// Observe all item elements
		Object.values(itemRefs.current).forEach(el => {
			if (el) intersectionObserver.observe(el);
		});

		// Handle scroll events on scrollable containers
		const handleScroll = () => {
			requestAnimationFrame(calculateLines);
		};

		const scrollableContainers = containerRef.current.querySelectorAll('.scrollableContainer');
		scrollableContainers.forEach(container => {
			container.addEventListener('scroll', handleScroll, { passive: true });
		});

		// Handle window resize
		const handleWindowResize = () => {
			if (containerRef.current) {
				const newRect = containerRef.current.getBoundingClientRect();
				setContainerRect(newRect);
			}
			requestAnimationFrame(calculateLines);
		};
		window.addEventListener('resize', handleWindowResize);

		// Initial calculation
		calculateLines();

		// Cleanup
		return () => {
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			scrollableContainers.forEach(container => {
				container.removeEventListener('scroll', handleScroll);
			});
			window.removeEventListener('resize', handleWindowResize);
		};
	}, [containerRef, itemRefs, selectedItemId, allItems, visibleItemIds]);

	// Update lines when selectedItemId or data changes
	useEffect(() => {
		if (!selectedItemId || !containerRef.current) {
			setLines([]);
			return;
		}

		const selectedItem = allItems.find(item => item.id === selectedItemId);
		if (!selectedItem || !selectedItem.cid) {
			setLines([]);
			return;
		}

		const selectedElement = itemRefs.current[selectedItemId];
		const selectedVisible = visibleItemIds.length === 0 || visibleItemIds.includes(selectedItemId);
		if (!selectedElement || !selectedVisible) {
			setLines([]);
			return;
		}

		const currentRect = containerRef.current.getBoundingClientRect();
		const selectedRect = selectedElement.getBoundingClientRect();
		const selectedStartX = selectedRect.right - currentRect.left;
		const selectedStartY = selectedRect.top - currentRect.top + selectedRect.height / 2;

		// Find all items with the same cid
		const relatedItems = allItems.filter(item =>
			item.id !== selectedItemId &&
			item.cid === selectedItem.cid &&
			item.status === 'published'
		);

		const newLines = [];
		relatedItems.forEach(relatedItem => {
			const relatedElement = itemRefs.current[relatedItem.id];
			const relatedVisible = visibleItemIds.length === 0 || visibleItemIds.includes(relatedItem.id);
			if (relatedElement && relatedVisible) {
				const relatedRect = relatedElement.getBoundingClientRect();
				const relatedEndX = relatedRect.left - currentRect.left;
				const relatedEndY = relatedRect.top - currentRect.top + relatedRect.height / 2;
				newLines.push({
					id: `${selectedItemId}-${relatedItem.id}`,
					x1: selectedStartX,
					y1: selectedStartY,
					x2: relatedEndX,
					y2: relatedEndY
				});
			}
		});

		setLines(newLines);
	}, [selectedItemId, allItems, containerRef, itemRefs, visibleItemIds]);

	if (!containerRef.current || !containerRect) return null;

	return (
		<svg
			ref={svgRef}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: containerRect.width,
				height: containerRect.height,
				pointerEvents: 'none',
				zIndex: 10,
				overflow: 'visible'
			}}
		>
			<defs>
				<linearGradient id="mapViewConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#3b82f6" />
					<stop offset="30%" stopColor="#2563eb" />
					<stop offset="70%" stopColor="#2563eb" />
					<stop offset="100%" stopColor="#1d4ed8" />
				</linearGradient>
				<filter id="mapViewGlow">
					<feGaussianBlur stdDeviation="1" result="coloredBlur"/>
					<feMerge>
						<feMergeNode in="coloredBlur"/>
						<feMergeNode in="SourceGraphic"/>
					</feMerge>
				</filter>
			</defs>

			{lines.map(line => {
				const distance = Math.abs(line.x2 - line.x1);
				const controlPoint1X = line.x1 + distance * 0.3;
				const controlPoint1Y = line.y1;
				const controlPoint2X = line.x2 - distance * 0.3;
				const controlPoint2Y = line.y2;

				const pathData = `M ${line.x1} ${line.y1} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${line.x2} ${line.y2}`;

				return (
					<g key={line.id}>
						{/* Glow effect */}
						<path
							d={pathData}
							stroke="#3b82f6"
							strokeWidth="1.5"
							fill="none"
							filter="url(#mapViewGlow)"
							opacity="0.4"
						/>
						{/* Main line */}
						<path
							d={pathData}
							stroke="url(#mapViewConnectionGradient)"
							strokeWidth="1"
							fill="none"
							strokeLinecap="round"
						/>
						{/* Arrow */}
						<defs>
							<marker
								id={`mapViewArrow-${line.id}`}
								markerWidth="10"
								markerHeight="10"
								refX="9"
								refY="3"
								orient="auto"
								markerUnits="strokeWidth"
							>
								<path d="M0,0 L0,6 L9,3 z" fill="#1d4ed8" />
							</marker>
						</defs>
						<path
							d={pathData}
							stroke="url(#mapViewConnectionGradient)"
							strokeWidth="1"
							fill="none"
							markerEnd={`url(#mapViewArrow-${line.id})`}
							opacity="0"
						/>
					</g>
				);
			})}
		</svg>
	);
};

export default MapViewConnectionLines;


import { useCallback } from 'react';

export const onFilterTextBoxChanged = (gridRef) => useCallback(() => {
    const filterText = document.getElementById("filter-text-box").value;
    gridRef.current.api.setQuickFilter(filterText);
}, [gridRef]);

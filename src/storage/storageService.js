import { openDB } from 'idb';

// Hàm mở hoặc tạo cơ sở dữ liệu với các object store
const dbPromise = openDB('my-database', 2, {
    upgrade(db) {
        // Tạo object store nếu chưa tồn tại
        if (!db.objectStoreNames.contains('my-store')) {
            db.createObjectStore('my-store');
        }
        if (!db.objectStoreNames.contains('ktqt')) {
            db.createObjectStore('ktqt');
        }
    },
});

// Hàm lấy dữ liệu từ IndexedDB
export const getItemFromIndexedDB = async (key) => {
    const db = await dbPromise;
    const data = await db.get('my-store', key);
    return data || [];
};

// Lưu dữ liệu vào IndexedDB
export const setItemInIndexedDB = async (key, data) => {
    const db = await dbPromise;
    await db.put('my-store', data, key);
};


export const deleteItemFromIndexedDB = async (key) => {
    const db = await dbPromise;
    await db.delete('my-store', key);
    console.log(`Deleted key: ${key}`);
};

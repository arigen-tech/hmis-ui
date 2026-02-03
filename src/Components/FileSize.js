import React, { useState, useEffect, useRef } from 'react';

const validateUploadedFile = (file, fileName = 'File') => {
    if (!file) {
        return { isValid: false, error: `${fileName} is required` };
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        return { 
            isValid: false, 
            error: 'Only PDF, JPG, JPEG, PNG files are allowed' 
        };
    }

    const maxSizeMB = 1;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        return { 
            isValid: false, 
            error: `${fileName} (${fileSizeMB}MB) exceeds maximum size of ${maxSizeMB}MB`
        };
    }

    return { isValid: true, error: null };

};

export default validateUploadedFile;


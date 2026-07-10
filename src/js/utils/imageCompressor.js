// --- Compresor de imágenes: redimensiona y convierte a base64 ---

// Procesa una imagen: la redimensiona a max 800px y comprime hasta alcanzar el tamaño objetivo
export function processImageToBase64(file, maxKB) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                const maxDim = 800;
                // Redimensionar si la imagen es más grande que 800px en cualquier dimensión
                if (w > maxDim || h > maxDim) {
                    const ratio = Math.min(maxDim / w, maxDim / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                // Comprimir calidad hasta que el tamaño esté por debajo del límite
                let quality = 0.7;
                let result = canvas.toDataURL('image/jpeg', quality);
                while (result.length > maxKB * 1024 && quality > 0.2) {
                    quality -= 0.1;
                    result = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(result);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

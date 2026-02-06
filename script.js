// Конфигурация (замените на свои данные)
const CONFIG = {
    VK_API_URL: 'https://api.vk.com/method/messages.send',
    VK_ACCESS_TOKEN: 'ВАШ_ACCESS_TOKEN_VK', // Получить: https://vk.com/dev/access_token
    VK_USER_ID: 'ID_ПОЛУЧАТЕЛЯ', // ID пользователя или чата
    VK_VERSION: '5.131'
};

// Элементы DOM
const form = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const rulesLink = document.getElementById('rulesLink');
const rulesModal = document.getElementById('rulesModal');
const closeModal = document.querySelector('.close');

// Показ/скрытие модального окна
rulesLink.addEventListener('click', (e) => {
    e.preventDefault();
    rulesModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    rulesModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === rulesModal) {
        rulesModal.style.display = 'none';
    }
});

// Показать уведомление
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Показать загрузку
function showLoading() {
    let loading = document.querySelector('.loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loading);
    }
    loading.style.display = 'flex';
}

// Скрыть загрузку
function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Валидация формы
function validateForm(data) {
    if (!data.animeTitle.trim()) {
        return 'Введите название аниме';
    }
    
    if (!data.episodeNumber || data.episodeNumber < 1) {
        return 'Введите корректный номер серии';
    }
    
    if (!data.videoLink.match(/https?:\/\/.+\..+/)) {
        return 'Введите корректную ссылку на видео';
    }
    
    if (data.subtitleLink && !data.subtitleLink.match(/https?:\/\/.+\..+/)) {
        return 'Введите корректную ссылку на субтитры';
    }
    
    if (!data.quality) {
        return 'Выберите качество видео';
    }
    
    if (!data.contact.trim()) {
        return 'Введите контакт для обратной связи';
    }
    
    return null;
}

// Отправка в VK
async function sendToVK(formData) {
    try {
        const message = `
🎬 Новая заявка на заливку!

📺 Аниме: ${formData.animeTitle}
🔢 Серия: ${formData.episodeNumber}
🎥 Качество: ${formData.quality}
🔗 Видео: ${formData.videoLink}
${formData.subtitleLink ? `📝 Субтитры: ${formData.subtitleLink}` : ''}
${formData.additionalInfo ? `📋 Доп. инфо: ${formData.additionalInfo}` : ''}
👤 Контакт: ${formData.contact}

⏰ Время: ${new Date().toLocaleString()}
        `.trim();
        
        // Если используется VK API
        const params = new URLSearchParams({
            access_token: CONFIG.VK_ACCESS_TOKEN,
            user_id: CONFIG.VK_USER_ID,
            message: message,
            v: CONFIG.VK_VERSION,
            random_id: Math.floor(Math.random() * 1000000)
        });
        
        const response = await fetch(CONFIG.VK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.error_msg);
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка отправки в VK:', error);
        throw error;
    }
}

// Альтернативный метод через Webhook (если VK API не работает)
async function sendViaWebhook(formData) {
    // Пример для Telegram или Discord Webhook
    const webhookUrl = 'ВАШ_WEBHOOK_URL'; // Заменить на реальный webhook
    
    const payload = {
        content: `🎬 Новая заявка на заливку от ${formData.contact}`,
        embeds: [{
            title: `${formData.animeTitle} - Серия ${formData.episodeNumber}`,
            description: formData.additionalInfo || 'Без дополнительной информации',
            color: 0x6a11cb,
            fields: [
                { name: 'Качество', value: formData.quality, inline: true },
                { name: 'Ссылка на видео', value: formData.videoLink, inline: false },
                { name: 'Субтитры', value: formData.subtitleLink || 'Не указаны', inline: true },
                { name: 'Контакт', value: formData.contact, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    };
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        return response.ok;
    } catch (error) {
        console.error('Ошибка отправки через webhook:', error);
        throw error;
    }
}

// Обработка отправки формы
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Сбор данных формы
    const formData = {
        animeTitle: document.getElementById('animeTitle').value,
        episodeNumber: document.getElementById('episodeNumber').value,
        videoLink: document.getElementById('videoLink').value,
        subtitleLink: document.getElementById('subtitleLink').value || '',
        quality: document.getElementById('quality').value,
        additionalInfo: document.getElementById('additionalInfo').value || '',
        contact: document.getElementById('contact').value,
        timestamp: new Date().toISOString()
    };
    
    // Валидация
    const validationError = validateForm(formData);
    if (validationError) {
        showNotification(validationError, 'error');
        return;
    }
    
    // Блокировка кнопки
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    showLoading();
    
    try {
        // Попытка отправить через VK API
        await sendToVK(formData);
        
        // Или через webhook (раскомментировать при необходимости)
        // await sendViaWebhook(formData);
        
        // Сохранение в localStorage для истории
        saveToHistory(formData);
        
        // Показ успешного уведомления
        showNotification('Заявка успешно отправлена! Модератор получил уведомление в VK.', 'success');
        
        // Очистка формы
        form.reset();
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showNotification(`Ошибка отправки: ${error.message}. Попробуйте еще раз.`, 'error');
    } finally {
        // Разблокировка кнопки
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить заявку';
        hideLoading();
    }
});

// Сохранение в историю (localStorage)
function saveToHistory(formData) {
    try {
        const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
        
        // Ограничиваем историю 50 последними заявками
        history.unshift({
            ...formData,
            id: Date.now(),
            status: 'pending'
        });
        
        if (history.length > 50) {
            history.pop();
        }
        
        localStorage.setItem('uploadHistory', JSON.stringify(history));
    } catch (error) {
        console.error('Ошибка сохранения в историю:', error);
    }
}

// Автозаполнение качества 720p
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('quality').value = '720p';
    
    // Проверка наличия истории
    const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
    if (history.length > 0) {
        console.log(`У вас ${history.length} предыдущих заявок`);
    }
});

// Пример данных для тестирования (раскомментировать для проверки)
/*
const testData = {
    animeTitle: "Kimetsu no Yaiba",
    episodeNumber: "12",
    videoLink: "https://drive.google.com/file/d/...",
    subtitleLink: "https://subs.com/...",
    quality: "1080p",
    additionalInfo: "AniLibria, 10-bit, FLAC",
    contact: "@username"
};
*/

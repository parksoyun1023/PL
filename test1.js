function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (message === '') return;

    appendMessage('user', message);
    userInput.value = '';

    // 간단한 챗봇 응답 로직
    setTimeout(() => {
        const botMessage = getBotResponse(message);
        appendMessage('bot', botMessage);
    }, 1000);
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = sender;
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function getBotResponse(message) {
    // 간단한 응답 예제
    if (message.includes('안녕')) {
        return '안녕하세요! 무엇을 도와드릴까요?';
    } else if (message.includes('고마워')) {
        return '천만에요!';
    } else {
        return '죄송해요, 이해하지 못했어요.';
    }
}
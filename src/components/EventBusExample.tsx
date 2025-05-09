import { useEffect, useState } from 'react';
import eventBus from '../core/eventBus';
import './EventBusExample.css';

// 定义事件类型
type MessageEvent = {
  message: string;
  timestamp: number;
};

const EventBusExample = () => {
  const [messages, setMessages] = useState<MessageEvent[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // 订阅消息事件
    const handleMessage = (data: MessageEvent) => {
      setMessages(prev => [...prev, data]);
    };

    eventBus.on<MessageEvent>('newMessage', handleMessage);

    // 组件卸载时取消订阅
    return () => {
      eventBus.off<MessageEvent>('newMessage', handleMessage);
    };
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const messageEvent: MessageEvent = {
        message: inputMessage,
        timestamp: Date.now()
      };

      // 发布消息事件
      eventBus.emit<MessageEvent>('newMessage', messageEvent);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="event-bus-container">
      <div className="event-bus-card">
        {/* 标题区域 */}
        <div className="event-bus-header">
          <h2 className="event-bus-title">EventBus 消息示例</h2>
          <p className="event-bus-subtitle">实时消息通信演示</p>
        </div>

        {/* 消息列表区域 */}
        <div className="event-bus-messages">
          {messages.length === 0 ? (
            <div className="empty-message">
              暂无消息，发送一条消息试试吧！
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="message-item">
                <p className="message-text">{msg.message}</p>
                <small className="message-time">
                  {new Date(msg.timestamp).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>

        {/* 输入区域 */}
        <div className="event-bus-input-container">
          <div className="input-wrapper">
            <div className="input-container">
              <div className={`input-box ${isFocused ? 'focused' : ''}`}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="input-field"
                  placeholder="输入消息，按回车发送..."
                />
              </div>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="send-button"
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="input-tip">
            提示：按回车键快速发送消息
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventBusExample; 
import { useEffect, useState } from "react";
import { messagesSignal } from "../../signals/messageSignal";
import type { Message } from "../../common/types";
import styles from "./style.module.css";

function MessageItem({ msg }: { msg: Message }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Start exit animation 300ms before removal
        const timer = setTimeout(() => setIsExiting(true), msg.duration - 300);
        return () => clearTimeout(timer);
    }, [msg.duration]);

    return (
        <div
            className={`${styles.messageContainer} ${styles[msg.type]} ${isExiting ? styles.exiting : ''}`}
            style={{ '--duration': `${msg.duration}ms` } as React.CSSProperties}
        >
            <div className={styles.content}>
                <div className={styles.title}>{msg.title}</div>
                <div className={styles.text}>{msg.content}</div>
            </div>
            <div className={styles.progressBar}></div>
        </div>
    );
}

export default function Messages() {
    const messages = messagesSignal.value;
    if (messages.length === 0) return null;

    return (
        <div className={styles.rendererContainer}>
            {messages.map((msg) => (
                <MessageItem key={msg.id} msg={msg} />
            ))}
        </div>
    );
}
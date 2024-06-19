import ChatLayout from '@/Layouts/ChatLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import ConversationHeader from "@/Components/App/ConversationHeader";
import MessageItem from "@/Components/App/MessageItem";
import MessageInput from '@/Components/App/MessageInput';
import { useEventBus } from '@/EventBus';
import axios from 'axios';
import AttachmentPreviewModal from '@/Components/App/AttachmentPreviewModal';

function Home({ selectedConversation = null, messages = null }) {
    const [localMessages, setLocalMessages] = useState([]);
    const loadMoreIntersect = useRef(null);
    const messagesCtrRef = useRef(null);
    const { on } = useEventBus();
    const [scrollFromBottom, setScrollFromBottom] = useState(null);
    const [noMoreMessages, setNoMoreMessages] = useState(false);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState({});

    const messageCreated = (message) => {
        if (selectedConversation) {
            if (selectedConversation.is_group && selectedConversation.id === message.group_id) {
                setLocalMessages((prevMessages) => [...prevMessages, message]);
            }
            if (selectedConversation.is_user && (selectedConversation.id === message.sender_id || selectedConversation.id === message.receiver_id)) {
                setLocalMessages((prevMessages) => [...prevMessages, message]);
            }
        }
    };  
 
    const loadMoreMessages = useCallback(() =>{
        
        if(noMoreMessages){
            return;
        }

        //find the first message
        const firstMessage = localMessages[0];
        axios
            .get(route("message.loadOlder", firstMessage.id))
            .then(({ data }) => {
                if (data.data.length === 0) {
                    setNoMoreMessages(true);
                    return;
                }
                const scrollHeight = messagesCtrRef.current.scrollHeight;
                const scrollTop = messagesCtrRef.current.scrollTop;
                const clientHeight = messagesCtrRef.current.clientHeight;
                setScrollFromBottom(scrollHeight - scrollTop - clientHeight);

                setLocalMessages((prevMessages) => {
                    return [...data.data.reverse(), ...prevMessages];
                });
            });
    }, [localMessages, noMoreMessages]);

    const onAttachmentClick = (attachments, ind) => {
        setPreviewAttachment({
            attachments,
            ind,
        });
        setShowAttachmentPreview(true);
    };

    useEffect(() => {
        setTimeout(() => {
            if (messagesCtrRef.current) {
                messagesCtrRef.current.scrollTop = messagesCtrRef.current.scrollHeight;
            }
        }, 10);

        const offCreated = on('message.created', messageCreated);

        setScrollFromBottom(0);
        setNoMoreMessages(false);

        return () => {
            offCreated();
        };
    }, [selectedConversation]);

    useEffect(() => {
        setLocalMessages(messages ? messages.data.reverse() : []);
    }, [messages]);

    useEffect(() => {
        if (messagesCtrRef.current && scrollFromBottom !== null) {
            messagesCtrRef.current.scrollTop =
                messagesCtrRef.current.scrollHeight -
                messagesCtrRef.current.offsetHeight -
                scrollFromBottom;
        }

        if (noMoreMessages) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => entries.forEach(
                (entry) => entry.isIntersecting && loadMoreMessages()
            ),
            {
                rootMargin: "0px 0px 250px 0px",
            }
        );
        if(loadMoreIntersect.current){
            setTimeout(() => {
                observer.observe(loadMoreIntersect.current);
            }, 100);
        }
        
        return() => {
            observer.disconnect();
        };
    }, [localMessages]);

    return (
        <>
            {!messages ? (
                <div className="flex flex-col gap-8 justify-center items-center text-center h-full opacity-35">
                    <div className="text-2xl md:text-4xl p-16 text-slate-200">
                        Please select conversation to see messages!
                    </div>
                    <ChatBubbleLeftRightIcon className="w-32 h-32 inline-block" />
                </div>
            ) : (
                <>
                    <ConversationHeader selectedConversation={selectedConversation} />
                    <div ref={messagesCtrRef} className="flex-1 overflow-y-auto p-5" style={{ maxHeight: 'calc(100vh - 150px)' }}>
                        {localMessages.length === 0 ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="text-lg text-slate-200">
                                    No messages found
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div ref={loadMoreIntersect}></div>
                                {localMessages.map((message) => (
                                    <MessageItem 
                                        key={message.id} 
                                        message={message}
                                        AttachmentClick={onAttachmentClick}
                                        />
                                ))}
                            </div>
                        )}
                    </div>
                    <MessageInput conversation={selectedConversation} />
                </>
            )}
            {previewAttachment.attachments && (
                <AttachmentPreviewModal 
                    attachments={previewAttachment.attachments}
                    index={previewAttachment.ind}
                    show={showAttachmentPreview}
                    onClose={() => setShowAttachmentPreview(false)}
                />
            )}
        </>
    );
}

Home.layout = (page) => (
    <AuthenticatedLayout user={page.props.auth.user}>
        <ChatLayout>{page}</ChatLayout>
    </AuthenticatedLayout>
);

export default Home;

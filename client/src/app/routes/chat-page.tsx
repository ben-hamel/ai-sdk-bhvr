// import { SERVER_URL } from "@/constants";
// import { useChat } from "@ai-sdk/react";
// import { DefaultChatTransport } from "ai";
// import { useState } from "react";


// export const ChatPage = () => {
//   const { messages, sendMessage, status, stop } = useChat({
//     transport: new DefaultChatTransport({
//       api: `${SERVER_URL}/chat`,
//     }),
//   });
//   const [input, setInput] = useState("");

//   return (
//     <>
//       {messages.map((message) => (
//         <div key={message.id}>
//           {message.role === "user" ? "User: " : "AI: "}
//           {message.parts.map((part) =>
//             part.type === "text" ? (
//               <span key={part.text + part.type}>{part.text}</span>
//             ) : null,
//           )}
//         </div>
//       ))}

//       {(status === "submitted" || status === "streaming") && (
//         <div>
//           {status === "submitted" && <Spinner />}
//           <button type="button" onClick={() => stop()}>
//             stop
//           </button>
//         </div>
//       )}

//       <form
//         onSubmit={(e) => {
//           e.preventDefault();
//           if (input.trim()) {
//             sendMessage({ text: input });
//             setInput("");
//           }
//         }}
//       >
//         <input
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           disabled={status !== "ready"}
//           placeholder="Say something..."
//         />
//         <button type="submit" disabled={status !== "ready"}>
//           Submit
//         </button>
//       </form>
//     </>
//   );
// }

// //Spinner
// const Spinner = () => {
//   return (
//     <div className="spinner">
//       <p>Spinner</p>
//     </div>
//   );
// };

import {
  Context,
  ContextContent,
  ContextTrigger,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from '@/components/ai-elements/context';
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { SERVER_URL } from "@/constants";
import { useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { DefaultChatTransport } from "ai";
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';

export const ChatPage = () => {
  const [text, setText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, status, sendMessage } =useChat({
    transport: new DefaultChatTransport({
      api: `${SERVER_URL}/chat`,
    }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      { 
        text: message.text || 'Sent with attachments',
        files: message.files 
      },
      {
        body: {
          webSearch: false,
        },
      }
    );
    setText('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              ref={textareaRef}
              value={text}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
                <Context maxTokens={128_000} usage={{
          inputTokens: 32_000,
          outputTokens: 8000,
          totalTokens: 40_000,
          cachedInputTokens: 0,
          reasoningTokens: 0,
        }}
        usedTokens={40_000}>
                  <ContextTrigger />
                  <ContextContent>
                    <ContextContentHeader />
    <ContextContentBody>
      <ContextInputUsage />
      <ContextOutputUsage />
      <ContextReasoningUsage />
      <ContextCacheUsage />
    </ContextContentBody>
    <ContextContentFooter />
                  </ContextContent>
                </Context>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};


import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: number;
  customer_id: number;
  owner_id: number;
  horse_id: number;
  last_message_id: number | null;
  last_message_time: string | null;
  unread_count: number;
  horse: {
    id: number;
    name: string;
    photos: string[];
    price: number;
    currency: string;
    breeds: string[];
    age: number;
    sex: string;
  } | null;
  otherParty: {
    id: number;
    name: string;
    type: string;
  } | null;
}

interface MessageCardProps {
  conversation: Conversation;
  onClick: () => void;
  isActive?: boolean;
}

const MessageCard = ({ conversation, onClick, isActive = false }: MessageCardProps) => {
  // Format the timestamp
  const timeAgo = conversation.last_message_time 
    ? formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })
    : "New conversation";

  // Format the last message time to be more user friendly
  const formatTimeAgo = (timeString: string) => {
    const time = formatDistanceToNow(new Date(timeString), { addSuffix: true });
    return time.replace("about ", "").replace("less than a minute ago", "just now");
  };

  return (
    <div 
      className={`flex gap-3 p-3 rounded-lg cursor-pointer ${
        isActive ? "bg-primary bg-opacity-5" : "hover:bg-neutral-50"
      }`}
      onClick={onClick}
    >
      {conversation.horse?.photos?.length > 0 ? (
        <img 
          src={conversation.horse.photos[0]} 
          alt={`${conversation.horse.name}`} 
          className="w-12 h-12 rounded-full object-cover" 
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
          <span className="text-lg font-semibold">
            {conversation.horse?.name?.charAt(0) || "H"}
          </span>
        </div>
      )}
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-accent font-medium">
            {conversation.otherParty?.name || "User"}
            {conversation.horse && <span> ({conversation.horse.name})</span>}
          </h4>
          <span className="text-xs text-neutral-500">
            {conversation.last_message_time 
              ? formatTimeAgo(conversation.last_message_time)
              : "New"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-700 line-clamp-1">
            {conversation.horse 
              ? `${conversation.horse.age}yo ${conversation.horse.breeds[0]} ${conversation.horse.sex}`
              : "No horse details"}
          </p>
          {conversation.unread_count > 0 && (
            <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;

import React, { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { LuImage, LuX } from "react-icons/lu";

const EmojiPickerPopup = ({ icon, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50 mb-6">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="w-12 h-12 flex items-center justify-center text-2xl bg-purple-50 text-primary rounded-lg">
          {icon || <LuImage />}
        </div>
        <p>{icon ? "Change Icon" : "Pick Icon"}</p>
      </div>

      {isOpen && (
        <div className="absolute mt-2 z-[9999] bg-white p-2 shadow-lg border border-gray-300 rounded-xl">
          <button
            className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <LuX />
          </button>

         <EmojiPicker
  onEmojiClick={(emojiObject, event) => {
    console.log("✅ Emoji selected:", emojiObject.emoji); // This will now work
    onSelect(emojiObject.emoji);
    setIsOpen(false);
  }}
/>

        </div>
      )}
    </div>
  );
};

export default EmojiPickerPopup;

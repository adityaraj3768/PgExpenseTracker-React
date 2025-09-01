import React from "react";

// You can customize this component as needed
export function Coins({ count = 0 }) {
	return (
		<div className="flex items-center justify-between w-full">
      {/* Left Section: Label + Count */}
      <div>
        <p className="text-xs sm:text-sm text-gray-600">Coins</p>
        <p className="text-lg sm:text-xl font-semibold text-gray-800">{count}</p>
      </div>

      {/* Right Section: Coin Icon */}
      <div className="text-yellow-500 text-2xl">
        🪙
      </div>
    </div>
	);
}

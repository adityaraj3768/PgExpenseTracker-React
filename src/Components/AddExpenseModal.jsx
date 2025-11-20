import { useState, useEffect } from "react";
import { useRef } from "react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import axios from "axios";
import {
  IndianRupee,
  X,
  Plus,
  Tag,
  Calendar,
  Hash,
  Users,
  Check,
} from "lucide-react";
import { useGroup } from "../Context/GroupContext";
import { getApiUrl } from "../Utils/api";
import { toast } from "react-hot-toast";

// Per-group-type colors (used for border/text emphasis)
const COLORS = {
  FRIENDS: { border: 'border-blue-300', selectedBorder: 'border-blue-600', text: 'text-blue-700', selectedText: 'text-blue-800', bg: 'bg-blue-100' },
  FAMILY: { border: 'border-green-300', selectedBorder: 'border-green-600', text: 'text-green-700', selectedText: 'text-green-800', bg: 'bg-green-100' },
  TRIP: { border: 'border-purple-300', selectedBorder: 'border-purple-600', text: 'text-purple-700', selectedText: 'text-purple-800', bg: 'bg-purple-100' },
  PERSONAL: { border: 'border-yellow-300', selectedBorder: 'border-yellow-600', text: 'text-yellow-700', selectedText: 'text-yellow-800', bg: 'bg-yellow-100' },
  OTHERS: { border: 'border-gray-300', selectedBorder: 'border-gray-600', text: 'text-gray-700', selectedText: 'text-gray-800', bg: 'bg-gray-100' },
};

export const AddExpenseModal = ({ isOpen, onClose, onCelebrate, onQuickAdd }) => {
  const [amount, setAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroupsForExpense, setSelectedGroupsForExpense] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const coinAudioRef = useRef(null);
  const { width, height } = useWindowSize();
  // celebration state is now handled by parent

  const {
    currentGroup,
    fetchAllGroups: contextFetchAllGroups,
    remainingCoins,
    setCurrentGroup,
    setTotalExpenses,
    setRemainingCoins,
    setMonthlyLimit,
  } = useGroup();

  const commonTags = [
    // Deduplicated list (duplicates removed, order preserved where possible)
    "chai",
    "coffee",
    "cold coffee",
    "juice",
    "cold drink",

    // Canteen / Mess
    "canteen",
    "mess",

    // Meals
    "breakfast",
    "lunch",
    "dinner",
    "thali",
    "biryani",

    // Fast food / snacks
    "maggi",
    "noodles",
    "chowmein",
    "pasta",
    "fried rice",
    "roll",
    "paratha",
    "idli",
    "dosa",
    "samosa",
    "momos",
    "pani puri",
    "golgappa",
    "paneer",

    // Western / other
    "pizza",
    "burger",
    "sandwich",
    "snacks",
    "chips",
    "biscuits",
    "dessert",
    "ice cream",
    "salad",

    // Protein / non-veg
    "chicken",
    "mutton",
    "paneer tikka",

    // Other common food items
    "fruits",
    "banana",
    "cake",
    "sweets",
    "lassi",
    "frooti",
    "chocolate",
    "chocolate shake",
    "milkshake",
    "yogurt",
    "smoothie",
    

    // Hostel / PG Essentials
    "rent",
    "room rent",
    "security deposit",
    "maintenance",
    "electricity",
    "water",
    "wifi",
    "internet",
    "laundry",
    "cleaning",
    "maid",
    "gas",
    "gas cylinder",
    "gas refill",
    "bed sheet",
    "pillow",
    "blanket",
    "bucket",
    "mug",
    "broom",
    "dustbin",
    "room freshener",
    "mosquito coil",
    "agarbatti",
    "utensils",
    "kitchen items",
    "cylinder regulator",
    "light bulb",
    "extension board",
    "hanger",
    "lock",
    "soap",
    "hand wash",
    "washing powder",
    "detergent",
    "toilet cleaner",
    "toothpaste",
    "toothbrush",
    "shampoo",
    "body wash",
    "mirror",
    "mattress",
    "towel",
    "curtain",

    // Study & College
    "stationery",
    "books",
    "notebook",
    "copy",
    "pen",
    "pencil",
    "a4 paper",
    "photocopy",
    "printout",
    "printing",
    "assignment print",
    "project print",
    "exam fees",
    "registration fees",
    "tuition fees",
    "library",
    "lab fees",
    "form fees",
    "id card",
    "paper",
    "folder",
    "highlighter",
    "marker",
    "eraser",
    "sharpener",
    "sticky notes",
    "whiteboard",
    "scale",
    "geometry box",
    "calculator",
    "class notes",
    "reference book",
    "course",
    "online course",
    "udemy course",

    // Travel
    "bus",
    "bus ticket",
    "auto",
    "cab",
    "ola",
    "uber",
    "metro",
    "train",
    "train ticket",
    "flight",
    "fuel",
    "petrol",
    "diesel",
    "bike servicing",
    "parking",
    "toll",
    "rickshaw",
    "shared auto",
    "e-rickshaw",
    "travel",

    // Lifestyle & subscriptions
    "movie",
    "outing",
    "party",
    "gaming",
    "subscription",
    "netflix",
    "spotify",
    "youtube premium",
    "prime video",

    // Shopping / fashion
    "shopping",
    "clothes",
    "tshirt",
    "shoes",
    "slippers",
    "watch",
    "accessories",

    // Grooming / beauty
    "haircut",
    "salon",
    "facial",
    "cosmetics",
    "cream",
    "hair serum",
    "hair spa",
    "hair oil",
    "hair color",
    "hair straightener service",

    // Leisure / sports
    "fun",
    "picnic",
    "hangout",
    "bowling",
    "pool",
    "sports",
    "cricket",
    "football",

    // Food outings
    "cafe",
    "restaurant",
    "dinner out",
    "celebration",

    // Digital purchases
    "app purchase",
    "in-game purchase",
    "course subscription",

    // Food delivery / quick commerce
    "zomato",
    "swiggy",
    "swiggy instamart",
    "blinkit",
    "zepto",
    "dunzo",
    "bigbasket",
    "amazon fresh",
    "jiomart",
    "amazon",
    "flipkart",
    "myntra",
    "ajio",
    "nykaa",

    // Kitchen / groceries continued
    "grocery",
    "vegetables",
    "milk",
    "bread",
    "rice",
    "dal",
    "atta",
    "sugar",
    "salt",
    "oil",
    "butter",
    "cheese",
    "curd",
    "dahi",
    "egg",

    // Kitchen specifics
    "masala",
    "garam masala",
    "spices",
    "mirchi",
    "haldi",
    "jeera",
    "coriander powder",
    "coriander leaf",
    "onion",
    "tomato",
    "potato",
    "garlic",
    "ginger",
    "ginger garlic paste",
    "soya chunks",
    "soyabean",
    "matar",
    "mushroom",
    "cornflakes",
    "oats",

    // Kitchen supplies
    "tawa",
    "pan",
    "pressure cooker",
    "lighter",
    "foil paper",
    "strainer",
    "knife",
    "plates",
    "glasses",

    // Cleaning items
    "surf",
    "dishwasher",
    "scrubber",

    // Personal / bathroom
    "razor",
    "tissue paper",

    // For women / personal care
    "sanitary pads",
    "tampons",
    "menstrual cup",
    "intimate wash",
    "makeup remover",
    "cotton pads",
    "nail polish",
    "nail remover",
    "lip balm",
    "lipstick",
    "foundation",
    "compact powder",
    "bb cream",
    "kajal",
    "eyeliner",
    "mascara",

    // Misc and fallback
    "sunscreen",
    "face wash",
    "moisturizer",
    "face cream",
    "face mask",
    "sheet mask",
    "scrub",
    "toner",
    "serum",
    "aloe vera gel",
    "kurti",
    "top",
    "leggings",
    "dupatta",
    "skirt",
    "earrings",
    "jewellery",
    "handbag",
    "wallet",
    "scarf",
    "heels",
    "sandals",
    "scrunchies",
    "hair clips",
    "beauty parlour",
    "others",
  ];

  // Helper function to get group ID
  const getGroupId = (group) => group?.groupCode || group?.code || group?.id;
  // Helper to get numeric group id (preferred for backend payload expecting List<Integer>)
  const getGroupNumericId = (group) => {
    // prefer explicit numeric id fields
    if (!group) return null;
    if (typeof group.id === "number") return group.id;
    if (typeof group.groupId === "number") return group.groupId;
    // sometimes id can be a numeric string
    const candidate = group.id ?? group.groupId ?? group._id ?? group.code ?? group.groupCode;
    const n = Number(candidate);
    return Number.isFinite(n) ? n : null;
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date().toISOString().split("T")[0]);
      // Fetch groups immediately when mo  dal opens
      fetchAllGroups();
    } else {
      // Reset state when modal closes
      setAllGroups([]);
      setSelectedGroupsForExpense([]);
    }
  }, [isOpen, currentGroup]);

  const fetchAllGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const groups = await contextFetchAllGroups();
      setAllGroups(groups || []);
    } catch (error) {
      // Failed to fetch groups
      setAllGroups([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  const addStartTime = Date.now();
    setIsLoading(true);

    // Check if user has enough coins before proceeding
    if (parseFloat(amount) > remainingCoins) {
      toast.error('Please add some coins to add this expense.', {
        duration: 2500,
        position: 'top-center',
      });
      setIsLoading(false);
      return;
    }
    if (amount && tags.length > 0 && selectedDate && currentGroup) {
      // send numeric group IDs to backend (List<Integer> groupIds)
      const groupIds = [
        getGroupNumericId(currentGroup),
        ...selectedGroupsForExpense.map((group) => getGroupNumericId(group)),
      ].filter((g) => g !== null && typeof g !== "undefined");

      const expense = {
        amount: Math.round(parseFloat(amount) * 100) / 100,
        paymentDate: selectedDate,
        tags: tags.filter((tag) => tag.trim() !== ""),
        groupIds: groupIds,
      };

      try {
        const token = localStorage.getItem("token");

        const response = await axios.post(
          getApiUrl("/pg/addExpenseToGroups"),
          expense,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = response.data;

        //the response from the backend
        console.log("Expense added successfully:", data);
        // Add the returned expense directly to the currentGroup context
        if (setCurrentGroup && currentGroup && data) {
          const newExpense = {
            ...data,
            amount: data.amount,
            tags: data.tags,
            paymentDate: data.paymentDate,
            paidBy: data.paidBy,
            createdAt: data.createdAt,
            id: data.id || data._id,
          };
          setCurrentGroup({
            ...currentGroup,
            expenses: [...(currentGroup.expenses || []), newExpense],
          });
        }
        // Update total amount
        if (setTotalExpenses && typeof data.user?.totalExpenses !== "undefined") {
          setTotalExpenses(data.user.totalExpenses);
        }
        // Update remaining coins
        if (setRemainingCoins && typeof data.user?.remainingCoins !== "undefined") {
          setRemainingCoins(data.user.remainingCoins);
        }
        // Update monthly limit
        if (setMonthlyLimit && typeof data.user?.monthlyLimitCoins !== "undefined") {
          setMonthlyLimit(data.user.monthlyLimitCoins);
        }
  const totalGroups = (groupIds || []).length;
        // Calculate and show time taken
        const timeTakenMs = Date.now() - addStartTime;
        const timeTakenSec = timeTakenMs / 1000;
        toast.success(`You added in just ${timeTakenSec.toFixed(2)} second${timeTakenSec < 2 ? '' : 's'}!`, {
          duration: 3000,
          position: "top-center",
        });

        // 🎉 Trigger confetti if added in <= 2 sec
        if (timeTakenSec <= 2 && onCelebrate) {
          onCelebrate();
        }
        // Show modern popup if added in <= 2 sec
        if (timeTakenSec <= 2 && onQuickAdd) {
          onQuickAdd(timeTakenMs);
        }
        handleClose();

      } catch (error) {
        // Failed to add expense
        toast.error("First set your monthly limit", {
          duration: 2000,
          position: "top-center",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (!currentGroup) {
      toast.error("No group selected. Please select a group first.", {
        duration: 3000,
        position: "top-center",
      });
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setTags([]);
    setNewTag("");
    setSelectedGroupsForExpense([]);
    setAllGroups([]);
    setIsLoadingGroups(false); // Reset loading state
    onClose();
     

  };

  const toggleGroupSelection = (group) => {
    const groupId = getGroupId(group);

    setSelectedGroupsForExpense((prev) => {
      const isSelected = prev.some(
        (selectedGroup) => getGroupId(selectedGroup) === groupId
      );

      if (isSelected) {
        return prev.filter(
          (selectedGroup) => getGroupId(selectedGroup) !== groupId
        );
      } else {
        return [...prev, group];
      }
    });
  };

  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleNewTagKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const suggestedTags = commonTags
    .filter((tag) => !tags.includes(tag) && tag.includes(newTag.toLowerCase()))
    .slice(0, 8);


  // if (!isOpen) {
  //   return null;
  // }
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
                {currentGroup && (
                  <div className="text-sm text-gray-600 mt-1">
                    <p>
                      Adding to:{" "}
                      <span className="font-medium text-blue-600">
                        {currentGroup.groupName ||
                          currentGroup.name ||
                          "Current Group"}
                      </span>
                    </p>
                    {selectedGroupsForExpense.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        + {selectedGroupsForExpense.length} additional group
                        {selectedGroupsForExpense.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Form Container with Scroll */}
            <div className="flex-1 overflow-y-auto">
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <IndianRupee className="h-4 w-4 inline mr-1" />
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="h-4 w-4 inline mr-1" />
                    Tags
                  </label>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          <strong>{tag}</strong>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-blue-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleNewTagKeyPress}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Add tags (e.g., grocery, milk)"
                    />
                    {newTag && (
                      <button
                        type="button"
                        onClick={() => addTag(newTag)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700"
                      >
                        <span
                          className="inline-flex items-center justify-center rounded-full bg-blue-100 animate-pulse"
                          style={{ width: 28, height: 28 }}
                        >
                          <Plus className="h-4 w-4 text-blue-600" />
                        </span>
                      </button>
                    )}
                  </div>

                  {suggestedTags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">
                        Suggested tags:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full border border-blue-400 hover:bg-blue-50"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Additional Groups Selection */}
                {(allGroups.length > 1 || isLoadingGroups) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Users className="h-4 w-4 inline mr-1" />
                      Want to add this expense to more groups?
                    </label>

                    {isLoadingGroups ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Loading groups...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const currentGroupId = getGroupId(currentGroup);
                          const otherGroups = allGroups.filter(
                            (group) => getGroupId(group) !== currentGroupId
                          );

                          if (otherGroups.length === 0) {
                            return (
                              <div className="text-sm text-gray-500">
                                No other groups available
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-wrap gap-2">
                              {otherGroups.map((group) => {
                                const groupId = getGroupId(group);
                                const isSelected = selectedGroupsForExpense.some(
                                  (selectedGroup) =>
                                    getGroupId(selectedGroup) === groupId
                                );

                                const typeKey = (group.groupType || group.type || group.group_type || '').toString().toUpperCase() || 'OTHERS';
                                const c = COLORS[typeKey] || COLORS.OTHERS;

                                return (
                                  <button
                                    key={groupId}
                                    type="button"
                                    onClick={() => toggleGroupSelection(group)}
                                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${isSelected ? (c.selectedBorder || c.border) : (c.border || 'border-gray-300')} ${isSelected ? (c.selectedText || c.text) : 'text-gray-700'} bg-white hover:bg-gray-50`}
                                  >
                                    {isSelected && (
                                      <Check className={`h-3 w-3 mr-1 ${c.text}`} />
                                    )}
                                    {group.groupName ||
                                      group.name ||
                                      "Unnamed Group"}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !amount || tags.length === 0 || !currentGroup || isLoading
                    }
                    className={`flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 ${
                      isLoading ? "cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? "Adding..." : "Add Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FlowItem {
  id: string;
  from: string;
  to: string;
  amount: number;
  type: "cash" | "invoice" | "stock" | "charge" | "revenue";
  delay?: number;
}

interface FlowAnimationProps {
  flows: FlowItem[];
  onComplete?: () => void;
}

const getEmojiForType = (type: FlowItem["type"]): string => {
  const emojiMap: Record<FlowItem["type"], string> = {
    cash: "💰",
    invoice: "📄",
    stock: "📦",
    charge: "💸",
    revenue: "📈",
  };
  return emojiMap[type];
};

const getColorForType = (type: FlowItem["type"], amount: number): string => {
  if (type === "charge") return "bg-red-600";
  if (amount > 0) return "bg-green-600";
  if (amount < 0) return "bg-red-600";
  return "bg-blue-600";
};

const getTextColorForType = (type: FlowItem["type"], amount: number): string => {
  if (type === "charge") return "text-red-400";
  if (amount > 0) return "text-green-400";
  if (amount < 0) return "text-red-400";
  return "text-blue-400";
};

export default function FlowAnimation({
  flows,
  onComplete,
}: FlowAnimationProps) {
  const [completedFlows, setCompletedFlows] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (completedFlows.size === flows.length && flows.length > 0) {
      onComplete?.();
    }
  }, [completedFlows, flows.length, onComplete]);

  const handleFlowComplete = (flowId: string) => {
    setCompletedFlows((prev) => new Set(prev).add(flowId));
  };

  return (
    <div className="flex flex-col gap-2 py-4">
      <AnimatePresence mode="wait">
        {flows.map((flow, index) => (
          <FlowRow
            key={flow.id}
            flow={flow}
            index={index}
            onComplete={() => handleFlowComplete(flow.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FlowRowProps {
  flow: FlowItem;
  index: number;
  onComplete: () => void;
}

function FlowRow({ flow, index, onComplete }: FlowRowProps) {
  const delay = flow.delay ?? index * 0.15;
  const emoji = getEmojiForType(flow.type);
  const bgColor = getColorForType(flow.type, flow.amount);
  const textColor = getTextColorForType(flow.type, flow.amount);
  const amountLabel = flow.amount > 0 ? `+${flow.amount}` : `${flow.amount}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay, duration: 0.3 }}
      className="h-10 flex items-center gap-3 px-4"
    >
      {/* FROM Label */}
      <div className="flex-shrink-0 w-24">
        <p className="text-xs font-medium text-gray-400 truncate">
          {flow.from}
        </p>
      </div>

      {/* Flow Track */}
      <div className="flex-1 relative h-6 flex items-center">
        {/* Background line */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-gray-600 to-gray-700" />
        </div>

        {/* Animated Token */}
        <motion.div
          initial={{ x: 0, opacity: 0, scale: 0.3 }}
          animate={{ x: "100%", opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            delay: delay + 0.2,
            duration: 1.2,
            type: "spring",
            stiffness: 100,
            damping: 15,
          }}
          onAnimationComplete={onComplete}
          className="absolute left-0"
        >
          <div className="relative">
            {/* Token background */}
            <div
              className={`${bgColor} rounded-full w-8 h-8 flex items-center justify-center shadow-lg transform -translate-x-1/2`}
            >
              {/* Emoji inside token */}
              <span className="text-lg leading-none">{emoji}</span>
            </div>

            {/* Amount badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: delay + 0.3,
                duration: 0.4,
              }}
              className={`absolute -top-3 -right-2 ${textColor} text-xs font-bold bg-gray-800 px-1.5 py-0.5 rounded-full border border-gray-700`}
            >
              {amountLabel}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* TO Label */}
      <div className="flex-shrink-0 w-24">
        <p className="text-xs font-medium text-gray-400 text-right truncate">
          {flow.to}
        </p>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  Variants,
} from "framer-motion";

interface CausalStep {
  icon: string;
  label: string;
  type: "operational" | "financial" | "result";
  value?: string;
  isPositive?: boolean;
}

interface CausalChainProps {
  decision: string;
  steps: CausalStep[];
  visible: boolean;
  onComplete?: () => void;
}

const getTypeColor = (type: CausalStep["type"]): string => {
  switch (type) {
    case "operational":
      return "border-l-4 border-l-blue-500";
    case "financial":
      return "border-l-4 border-l-amber-500";
    case "result":
      return "border-l-4 border-l-emerald-500";
    default:
      return "border-l-4 border-l-gray-500";
  }
};

const getDeltaBadgeColor = (
  isPositive?: boolean,
  type?: CausalStep["type"]
): string => {
  if (type === "result") {
    return isPositive
      ? "bg-emerald-900 text-emerald-200"
      : "bg-red-900 text-red-200";
  }
  return isPositive
    ? "bg-emerald-900 text-emerald-200"
    : "bg-red-900 text-red-200";
};

const stepVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
    },
  },
};

const arrowVariants: Variants = {
  hidden: {
    scaleY: 0,
    opacity: 0,
  },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 12,
      duration: 0.5,
    },
  },
  exit: {
    scaleY: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const headerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

// One-shot highlight for result steps (no infinite repeat)
const pulseVariants: Variants = {
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(16, 185, 129, 0)",
      "0 0 0 8px rgba(16, 185, 129, 0.15)",
      "0 0 0 0 rgba(16, 185, 129, 0)",
    ],
    transition: {
      duration: 1.2,
      repeat: 0,
    },
  },
};

export default function CausalChain({
  decision,
  steps,
  visible,
  onComplete,
}: CausalChainProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (visible) {
      controls.start("visible");
    } else {
      controls.start("exit");
    }
  }, [visible, controls]);

  const handleAnimationComplete = async () => {
    // Optional callback when all animations are done
    if (onComplete && visible) {
      onComplete();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          className="w-full max-w-2xl mx-auto space-y-2"
          initial="hidden"
          animate="visible"
          exit="exit"
          onAnimationComplete={handleAnimationComplete}
        >
          {/* Header - Decision Title */}
          <motion.div
            variants={headerVariants}
            custom={0}
            className="mb-6 rounded-lg bg-gray-800 border border-gray-700 p-4 border-l-4 border-l-violet-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Décision
                </p>
                <p className="text-lg font-semibold text-white">{decision}</p>
              </div>
            </div>
          </motion.div>

          {/* Steps Chain */}
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* Connecting Arrow */}
              {index > 0 && (
                <motion.div
                  variants={arrowVariants}
                  custom={index}
                  initial="hidden"
                  animate={controls}
                  exit="exit"
                  transition={{ delay: 0.3 * index }}
                  className="flex justify-center"
                  style={{ originY: 0 }}
                >
                  <div className="w-1 h-6 bg-gradient-to-b from-gray-600 to-gray-700" />
                </motion.div>
              )}

              {/* Step Card */}
              <motion.div
                variants={stepVariants}
                custom={index}
                initial="hidden"
                animate={controls}
                exit="exit"
                transition={{ delay: 0.3 * index }}
                className={`rounded-lg bg-gray-800 border border-gray-700 p-4 ${getTypeColor(step.type)} transition-shadow duration-300 ${
                  step.type === "result"
                    ? "hover:shadow-lg hover:shadow-emerald-500/20"
                    : ""
                }`}
              >
                {step.type === "result" && visible ? (
                  <motion.div
                    variants={pulseVariants}
                    animate="pulse"
                    transition={{
                      delay: 0.3 * steps.length + 0.5,
                    }}
                    className="h-full"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <span className="text-3xl">{step.icon}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-300">{step.label}</p>
                        {step.value && (
                          <p className="text-xs text-gray-400 mt-1">
                            {step.value}
                          </p>
                        )}
                      </div>
                      {step.value && (
                        <div
                          className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${getDeltaBadgeColor(
                            step.isPositive,
                            step.type
                          )}`}
                        >
                          {step.isPositive ? "+" : ""}
                          {step.value.split(" ")[0]}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">{step.icon}</span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-300">{step.label}</p>
                      {step.value && (
                        <p className="text-xs text-gray-400 mt-1">
                          {step.value}
                        </p>
                      )}
                    </div>
                    {step.value && (
                      <div
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${getDeltaBadgeColor(
                          step.isPositive,
                          step.type
                        )}`}
                      >
                        {step.isPositive ? "+" : ""}
                        {step.value.split(" ")[0]}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </React.Fragment>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

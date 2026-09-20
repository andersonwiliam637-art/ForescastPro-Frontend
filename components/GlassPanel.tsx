"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { clsx } from "clsx";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function GlassPanel({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={clsx(
        "glass rounded-2xl p-5 md:p-6 pearl-glow",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
